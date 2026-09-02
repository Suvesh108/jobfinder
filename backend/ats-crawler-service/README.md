# ATS & Company Career-Page Crawler Service (Port 8002)

FastAPI microservice aggregating live job openings directly from company **ATS platforms (Greenhouse, Lever, Ashby, Workday)** and **generic self-hosted careers pages** with zero anti-bot friction, high concurrency, and automated 6-hour caching.

## Quick Start
\ash
cd backend/ats-crawler-service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
\\n
## Endpoints
- GET /v1/jobs?keyword=&location=
- GET /ats/jobs?keyword=&location=
- GET /careers/jobs?keyword=&location=
- GET /companies
- GET /health
