from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class JobListing(BaseModel):
    title: str = Field(..., description="Job Title / Role")
    company: str = Field(..., description="Company Name")
    location: str = Field(default="India", description="Work Location")
    salary: str = Field(default="Not Specified", description="Estimated or Listed Salary")
    url: str = Field(..., description="Application Link or Job URL")
    source: str = Field(..., description="Source tag, e.g. ats:greenhouse or careers:zerodha")
    postedDate: str = Field(default="", description="ISO YYYY-MM-DD posted date")
    description: str = Field(default="", description="Job description or requirements snippet")
    confidence: Literal["high", "medium", "low"] = Field(default="high", description="Extraction confidence score")

class CompanyConfig(BaseModel):
    name: str
    platform: Literal["greenhouse", "lever", "ashby", "workday", "generic"]
    slug: Optional[str] = None
    tenant: Optional[str] = None
    wd_instance: Optional[str] = None
    site: Optional[str] = None
    careers_url: Optional[str] = None
    enabled: bool = True

class CrawlStats(BaseModel):
    total_companies: int
    successful_companies: int
    failed_companies: int
    total_jobs_found: int
    duration_seconds: float
    errors: List[dict] = []
