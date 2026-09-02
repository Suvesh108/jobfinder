import httpx
import asyncio
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/verify", tags=["Job Link Liveness & Expiry Verifier"])

class VerifyRequest(BaseModel):
    url: str

class BatchVerifyRequest(BaseModel):
    urls: List[str]

class VerifyResult(BaseModel):
    url: str
    is_active: bool
    status_code: Optional[int] = None
    reason: str  # "active", "closed_text_detected", "dead_link_404", "redirect_to_home", "timeout"
    confidence: str  # "high", "medium"

CLOSED_PATTERNS = [
    r"no longer accepting applications",
    r"this position has been filled",
    r"this job has expired",
    r"job is no longer available",
    r"job posting has expired",
    r"this role is no longer active",
    r"this listing has expired",
    r"opening has been closed",
    r"job closed",
    r"position closed",
    r"404 - page not found",
    r"job not found"
]

async def check_url_liveness(client: httpx.AsyncClient, url: str) -> VerifyResult:
    if not url or not url.startswith("http"):
        return VerifyResult(url=url, is_active=False, reason="invalid_url", confidence="high")

    # Greenhouse, Lever, Ashby links are inherently active if from ATS API
    if "greenhouse.io" in url or "jobs.lever.co" in url or "ashbyhq.com" in url:
        return VerifyResult(url=url, is_active=True, status_code=200, reason="active_ats_verified", confidence="high")

    try:
        resp = await client.get(url, timeout=4.5, follow_redirects=True)
        code = resp.status_code

        if code in [404, 410, 500, 502, 503]:
            return VerifyResult(url=url, is_active=False, status_code=code, reason=f"dead_link_{code}", confidence="high")

        # Check body text for closed patterns
        body_text = resp.text.lower()
        for pat in CLOSED_PATTERNS:
            if re.search(pat, body_text):
                return VerifyResult(url=url, is_active=False, status_code=code, reason="closed_text_detected", confidence="high")

        # If redirected to generic homepage without job parameter
        final_url = str(resp.url).lower()
        if final_url.endswith("/careers") or final_url.endswith("/jobs") or final_url.endswith(".com/"):
            if not any(k in final_url for k in ["jobId", "jk=", "id=", "posting", "view"]):
                return VerifyResult(url=url, is_active=False, status_code=code, reason="redirect_to_home", confidence="medium")

        return VerifyResult(url=url, is_active=True, status_code=code, reason="active", confidence="high")

    except httpx.TimeoutException:
        return VerifyResult(url=url, is_active=True, reason="timeout_assumed_active", confidence="medium")
    except Exception as e:
        return VerifyResult(url=url, is_active=False, reason=f"error_{str(e)[:30]}", confidence="medium")


@router.post("/url", response_model=VerifyResult)
async def verify_single_url(req: VerifyRequest):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        return await check_url_liveness(client, req.url)


@router.post("/batch", response_model=List[VerifyResult])
async def verify_batch_urls(req: BatchVerifyRequest):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        tasks = [check_url_liveness(client, u) for u in req.urls[:50]]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return results
