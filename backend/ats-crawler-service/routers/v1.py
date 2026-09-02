from fastapi import APIRouter, Query
from typing import List, Optional
import asyncio
from models import JobListing
from config import load_companies_config
from crawler.ats_crawler import crawl_all_ats_companies
from crawler.generic_crawler import crawl_generic_career_page

router = APIRouter(prefix="/v1", tags=["Unified Aggregation (Port 8002)"])

@router.get("/jobs", response_model=List[JobListing])
async def get_unified_jobs(
    keyword: Optional[str] = Query(None, description="Job title or skill query"),
    location: Optional[str] = Query(None, description="Target location"),
    include_generic: bool = Query(True, description="Include generic Playwright career page crawler")
):
    """
    Main combined endpoint that pulls from both ATS-native APIs and generic career pages.
    Returns normalized job listings matching the format of ports 8000 & 8001.
    """
    companies = load_companies_config()

    # 1. Fetch ATS jobs
    ats_task = crawl_all_ats_companies(companies)

    # 2. Fetch Generic Career pages if enabled
    generic_tasks = []
    if include_generic:
        generic_companies = [c for c in companies if c.platform == "generic"]
        generic_tasks = [crawl_generic_career_page(c) for c in generic_companies]

    ats_res, *generic_res = await asyncio.gather(ats_task, *generic_tasks, return_exceptions=True)

    merged_jobs: List[JobListing] = []

    # Process ATS results
    if isinstance(ats_res, tuple) and isinstance(ats_res[0], list):
        merged_jobs.extend(ats_res[0])

    # Process Generic results
    for g_res in generic_res:
        if isinstance(g_res, list):
            merged_jobs.extend(g_res)

    # Apply keyword & location filters
    filtered = merged_jobs
    if keyword and keyword.strip():
        kw = keyword.strip().lower()
        filtered = [j for j in filtered if kw in j.title.lower() or kw in j.description.lower()]

    if location and location.strip():
        loc = location.strip().lower()
        filtered = [j for j in filtered if loc in j.location.lower()]

    return filtered
