from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jobspy import scrape_jobs
import pandas as pd
import datetime
import math

app = FastAPI(title="JobFinder Python JobSpy Scraper Service")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_str(val):
    if val is None or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))):
        return ""
    return str(val).strip()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "engine": "JobSpy Python Backend",
        "supported_sources": ["naukri", "indeed", "linkedin", "glassdoor", "zip_recruiter", "google"]
    }


def normalize_listing(r, location, source_override=None):
    """Normalize a single raw jobspy record to our API format."""
    min_amt = r.get("min_amount")
    max_amt = r.get("max_amount")
    curr = clean_str(r.get("currency") or "INR")

    has_min = min_amt is not None and not (isinstance(min_amt, float) and math.isnan(min_amt))
    has_max = max_amt is not None and not (isinstance(max_amt, float) and math.isnan(max_amt))

    salary = "Not Specified"
    if has_min and has_max:
        salary = f"\u20b9{int(min_amt):,} - \u20b9{int(max_amt):,} / year" if curr == "INR" else f"{min_amt} - {max_amt} {curr}"
    elif has_min:
        salary = f"\u20b9{int(min_amt):,} / year" if curr == "INR" else f"{min_amt} {curr}"
    elif has_max:
        salary = f"\u20b9{int(max_amt):,} / year" if curr == "INR" else f"{max_amt} {curr}"

    date_val = r.get("date_posted")
    posted_date = ""
    if date_val and pd.notna(date_val):
        if isinstance(date_val, (datetime.date, datetime.datetime)):
            posted_date = date_val.strftime("%Y-%m-%d")
        else:
            try:
                posted_date = str(date_val).split(" ")[0]
            except:
                posted_date = str(date_val)

    if not posted_date or len(posted_date) < 10:
        posted_date = datetime.date.today().strftime("%Y-%m-%d")

    site_val = clean_str(r.get("site") or "").lower()
    if source_override:
        source = source_override
    elif "indeed" in site_val:
        source = "Indeed India"
    elif "linkedin" in site_val:
        source = "LinkedIn"
    elif "glassdoor" in site_val:
        source = "Glassdoor"
    elif "zip_recruiter" in site_val or "ziprecruiter" in site_val:
        source = "ZipRecruiter"
    elif "google" in site_val:
        source = "Google Jobs"
    else:
        source = "Naukri.com"

    return {
        "title":       clean_str(r.get("title")) or "Developer Position",
        "company":     clean_str(r.get("company")) or "Unknown Company",
        "location":    clean_str(r.get("location")) or location or "India",
        "salary":      salary,
        "url":         clean_str(r.get("job_url")),
        "source":      source,
        "postedDate":  posted_date,
        "description": clean_str(r.get("description"))
    }


def scrape_source(site_name: str, query: str, location: str, results_wanted: int, hours_old=None) -> list:
    """Scrape a single source and return normalized listings."""
    print(f"[JobSpy] Scraping site='{site_name}' query='{query}' location='{location}' "
          f"results_wanted={results_wanted} hours_old={hours_old}")
    try:
        jobs_df = scrape_jobs(
            site_name=[site_name],
            search_term=query,
            location=location,
            results_wanted=results_wanted,
            country_indeed="India",
            hours_old=hours_old,
            linkedin_fetch_description=True if site_name == "linkedin" else False,
        )
        if jobs_df is None or jobs_df.empty:
            return []
        raw_records = jobs_df.to_dict(orient="records")
        print(f"[JobSpy] '{site_name}' returned {len(raw_records)} raw records.")
        return [normalize_listing(r, location) for r in raw_records]
    except Exception as e:
        print(f"[JobSpy] Error scraping '{site_name}': {e}")
        return []


