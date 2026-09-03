import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import csv
import io
import json
import datetime
from typing import Optional, List, Dict, Any
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

import db
import scraper
import scrapers

app = FastAPI(
    title="JobScrap API", 
    description="Autonomous India Job Aggregator REST API & JobFinder Scraper Engine", 
    version="1.0.0"
)

# Security: CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_salary_display(job: Dict[str, Any]) -> str:
    min_s = job.get("min_salary_inr")
    max_s = job.get("max_salary_inr")
    if min_s and max_s:
        return f"₹{min_s/100000:.1f} - {max_s/100000:.1f} LPA"
    elif min_s:
        return f"₹{min_s/100000:.1f}+ LPA"
    elif max_s:
        return f"Up to ₹{max_s/100000:.1f} LPA"
    return "Not Specified"

def format_job_listing(j: Dict[str, Any]) -> Dict[str, Any]:
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    posted = j.get("posted_date")
    if posted:
        posted_str = str(posted).split("T")[0]
    else:
        posted_str = today_str

    return {
        "id": j.get("id"),
        "title": j.get("title", "Developer"),
        "company": j.get("company", "Tech Company"),
        "location": j.get("location") or "India",
        "salary": format_salary_display(j),
        "url": j.get("url", "https://google.com"),
        "source": str(j.get("source", "jobscrap")).capitalize(),
        "postedDate": posted_str,
        "posted_date": posted_str,
        "description": j.get("description") or f"Direct opening on {j.get('source')} for {j.get('title')}.",
        "job_type": j.get("job_type", "fulltime"),
        "experience_level": j.get("experience_level", "fresher/mid"),
        "status": j.get("status", "live")
    }

db.init_db()

@app.on_event("startup")
def startup_event():
    db.init_db()

@app.get("/health")
def health():
    return {
        "status": "ok", 
        "engine": "JobScrap Custom Multi-Portal Engine",
        "port": 8000,
        "supported_sources": list(scrapers.SCRAPERS.keys())
    }

@app.get("/stats")
def get_stats():
    jobs = db.get_all_jobs()
    live = sum(1 for j in jobs if j["status"] == "live")
    dead = sum(1 for j in jobs if j["status"] == "dead")
    unchecked = len(jobs) - live - dead
    by_src = {}
    for j in jobs:
        by_src[j["source"]] = by_src.get(j["source"], 0) + 1
    return {
        "total_jobs": len(jobs),
        "live": live,
        "dead": dead,
        "unchecked": unchecked,
        "sources": by_src
    }

@app.get("/jobs")
def get_jobs(
    query: Optional[str] = None,
    location: Optional[str] = None,
    source: Optional[str] = None,
    min_salary: Optional[int] = None,
    status: Optional[str] = Query(None, description="live | dead | unchecked"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    results = db.search_jobs(
        query=query,
        location=location,
        source=source,
        min_salary=min_salary,
        status=status,
        limit=limit,
        offset=offset
    )
    formatted = [format_job_listing(j) for j in results]
    return {"count": len(formatted), "offset": offset, "limit": limit, "jobs": formatted}

@app.get("/search")
def search_endpoint(
    query: str = Query(..., description="Job title / search keyword"),
    location: Optional[str] = Query("", description="Job location"),
    sources: Optional[str] = Query("all", description="Comma separated sources"),
    results: int = Query(30, description="Results per source"),
    postedAfter: Optional[str] = Query("", description="Cutoff date")
):
    """Unified Search endpoint for JobFinder frontend integration."""
    src_list = [s.strip().lower() for s in sources.split(",") if s.strip()] if sources else ["all"]
    
    # 1. First check local DB
    db_matches = []
    for s in src_list:
        db_s = None if s in ("all", "*") else s
        found = db.search_jobs(query=query, location=location or None, source=db_s, limit=results)
        db_matches.extend(found)

    # 2. If DB has few results, trigger on-the-fly live scraper for requested sources
    if len(db_matches) < 5:
        target_sources = list(scrapers.SCRAPERS.keys()) if "all" in src_list else [s for s in src_list if s in scrapers.SCRAPERS]
        if not target_sources:
            target_sources = ["instahyre", "internshala", "shine", "freshersworld", "apna", "indeed", "linkedin"]
        
        for src in target_sources[:4]:  # Top fast sources
            try:
                fn = scrapers.SCRAPERS.get(src)
                if fn:
                    scraped = fn(query=query, count=min(results, 15))
                    if scraped:
                        scraper.assign_dedup_groups(scraped)
                        for item in scraped:
                            db.upsert_job(item)
                            db_matches.append(item)
            except Exception as e:
                print(f"[Live Scrape] Error on {src}: {e}")

    # Remove duplicates
    seen_urls = set()
    unique_jobs = []
    for j in db_matches:
        u = j.get("url")
        if u and u not in seen_urls:
            seen_urls.add(u)
            unique_jobs.append(format_job_listing(j))

    return unique_jobs[:100]

@app.get("/jobs/{job_id}")
def get_job_by_id(job_id: str):
    with db.get_db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        return format_job_listing(dict(row))

@app.post("/scrape")
def trigger_scrape(
    background_tasks: BackgroundTasks,
    source: str = "all",
    query: str = "developer",
    count: int = Query(10, ge=1, le=50)
):
    background_tasks.add_task(scraper.run_pipeline, source=source, query=query, count=count)
    return {"message": f"Scrape task queued for source='{source}', query='{query}', count={count}."}

@app.post("/validate")
def trigger_validate(background_tasks: BackgroundTasks, stale_hours: int = 6):
    background_tasks.add_task(scraper.run_link_validation, stale_hours=stale_hours)
    return {"message": f"Validation task queued for stale_hours={stale_hours}."}

@app.get("/export")
def export_jobs(format: str = Query("json", pattern="^(json|csv)$"), status: Optional[str] = "live"):
    jobs = db.search_jobs(status=status, limit=10000, offset=0)
    formatted = [format_job_listing(j) for j in jobs]
    if format == "csv":
        output = io.StringIO()
        if formatted:
            writer = csv.DictWriter(output, fieldnames=list(formatted[0].keys()))
            writer.writeheader()
            writer.writerows(formatted)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=jobs.csv"}
        )
    return JSONResponse(content=formatted)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
