from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jobspy import scrape_jobs
import pandas as pd
import datetime
import math

app = FastAPI(title="KarmTrack Local Python Scraper Service")

# Enable CORS for localhost frontend integration
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
    return {"status": "ok"}


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

    for site in site_names:
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

        source_counts[site] = count
        all_listings.extend(listings)

    print(f"[JobSpy] Total raw across all sources: {len(all_listings)} | per-source: {source_counts}")
    return all_listings


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
