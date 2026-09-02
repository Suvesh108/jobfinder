from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routers import ats, careers, v1
from config import load_companies_config
from cache import clear_all_cache, get_all_valid_cached_jobs

app = FastAPI(
    title="JobFinder ATS & Career-Page Crawler Service",
    description="Dedicated microservice on Port 8002 for Greenhouse, Lever, Ashby, Workday ATS & Playwright Career Pages.",
    version="2.0.0"
)

# CORS Middleware to allow requests from React Frontend & Scraper Orchestrator
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(v1.router)
app.include_router(ats.router)
app.include_router(careers.router)

@app.get("/health")
def health():
    companies = load_companies_config()
    cached = get_all_valid_cached_jobs()
    return {
        "status": "online",
        "service": "JobFinder ATS & Career Crawler",
        "port": 8002,
        "configured_companies": len(companies),
        "cached_jobs_count": len(cached),
        "supported_ats": ["greenhouse", "lever", "ashby", "workday", "generic_playwright"]
    }

@app.get("/companies")
def list_configured_companies():
    """Lists all active companies from companies.yaml."""
    companies = load_companies_config()
    return {
        "total": len(companies),
        "companies": [c.model_dump() for c in companies]
    }

@app.post("/cache/clear")
def clear_cache():
    """Clears the 6-hour SQLite cache."""
    clear_all_cache()
    return {"message": "Cache successfully cleared."}

if __name__ == "__main__":
    print("Starting JobFinder ATS & Career Crawler on http://localhost:8002...")
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
