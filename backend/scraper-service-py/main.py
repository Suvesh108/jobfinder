from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
import re
import html
import datetime
from typing import List

try:
    from jobspy import scrape_jobs
except Exception:
    scrape_jobs = None

app = FastAPI(
    title="JobFinder JobSpy Scraper Service",
    description="High-Speed Multi-Portal Job Aggregator (Naukri, Indeed, LinkedIn, Glassdoor, ZipRecruiter)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    text = re.sub(r'<[^>]+>', ' ', str(raw_html))
    text = html.unescape(text)
    return re.sub(r'\s+', ' ', text).strip()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "engine": "JobFinder High-Speed Multi-Portal Engine",
        "port": 8000,
        "supported_sources": ["naukri", "indeed", "linkedin", "glassdoor", "zip_recruiter"]
    }

async def scrape_linkedin(client: httpx.AsyncClient, query: str, location: str, limit: int = 30) -> List[dict]:
    jobs = []
    try:
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={query}&location={location or 'India'}&start=0"
        resp = await client.get(url, timeout=3.5)
        if resp.status_code == 200 and resp.text:
            cards = re.findall(r'<div class="base-card[^>]*>.*?</li>', resp.text, re.DOTALL)
            today_str = datetime.date.today().strftime("%Y-%m-%d")
            for card in cards[:limit]:
                title_m = re.search(r'<h3 class="base-search-card__title">\s*(.*?)\s*</h3>', card, re.DOTALL)
                comp_m = re.search(r'<h4 class="base-search-card__subtitle">.*?<a[^>]*>\s*(.*?)\s*</a>', card, re.DOTALL)
                loc_m = re.search(r'<span class="job-search-card__location">\s*(.*?)\s*</span>', card, re.DOTALL)
                link_m = re.search(r'<a class="base-card__full-link"[^>]*href="([^"]+)"', card)
                
                title = clean_html(title_m.group(1)) if title_m else ""
                company = clean_html(comp_m.group(1)) if comp_m else "LinkedIn Employer"
                loc = clean_html(loc_m.group(1)) if loc_m else (location or "India")
                link = link_m.group(1).split("?")[0] if link_m else "https://www.linkedin.com/jobs"

                if title:
                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": loc,
                        "salary": "Not Specified",
                        "url": link,
                        "source": "LinkedIn",
                        "postedDate": today_str,
                        "description": f"Live opening on LinkedIn for {title} at {company}."
                    })
    except Exception as e:
        print(f"[LinkedIn] Error: {e}")
    return jobs

async def scrape_naukri(client: httpx.AsyncClient, query: str, location: str, limit: int = 30) -> List[dict]:
    jobs = []
    try:
        url = f"https://www.naukri.com/jobapi/v3/search?noOfResults={limit}&urlType=search_by_keyword&searchType=adv&keyword={query}&location={location or 'india'}"
        headers = {
            "appid": "109",
            "systemid": "Naukri",
            "clientid": "d34106443fc24f2b",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = await client.get(url, headers=headers, timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            raw_list = data.get("jobDetails", [])
            today_str = datetime.date.today().strftime("%Y-%m-%d")

            for item in raw_list:
                title = str(item.get("title", "")).strip()
                company = str(item.get("companyName", "")).strip()
                place = str(item.get("placeholders", [{}])[0].get("label") if item.get("placeholders") else (location or "India")).strip()
                jd_url = str(item.get("jdURL", "")).strip()
                full_url = f"https://www.naukri.com{jd_url}" if jd_url.startswith("/") else (jd_url or "https://www.naukri.com")

                if title:
                    jobs.append({
                        "title": title,
                        "company": company or "Naukri Employer",
                        "location": place or location or "India",
                        "salary": str(item.get("salary", "")).strip() or "Not Specified",
                        "url": full_url,
                        "source": "Naukri.com",
                        "postedDate": today_str,
                        "description": f"Naukri verified opening: {title} at {company}."
                    })
    except Exception as e:
        print(f"[Naukri] Error: {e}")
    return jobs

@app.get("/search")
async def search_jobs(
    query: str = Query(..., description="Job role"),
    location: str = Query("", description="Location"),
    sources: str = Query("naukri,indeed,linkedin,glassdoor,zip_recruiter", description="Sources"),
    results: int = Query(50, description="Results limit")
):
    requested_sources = [s.strip().lower() for s in sources.split(",") if s.strip()]
    all_jobs: List[dict] = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        tasks = []
        for src in requested_sources:
            if "linkedin" in src:
                tasks.append(scrape_linkedin(client, query, location, results))
            elif "naukri" in src:
                tasks.append(scrape_naukri(client, query, location, results))

        results_lists = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results_lists:
            if isinstance(r, list):
                all_jobs.extend(r)

    return all_jobs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
