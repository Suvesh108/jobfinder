from fastapi import APIRouter, Query
from typing import List, Optional
import asyncio
from models import JobListing
from config import load_companies_config
from crawler.generic_crawler import crawl_generic_career_page

router = APIRouter(prefix="/careers", tags=["Generic Careers Crawler"])

@router.get("/jobs", response_model=List[JobListing])
async def get_careers_jobs(
    keyword: Optional[str] = Query(None, description="Filter jobs by keyword"),
    location: Optional[str] = Query(None, description="Filter jobs by location")
):
    """
    Pulls jobs from self-hosted generic company careers pages using Playwright.
    """
    companies = load_companies_config()
    generic_companies = [c for c in companies if c.platform == "generic"]

    tasks = [crawl_generic_career_page(comp) for comp in generic_companies]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs: List[JobListing] = []
    for res in results:
        if isinstance(res, list):
            all_jobs.extend(res)

    filtered = all_jobs
    if keyword and keyword.strip():
        kw = keyword.strip().lower()
        filtered = [j for j in filtered if kw in j.title.lower() or kw in j.description.lower()]

    if location and location.strip():
        loc = location.strip().lower()
        filtered = [j for j in filtered if loc in j.location.lower()]

    return filtered
