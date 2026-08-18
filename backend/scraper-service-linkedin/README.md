# KarmTrack Local LinkedIn Scraper Service

This service uses `spinlud/linkedin-jobs-scraper` (Puppeteer) to scrape LinkedIn listings locally.

## Setup Instructions

1. Ensure you have Node.js (version 18+) installed.
2. Open terminal in this folder:
   ```bash
   cd scraper-service-linkedin
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Service

Start the Express server:
```bash
node index.js
```
The service will start on `http://localhost:8001`. You can test it by pinging:
- Health check: `http://localhost:8001/health`
- Scrape LinkedIn: `http://localhost:8001/search?query=React&location=Bengaluru`

## Session Cookie Setup (Optional)

If LinkedIn blocks anonymous scrapers on your network, you can supply your personal session cookie:
1. Log in to LinkedIn in your browser.
2. Open Developer Tools (F12) -> Application (Chrome) or Storage (Firefox) -> Cookies.
3. Find the cookie named `li_at` and copy its value.
4. Paste it either in the **App Settings** panel on the frontend, or create a `.env` file in this directory:
   ```env
   LI_AT_COOKIE=your_copied_li_at_cookie_here
   ```
