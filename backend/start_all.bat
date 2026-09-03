@echo off
echo Starting JobScrap Custom Backend Service on Port 8000...
python -m uvicorn jobscrap.api:app --host 0.0.0.0 --port 8000 --reload
pause
