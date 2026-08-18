import sys
import os

# Add backend/scraper-service-py directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend", "scraper-service-py"))

# Import app from backend/scraper-service-py/main.py
from main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
