# KarmTrack Local Python Scraper Service

This service uses `python-jobspy` to scrape Naukri.com and Indeed India listings locally via HTTP.

## Setup Instructions

1. Ensure you have Python 3.9+ installed.
2. Open terminal in this folder:
   ```bash
   cd scraper-service-py
   ```
3. (Recommended) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows (Command Prompt):
   venv\Scripts\activate
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
The service will be active at `http://localhost:8000`. You can test it by pinging:
- Health check: `http://localhost:8000/health`
- Scrape Naukri/Indeed: `http://localhost:8000/search?query=React&location=Bengaluru`
