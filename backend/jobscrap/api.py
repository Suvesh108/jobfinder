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

VERSION_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "version.json")

def get_installed_version() -> Dict[str, Any]:
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "version": "v0.3",
        "commit": "1ac248b69eb73f8ad420b08ca3217d9cd77a24e8",
        "shortCommit": "1ac248b",
        "date": "2026-09-03",
        "message": "Release v0.3"
    }

def save_installed_version(data: Dict[str, Any]):
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

db.init_db()

app = FastAPI(title="JobScrap API", description="Autonomous India Job Aggregator REST API", version="1.0.0")

# Security: CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db.init_db()

@app.get("/health")
def health():
    ver = get_installed_version()
    return {
        "status": "ok",
        "engine": "JobScrap Custom Multi-Portal Engine",
        "version": ver.get("version", "v0.3"),
        "commit": ver.get("shortCommit", "1ac248b"),
        "port": 8000,
        "supported_sources": list(scrapers.SCRAPERS.keys())
    }

@app.get("/updater/check")
def check_scraper_update():
    ver = get_installed_version()
    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/Suvesh108/jobscrap/commits/main",
            headers={"User-Agent": "JobFinder-Scraper-Updater"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            sha = data.get("sha", "")
            msg = data.get("commit", {}).get("message", "").split("\n")[0]
            date = data.get("commit", {}).get("committer", {}).get("date", "")[:10]
            installed_sha = ver.get("commit", "")
            has_update = bool(sha and sha != installed_sha)
            detected_ver = "v0.4" if "v0.4" in msg.lower() else ("v0.3" if "v0.3" in msg.lower() else "latest")
            return {
                "installedVersion": ver.get("version", "v0.3"),
                "installedSha": installed_sha,
                "installedShortSha": ver.get("shortCommit", "1ac248b"),
                "latestSha": sha,
                "shortSha": sha[:7] if sha else "",
                "hasUpdate": has_update,
                "latestVersion": detected_ver,
                "latestMessage": msg,
                "latestDate": date
            }
    except Exception as e:
        return {
            "installedVersion": ver.get("version", "v0.3"),
            "installedSha": ver.get("commit", ""),
            "installedShortSha": ver.get("shortCommit", "1ac248b"),
            "latestSha": ver.get("commit", ""),
            "shortSha": ver.get("shortCommit", "1ac248b"),
            "hasUpdate": False,
            "error": str(e)
        }

@app.post("/updater/update")
def perform_scraper_update():
    jobscrap_dir = os.path.dirname(os.path.abspath(__file__))
    zip_url = "https://github.com/Suvesh108/jobscrap/archive/refs/heads/main.zip"
    temp_zip = os.path.join(jobscrap_dir, "_temp_update.zip")
    temp_dir = os.path.join(jobscrap_dir, "_temp_update")

    try:
        req = urllib.request.Request(zip_url, headers={"User-Agent": "JobFinder-Scraper-Updater"})
        with urllib.request.urlopen(req, timeout=20) as resp, open(temp_zip, "wb") as out:
            shutil.copyfileobj(resp, out)

        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        os.makedirs(temp_dir, exist_ok=True)

        with zipfile.ZipFile(temp_zip, "r") as z:
            z.extractall(temp_dir)

        inners = [os.path.join(temp_dir, d) for d in os.listdir(temp_dir) if os.path.isdir(os.path.join(temp_dir, d))]
        src_dir = inners[0] if inners else temp_dir

        preserved = {"jobs.db"}
        for item in os.listdir(src_dir):
            if item in preserved or item.startswith("."):
                continue
            s = os.path.join(src_dir, item)
            d = os.path.join(jobscrap_dir, item)
            if os.path.isfile(s):
                shutil.copy2(s, d)
            elif os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)

        new_sha = "c9a1ae3e09ae8028bb44c60b2c59b9dac2411957"
        new_msg = "Release v0.4"
        new_date = datetime.date.today().strftime("%Y-%m-%d")
        new_ver_name = "v0.4"

        try:
            req_c = urllib.request.Request(
                "https://api.github.com/repos/Suvesh108/jobscrap/commits/main",
                headers={"User-Agent": "JobFinder-Scraper-Updater"}
            )
            with urllib.request.urlopen(req_c, timeout=5) as resp_c:
                c_data = json.loads(resp_c.read().decode("utf-8"))
                new_sha = c_data.get("sha", new_sha)
                new_msg = c_data.get("commit", {}).get("message", "").split("\n")[0]
                new_date = c_data.get("commit", {}).get("committer", {}).get("date", "")[:10]
                if "v0.4" in new_msg.lower():
                    new_ver_name = "v0.4"
                elif "v0.5" in new_msg.lower():
                    new_ver_name = "v0.5"
        except Exception:
            pass

        new_ver = {
            "version": new_ver_name,
            "commit": new_sha,
            "shortCommit": new_sha[:7] if new_sha else "c9a1ae3",
            "date": new_date,
            "message": new_msg
        }
        save_installed_version(new_ver)
        return {
            "success": True, 
            "message": f"Successfully updated JobScrap to {new_ver['version']} ({new_ver['shortCommit']})!", 
            "version": new_ver
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_zip):
            try: os.remove(temp_zip)
            except Exception: pass
        if os.path.exists(temp_dir):
            try: shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception: pass

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
    results: int = Query(25, ge=1, le=100)
):
    # Frontend passes: /search?query=...&location=...&sources=internshala&results=25
    src = sources or source
    target_src = src.lower().strip() if src and src.lower().strip() != "all" else None
    
    # 1. Search DB for matching live jobs with query & location
    jobs = db.search_jobs(
        query=query,
        location=location,
        source=target_src,
        limit=results
    )
    
    # 2. If no jobs match with location, try query alone in DB
    if not jobs and query:
        jobs = db.search_jobs(
            query=query,
            source=target_src,
            limit=results
        )

    # 3. If still empty, return top jobs from that source so frontend ALWAYS gets genuine links
    if not jobs and target_src:
        jobs = db.search_jobs(source=target_src, limit=results)

    # 4. If target_src wasn't specified, return general recent jobs
    if not jobs:
        jobs = db.search_jobs(limit=results)

    out = []
    for j in jobs:
        sal = ""
        if j.get("min_salary_inr") and j.get("max_salary_inr"):
            sal = f"₹{j['min_salary_inr']:,} - ₹{j['max_salary_inr']:,}"
        out.append({
            "title": j["title"],
            "company": j["company"],
            "location": j.get("location") or "India",
            "salary": sal,
            "url": j["url"],
            "source": j["source"],
            "postedDate": j.get("posted_date") or j.get("scraped_at", "")[:10],
            "description": j.get("description") or ""
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
