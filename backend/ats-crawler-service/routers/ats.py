from fastapi import APIRouter, Query
from typing import List, Optional
from models import JobListing
from config import load_companies_config
from crawler.ats_crawler import crawl_all_ats_companies

router = APIRouter(prefix="/ats", tags=["ATS Native Crawler"])

@router.get("/jobs", response_model=List[JobListing])
async def get_ats_jobs(
    keyword: Optional[str] = Query(None, description="Filter jobs by title/description keyword"),
    location: Optional[str] = Query(None, description="Filter jobs by location keyword"),
    company: Optional[str] = Query(None, description="Filter by company name")
):
    """
    Pulls real-time jobs directly from company ATS platforms (Greenhouse, Lever, Ashby, Workday).
    Responses are cached for 6 hours.
    """
    companies = load_companies_config()
    jobs, stats = await crawl_all_ats_companies(companies)

    # Apply filters
    filtered = jobs
    if keyword and keyword.strip():
        kw = keyword.strip().lower()
        filtered = [j for j in filtered if kw in j.title.lower() or kw in j.description.lower()]

    if location and location.strip():
        loc = location.strip().lower()
        filtered = [j for j in filtered if loc in j.location.lower()]

    if company and company.strip():
        c_name = company.strip().lower()
        filtered = [j for j in filtered if c_name in j.company.lower()]

    return filtered

@router.get("/stats")
async def get_ats_stats():
    """Returns crawl performance and company health stats."""
    companies = load_companies_config()
    _, stats = await crawl_all_ats_companies(companies)
    return stats