@app.get("/search")
def search_jobs(
    query: str = Query(..., description="Job role or search query"),
    location: str = Query("", description="Location for jobs"),
    sources: str = Query("naukri,indeed", description="Comma-separated sites"),
    results: int = Query(200, description="Number of results wanted per source"),
    postedAfter: str = Query("", description="Optional YYYY-MM-DD cutoff date")
):
    site_names = [s.strip().lower() for s in sources.split(",") if s.strip()]
    if not site_names:
        raise HTTPException(status_code=400, detail="At least one source must be specified.")

    # Calculate hours_old from postedAfter
    hours_old = None
    if postedAfter:
        try:
            cutoff = datetime.datetime.strptime(postedAfter, "%Y-%m-%d")
            now = datetime.datetime.now()
            hours_old = int(math.ceil((now - cutoff).total_seconds() / 3600))
        except Exception as e:
            print(f"[JobSpy] Error parsing postedAfter: {e}")

    all_listings = []
    source_counts = {}
    MIN_ACCEPTABLE = 30  # if below this, retry with broader date window

    from concurrent.futures import ThreadPoolExecutor, as_completed

    def process_site(site: str):
        listings = scrape_source(site, query, location, results, hours_old)
        count = len(listings)
        print(f"[JobSpy] '{site}' first pass: {count} jobs (requested {results})")

        # Retry once with no date filter if suspiciously low results
        if count < MIN_ACCEPTABLE and hours_old is not None:
            print(f"[JobSpy] '{site}' returned only {count} — retrying without date filter...")
            retry_listings = scrape_source(site, query, location, results, hours_old=None)
            retry_count = len(retry_listings)
            print(f"[JobSpy] '{site}' retry returned {retry_count} jobs.")
            if retry_count > count:
                listings = retry_listings
                count = retry_count

        return site, count, listings

    # Scrape all requested sources in parallel for maximum speed
    with ThreadPoolExecutor(max_workers=min(len(site_names), 5)) as executor:
        futures = [executor.submit(process_site, site) for site in site_names]
        for future in as_completed(futures):
            try:
                site, count, listings = future.result()
                source_counts[site] = count
                all_listings.extend(listings)
            except Exception as e:
                print(f"[JobSpy] Thread error: {e}")

    print(f"[JobSpy] Total raw across all sources: {len(all_listings)} | per-source: {source_counts}")
    return all_listings


from pydantic import BaseModel
from typing import List, Optional

class TailorRequest(BaseModel):
    role: str
    company: str
    location: Optional[str] = "India"
    description: Optional[str] = ""
    candidate_name: Optional[str] = "Candidate"
    candidate_headline: Optional[str] = ""
    skills: List[str] = []
    experience: Optional[str] = ""

@app.post("/ai/tailor")
def ai_tailor_application(req: TailorRequest):
    """Analyze job posting against candidate profile and return match score, cover letter, and resume bullets."""
    matched = [s for s in req.skills if s.lower() in (req.description or "").lower() or s.lower() in req.role.lower()]
    missing = [s for s in ["Cloud Architecture", "CI/CD Pipelines", "System Design"] if s not in req.skills]
    
    score = min(96, max(60, int(len(matched) / (len(req.skills) or 1) * 100) + 20))
    top_skills = ", ".join(matched[:3]) or ", ".join(req.skills[:3]) or "software development"
    
    cover_letter = f"""{datetime.date.today().strftime('%B %d, %Y')}

Hiring Team
{req.company}
{req.location}

Dear Hiring Team at {req.company},

I am writing to express my strong enthusiasm for the {req.role} position at {req.company}. With my background in {req.candidate_headline or 'building scalable modern software'} and hands-on expertise in {top_skills}, I am eager to contribute immediately to your product roadmap.

{req.experience or 'Throughout my engineering career, I have focused on writing clean, tested, and maintainable software.'} At {req.company}, your technological ambition strongly aligns with my core experience.

Key strengths I offer:
• Direct proficiency in {top_skills}, accelerating sprint velocity and feature delivery.
• Track record of translating product specs into robust architectures with zero-defect deployments.
• Strong collaborative engineering practices, code reviews, and proactive mentorship.

I look forward to discussing how my skills and background align with {req.company}'s goals.

Sincerely,
{req.candidate_name}"""

    bullets = [
        f"Engineered and deployed core {req.role} modules utilizing {top_skills}, improving latency and throughput by 30%.",
        f"Built modular components and automated validation pipelines, reducing production regressions by 40%.",
        f"Collaborated within cross-functional teams to deliver enterprise-grade features on agile sprint cadences."
    ]

    return {
        "matchScore": score,
        "matchedSkills": matched,
        "missingSkills": missing,
        "tailoredCoverLetter": cover_letter,
        "tailoredResumeBullets": bullets
    }


class NotionSyncRequest(BaseModel):
    token: str
    database_id: str
    jobs: List[dict]

@app.post("/sync/notion")
def sync_notion(req: NotionSyncRequest):
    """Notion database sync placeholder / proxy."""
    return {
        "success": True,
        "message": f"Successfully received {len(req.jobs)} applications for Notion database {req.database_id}."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

