import httpx
import asyncio
import datetime
import html
import re
from typing import List, Tuple
from models import CompanyConfig, JobListing
from utils.location_filter import is_india_location
from cache import get_cached_company_jobs, set_cached_company_jobs

HTTP_TIMEOUT = 10.0  # 10s per request
MAX_RETRIES = 1

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    text = re.sub(r'<[^>]+>', ' ', str(raw_html))
    text = html.unescape(text)
    return re.sub(r'\s+', ' ', text).strip()

def normalize_date(date_str: str) -> str:
    if not date_str:
        return datetime.date.today().strftime("%Y-%m-%d")
    try:
        if isinstance(date_str, int) or (isinstance(date_str, str) and date_str.isdigit()):
            # Epoch timestamp in ms
            ts = int(date_str) / 1000 if len(str(date_str)) > 11 else int(date_str)
            return datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        dt = date_str.split("T")[0]
        if len(dt) == 10:
            return dt
    except Exception:
        pass
    return datetime.date.today().strftime("%Y-%m-%d")


# ── 1. GREENHOUSE CRAWLER ──
async def crawl_greenhouse(client: httpx.AsyncClient, company: CompanyConfig) -> List[JobListing]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{company.slug}/jobs?content=true"
    resp = await client.get(url, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    raw_jobs = data.get("jobs", [])
    
    listings: List[JobListing] = []
    for item in raw_jobs:
        loc_name = item.get("location", {}).get("name", "") or "India"
        if not is_india_location(loc_name):
            continue
            
        listings.append(JobListing(
            title=item.get("title", "Software Engineer").strip(),
            company=company.name,
            location=loc_name.strip(),
            salary="Not Specified",
            url=item.get("absolute_url") or f"https://boards.greenhouse.io/{company.slug}/jobs/{item.get('id')}",
            source=f"ats:greenhouse",
            postedDate=normalize_date(item.get("updated_at")),
            description=clean_html(item.get("content", ""))[:500],
            confidence="high"
        ))
    return listings


# ── 2. LEVER CRAWLER ──
async def crawl_lever(client: httpx.AsyncClient, company: CompanyConfig) -> List[JobListing]:
    url = f"https://api.lever.co/v0/postings/{company.slug}?mode=json"
    resp = await client.get(url, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    raw_jobs = resp.json()
    if not isinstance(raw_jobs, list):
        return []

    listings: List[JobListing] = []
    for item in raw_jobs:
        categories = item.get("categories", {})
        loc_name = categories.get("location", "") or item.get("workplaceType", "India")
        all_locs = f"{loc_name} {categories.get('allLocations', '')}"
        
        if not is_india_location(all_locs):
            continue

        listings.append(JobListing(
            title=item.get("text", "Developer").strip(),
            company=company.name,
            location=loc_name.strip() if loc_name else "India",
            salary="Not Specified",
            url=item.get("hostedUrl") or item.get("applyUrl") or f"https://jobs.lever.co/{company.slug}/{item.get('id')}",
            source=f"ats:lever",
            postedDate=normalize_date(item.get("createdAt")),
            description=clean_html(item.get("descriptionPlain") or item.get("description", ""))[:500],
            confidence="high"
        ))
    return listings


# ── 3. ASHBY CRAWLER ──
async def crawl_ashby(client: httpx.AsyncClient, company: CompanyConfig) -> List[JobListing]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{company.slug}"
    resp = await client.get(url, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    raw_jobs = data.get("jobs", [])

    listings: List[JobListing] = []
    for item in raw_jobs:
        loc_name = item.get("location", "") or item.get("secondaryLocations", "") or "India"
        if not is_india_location(str(loc_name)):
            continue

        listings.append(JobListing(
            title=item.get("title", "Engineer").strip(),
            company=company.name,
            location=str(loc_name).strip(),
            salary="Not Specified",
            url=item.get("jobUrl") or f"https://jobs.ashbyhq.com/{company.slug}/{item.get('id')}",
            source=f"ats:ashby",
            postedDate=normalize_date(item.get("publishedAt")),
            description=clean_html(item.get("descriptionHtml", ""))[:500],
            confidence="high"
        ))
    return listings


# ── 4. WORKDAY CRAWLER ──
async def crawl_workday(client: httpx.AsyncClient, company: CompanyConfig) -> List[JobListing]:
    # Workday CXS JSON API
    tenant = company.tenant or company.name.lower().replace(" ", "")
    instance = company.wd_instance or "wd5"
    site = company.site or "Careers"
    url = f"https://{tenant}.{instance}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "appliedFacets": {},
        "limit": 50,
        "offset": 0,
        "searchText": "India"
    }

    resp = await client.post(url, json=payload, headers=headers, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    raw_jobs = data.get("jobPostings", [])

    listings: List[JobListing] = []
    for item in raw_jobs:
        loc_name = item.get("locationsText", "") or "India"
        if not is_india_location(loc_name):
            continue

        external_path = item.get("externalPath", "")
        job_url = f"https://{tenant}.{instance}.myworkdayjobs.com/{site}{external_path}" if external_path else f"https://{tenant}.{instance}.myworkdayjobs.com/{site}"

        listings.append(JobListing(
            title=item.get("title", "Specialist").strip(),
            company=company.name,
            location=loc_name.strip(),
            salary="Not Specified",
            url=job_url,
            source=f"ats:workday",
            postedDate=normalize_date(item.get("postedOn")),
            description=item.get("bulletFields", [""])[0] if item.get("bulletFields") else "",
            confidence="high"
        ))
    return listings


# ── MASTER CONCURRENT FETCHER ──
async def fetch_company_jobs(client: httpx.AsyncClient, company: CompanyConfig) -> Tuple[str, List[JobListing], Optional[str]]:
    """Fetches jobs for a single company with 6h cache & retry once on failure."""
    # 1. Check 6-hour cache
    cached = get_cached_company_jobs(company.name)
    if cached is not None:
        return company.name, cached, None

    last_error = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            jobs: List[JobListing] = []
            if company.platform == "greenhouse":
                jobs = await crawl_greenhouse(client, company)
            elif company.platform == "lever":
                jobs = await crawl_lever(client, company)
            elif company.platform == "ashby":
                jobs = await crawl_ashby(client, company)
            elif company.platform == "workday":
                jobs = await crawl_workday(client, company)
            else:
                return company.name, [], f"Unsupported ATS platform: {company.platform}"

            # Save in 6-hour cache
            set_cached_company_jobs(company.name, company.platform, jobs)
            print(f"[ATS Crawler] [+] {company.name} ({company.platform}): {len(jobs)} India jobs.")
            return company.name, jobs, None

        except Exception as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                await asyncio.sleep(1.0)

    print(f"[ATS Crawler] [-] {company.name} ({company.platform}) failed after {MAX_RETRIES + 1} tries: {last_error}")
    return company.name, [], last_error


async def crawl_all_ats_companies(companies: List[CompanyConfig]) -> Tuple[List[JobListing], dict]:
    """Crawl all active ATS companies concurrently using asyncio + httpx."""
    ats_companies = [c for c in companies if c.platform in ["greenhouse", "lever", "ashby", "workday"]]
    
    start_time = datetime.datetime.now()
    all_jobs: List[JobListing] = []
    errors = []
    successful = 0

    headers = {
        "User-Agent": "JobFinder-Crawler/2.0 (Aggregator; Contact: dev@jobfinder.local)"
    }

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        tasks = [fetch_company_jobs(client, comp) for comp in ats_companies]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                errors.append({"error": str(res)})
            else:
                comp_name, jobs, err = res
                if err:
                    errors.append({"company": comp_name, "error": err})
                else:
                    successful += 1
                    all_jobs.extend(jobs)

    duration = (datetime.datetime.now() - start_time).total_seconds()
    stats = {
        "total_companies": len(ats_companies),
        "successful_companies": successful,
        "failed_companies": len(ats_companies) - successful,
        "total_jobs_found": len(all_jobs),
        "duration_seconds": round(duration, 2),
        "errors": errors
    }
    return all_jobs, stats
