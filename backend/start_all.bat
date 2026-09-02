@echo off
echo Starting JobFinder JobSpy Backend Service on Port 8000...
cd scraper-service-py
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
