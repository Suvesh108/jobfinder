import asyncio
import datetime
from typing import List, Tuple, Optional
from models import CompanyConfig, JobListing
from utils.location_filter import is_india_location
from cache import get_cached_company_jobs, set_cached_company_jobs

async def crawl_generic_career_page(company: CompanyConfig) -> List[JobListing]:
    """
    Crawls generic self-hosted careers pages using Playwright async with heuristic DOM extraction.
    Flags low-confidence extractions with confidence: 'low'.
    """
    # 1. Check 6h cache
    cached = get_cached_company_jobs(company.name)
    if cached is not None:
        return cached

    if not company.careers_url:
        return []

    jobs: List[JobListing] = []

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("[Generic Crawler] Playwright not installed. Skipping generic crawler.")
        return []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            # Navigate to careers URL with 20s timeout
            await page.goto(company.careers_url, timeout=25000, wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)  # Allow JS rendering to settle

            # Heuristic Extraction: Search for elements containing career links or role cards
            extracted_cards = await page.evaluate('''() => {
                const results = [];
                const jobKeywords = ['engineer', 'developer', 'designer', 'manager', 'lead', 'architect', 'qa', 'frontend', 'backend', 'full stack', 'devops', 'intern', 'analyst', 'product'];
                
                // 1. Look for anchor links
                const links = Array.from(document.querySelectorAll('a'));
                for (const a of links) {
                    const text = (a.innerText || '').trim();
                    const href = a.href || '';
                    if (!text || text.length < 4 || text.length > 80) continue;
                    
                    const lowerText = text.toLowerCase();
                    const lowerHref = href.toLowerCase();
                    
                    const matchesJob = jobKeywords.some(kw => lowerText.includes(kw) || lowerHref.includes(kw));
                    if (matchesJob && (lowerHref.includes('job') || lowerHref.includes('career') || lowerHref.includes('position') || lowerHref.includes('apply') || lowerHref.includes('/o/'))) {
                        // Attempt to locate sibling or parent location tag
                        let parentLoc = 'India';
                        const parent = a.closest('div, li, tr, article');
                        if (parent) {
                            const pText = parent.innerText;
                            if (pText.toLowerCase().includes('bangalore') || pText.toLowerCase().includes('bengaluru')) parentLoc = 'Bengaluru, Karnataka';
                            else if (pText.toLowerCase().includes('remote')) parentLoc = 'Remote, India';
                        }

                        results.push({
                            title: text,
                            url: href,
                            location: parentLoc,
                            description: text,
                            confidence: 'low'
                        });
                    }
                }
                return results.slice(0, 30);
            }''')

            await browser.close()

            today_str = datetime.date.today().strftime("%Y-%m-%d")
            for c in extracted_cards:
                jobs.append(JobListing(
                    title=c["title"],
                    company=company.name,
                    location=c.get("location", "India"),
                    salary="Not Specified",
                    url=c["url"],
                    source=f"careers:{company.name.lower().replace(' ', '_')}",
                    postedDate=today_str,
                    description=f"Direct opening on {company.name} careers portal.",
                    confidence=c.get("confidence", "low")
                ))

            # Store in cache
            set_cached_company_jobs(company.name, "generic", jobs)
            print(f"[Generic Crawler] [+] {company.name} (generic): {len(jobs)} jobs extracted.")
            return jobs

    except Exception as e:
        print(f"[Generic Crawler] [-] {company.name} error: {e}")
        return []
