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
# 1-CLICK OTA UPDATER ENDPOINTS FOR JOBSCRAP
# ══════════════════════════════════════════════════════════════

@app.get("/updater/version")
def get_version():
    return get_installed_version()

@app.get("/updater/check")
def check_update():
    """Checks GitHub for the latest commit on Suvesh108/jobscrap."""
    installed = get_installed_version()
    latest_info = {
        "hasUpdate": False,
        "installed": installed,
        "latest": installed
    }

    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/Suvesh108/jobscrap/commits/main",
            headers={"User-Agent": "JobFinder-JobScrap-Updater"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            latest_sha = data.get("sha", "")
            commit_msg = data.get("commit", {}).get("message", "").split("\n")[0]
            commit_date = data.get("commit", {}).get("committer", {}).get("date", "")[:10]

            latest_obj = {
                "version": "v0.2",
                "commit": latest_sha,
                "shortCommit": latest_sha[:7] if latest_sha else "",
                "date": commit_date,
                "message": commit_msg
            }
            
            has_update = bool(latest_sha and latest_sha != installed.get("commit"))
            return {
                "hasUpdate": has_update,
                "installed": installed,
                "latest": latest_obj
            }
    except Exception as e:
        return {
            "hasUpdate": False,
            "installed": installed,
            "latest": installed,
            "error": str(e)
        }

@app.post("/updater/update")
def perform_ota_update():
    """1-Click OTA Update: Downloads latest zip from GitHub and updates backend/jobscrap files."""
    installed = get_installed_version()
    jobscrap_dir = os.path.dirname(os.path.abspath(__file__))
    zip_url = "https://github.com/Suvesh108/jobscrap/archive/refs/heads/main.zip"
    temp_zip = os.path.join(jobscrap_dir, "_ota_update.zip")
    temp_extract = os.path.join(jobscrap_dir, "_ota_extracted")

    try:
        # 1. Download zip from GitHub
        req = urllib.request.Request(zip_url, headers={"User-Agent": "JobFinder-JobScrap-Updater"})
        with urllib.request.urlopen(req, timeout=20) as resp, open(temp_zip, "wb") as out:
            shutil.copyfileobj(resp, out)

        # 2. Extract files
        if os.path.exists(temp_extract):
            shutil.rmtree(temp_extract, ignore_errors=True)
        os.makedirs(temp_extract, exist_ok=True)

        with zipfile.ZipFile(temp_zip, "r") as z:
            z.extractall(temp_extract)

        # 3. Locate inner directory (e.g. jobscrap-main)
        inner_dirs = [os.path.join(temp_extract, d) for d in os.listdir(temp_extract) if os.path.isdir(os.path.join(temp_extract, d))]
        source_dir = inner_dirs[0] if inner_dirs else temp_extract

        # 4. Copy updated python files, preserving jobs.db
        preserved_files = {"jobs.db", "version.json", "api.py"}
        for item in os.listdir(source_dir):
            if item in preserved_files or item.startswith("."):
                continue
            s_path = os.path.join(source_dir, item)
            d_path = os.path.join(jobscrap_dir, item)
            if os.path.isfile(s_path):
                shutil.copy2(s_path, d_path)
            elif os.path.isdir(s_path):
                shutil.copytree(s_path, d_path, dirs_exist_ok=True)

        # Ensure scrapers.py has import urllib.parse
        scrapers_path = os.path.join(jobscrap_dir, "scrapers.py")
        if os.path.exists(scrapers_path):
            with open(scrapers_path, "r", encoding="utf-8") as f:
                sc_content = f.read()
            if "import urllib.parse" not in sc_content:
                with open(scrapers_path, "w", encoding="utf-8") as f:
                    f.write("import urllib.parse\n" + sc_content)

        # 5. Fetch latest commit metadata
        try:
            req_c = urllib.request.Request(
                "https://api.github.com/repos/Suvesh108/jobscrap/commits/main",
                headers={"User-Agent": "JobFinder-JobScrap-Updater"}
            )
            with urllib.request.urlopen(req_c, timeout=5) as resp_c:
                c_data = json.loads(resp_c.read().decode("utf-8"))
                new_sha = c_data.get("sha", installed.get("commit"))
                new_msg = c_data.get("commit", {}).get("message", "").split("\n")[0]
                new_date = c_data.get("commit", {}).get("committer", {}).get("date", "")[:10]
        except Exception:
            new_sha = "latest"
            new_msg = "Updated from GitHub main"
            new_date = datetime.date.today().strftime("%Y-%m-%d")

        new_version = {
            "version": "v0.2",
            "commit": new_sha,
            "shortCommit": new_sha[:7] if new_sha else "",
            "date": new_date,
            "message": new_msg
        }
        save_installed_version(new_version)

        return {
            "success": True,
            "message": f"Successfully updated JobScrap to {new_version['shortCommit']} ({new_version['message']})",
            "version": new_version
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OTA Update failed: {str(e)}")
    finally:
        # Cleanup temp artifacts
        if os.path.exists(temp_zip):
            try: os.remove(temp_zip)
            except Exception: pass
        if os.path.exists(temp_extract):
            try: shutil.rmtree(temp_extract, ignore_errors=True)
            except Exception: pass

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
