import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import csv
import io
import json
import zipfile
import shutil
import urllib.request
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
    description="Autonomous India Job Aggregator REST API with 1-Click OTA Updater", 
    version="0.2.0"
)

# Security: CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VERSION_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "version.json")

def get_installed_version() -> Dict[str, Any]:
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "version": "v0.2",
        "commit": "8331be0f5b20d0c4b5b439960146c7e1a010a0cd",
        "shortCommit": "8331be0",
        "date": datetime.date.today().strftime("%Y-%m-%d"),
        "message": "Release v0.2"
    }

def save_installed_version(data: Dict[str, Any]):
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

db.init_db()

@app.on_event("startup")
def startup_event():
    db.init_db()

@app.get("/health")
def health():
    ver = get_installed_version()
    return {
        "status": "ok", 
        "engine": "JobScrap Custom Multi-Portal Engine",
        "version": ver.get("version", "v0.2"),
        "commit": ver.get("shortCommit", "8331be0"),
        "port": 8000,
        "supported_sources": list(scrapers.SCRAPERS.keys())
    }
# ══════════════════════════════════════════════════════════════
# SEARCH & STATS ENDPOINTS
# ══════════════════════════════════════════════════════════════

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

@app.get("/search")
def search_frontend_compatible(
    query: Optional[str] = None,
    location: Optional[str] = None,
    sources: Optional[str] = None,
    source: Optional[str] = None,
    results: int = Query(30, ge=1, le=100)
):
    src = sources or source
    src_filter = src if src and src != "all" else None
    
    # Check DB first
    jobs = db.search_jobs(
        query=query,
        location=location,
        source=src_filter,
        status="live",
        limit=results
    )
    if not jobs:
        jobs = db.search_jobs(
            query=query,
            location=location,
            source=src_filter,
            limit=results
        )

    # If DB has very few results and a specific source was requested, run live scrape on-the-fly
    if len(jobs) < 3 and src_filter and src_filter in scrapers.SCRAPERS and query:
        try:
            fn = scrapers.SCRAPERS.get(src_filter)
            if fn:
                scraped = fn(query=query, count=min(results, 15))
                if scraped:
                    scraper.assign_dedup_groups(scraped)
                    for item in scraped:
                        db.upsert_job(item)
                    jobs = scraped
        except Exception as e:
            print(f"[Live Scrape] Error on {src_filter}: {e}")

    out = []
    seen_urls = set()
    for j in jobs:
        u = j.get("url")
        if not u or u in seen_urls:
            continue
        seen_urls.add(u)

        sal = ""
        if j.get("min_salary_inr") and j.get("max_salary_inr"):
            sal = f"₹{j['min_salary_inr']/100000:.1f} - {j['max_salary_inr']/100000:.1f} LPA"
        elif j.get("min_salary_inr"):
            sal = f"₹{j['min_salary_inr']/100000:.1f}+ LPA"
        else:
            sal = "Not Specified"

        out.append({
            "title": j["title"],
            "company": j["company"],
            "location": j.get("location") or location or "India",
            "salary": sal,
            "url": u,
            "source": str(j["source"]).capitalize(),
            "postedDate": j.get("posted_date") or j.get("scraped_at", "")[:10] or datetime.date.today().strftime("%Y-%m-%d"),
            "description": j.get("description") or f"Direct verified opening on {j['source']} for {j['title']}."
        })

    return out

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
    return {"count": len(results), "offset": offset, "limit": limit, "jobs": results}

@app.get("/jobs/{job_id}")
def get_job_by_id(job_id: str):
    with db.get_db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        return dict(row)

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
    if format == "csv":
        output = io.StringIO()
        if jobs:
            writer = csv.DictWriter(output, fieldnames=list(jobs[0].keys()))
            writer.writeheader()
            writer.writerows(jobs)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=jobs.csv"}
        )
    return JSONResponse(content=jobs)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
