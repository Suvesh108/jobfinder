@echo off
echo Starting JobFinder ATS & Career Crawler Service on Port 8002...
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
pause
