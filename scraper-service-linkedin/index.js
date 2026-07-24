const express = require('express');
const cors = require('cors');
const fs = require('fs');
const {
  LinkedinScraper,
  ERelevanceFilterOptions,
  ETimeFilterOptions,
  EJobTypeFilterOptions,
  events,
} = require('linkedin-jobs-scraper');
require('dotenv').config();

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── Helper: pick LinkedIn time filter from a postedAfter ISO date ─────────────
function resolveTimeFilter(postedAfterStr) {
  if (!postedAfterStr) return ETimeFilterOptions.ANY;

  const cutoff = new Date(postedAfterStr);
  const now = new Date();
  const diffDays = Math.floor((now - cutoff) / 86400000);

  if (diffDays <= 1)  return ETimeFilterOptions.DAY;
  if (diffDays <= 7)  return ETimeFilterOptions.WEEK;
  if (diffDays <= 30) return ETimeFilterOptions.MONTH;
  return ETimeFilterOptions.ANY;
}

app.get('/search', async (req, res) => {
  const { query, location, results, cookie, postedAfter } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // No cap — use the requested amount, default high
  const limit = parseInt(results) || 200;
  const targetLocation = location ? location.trim() : 'India';
  const timeFilter = resolveTimeFilter(postedAfter);

  // Cookie auth
  const activeCookie = cookie || process.env.LI_AT_COOKIE;
  if (activeCookie) {
    console.log('[LinkedIn] Using session cookie for authenticated search');
    process.env.LI_AT_COOKIE = activeCookie;
  } else {
    console.log('[LinkedIn] Anonymous session');
    delete process.env.LI_AT_COOKIE;
  }

  // ─── Windows browser auto-detection ──────────────────────────────────────────
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const executablePath = candidates.find(p => fs.existsSync(p)) || undefined;
  if (executablePath) console.log('[LinkedIn] Browser found:', executablePath);
  else console.log('[LinkedIn] Using bundled Chromium');

  const collectedJobs = [];

  const scraperPromise = new Promise((resolve) => {
    let scraper;
    try {
      scraper = new LinkedinScraper({
        headless: 'new',
        slowMo: 200,          // slightly slower = more stable on slow pages
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--lang=en-GB',
        ],
      });

      scraper.on(events.scraper.data, (data) => {
        if (!data.title) return;
        collectedJobs.push({
          title:       data.title,
          company:     data.company     || 'Unknown Company',
          location:    data.place       || data.location || targetLocation,
          salary:      data.salary      || 'Not Specified',
          url:         data.link        || '',
          source:      'LinkedIn',
          postedDate:  data.date        || new Date().toISOString().split('T')[0],
          description: data.description || '',
        });
        if (collectedJobs.length % 25 === 0) {
          console.log(`[LinkedIn] Collected ${collectedJobs.length} jobs so far...`);
        }
      });

      scraper.on(events.scraper.error, (err) => {
        console.error('[LinkedIn Event Error]', err.message || err);
      });

      scraper.on(events.scraper.end, () => {
        console.log(`[LinkedIn] Scraper ended. Total collected: ${collectedJobs.length} jobs.`);
        resolve();
      });

      // Run with high limit — library handles pagination internally
      scraper.run([
        {
          query: query.trim(),
          options: {
            locations: [targetLocation],
            limit,         // high limit drives deeper pagination
            filters: {
              relevance: ERelevanceFilterOptions.RELEVANT,
              time:      timeFilter,
            },
          },
        },
      ]).catch((err) => {
        console.error('[LinkedIn Run Error]', err.message || err);
        resolve();
      });

    } catch (e) {
      console.error('[LinkedIn Init Error]', e.message || e);
      resolve();
    }
  });

  // Generous 5-minute timeout — we prioritize count over speed
  const TIMEOUT_MS = 5 * 60 * 1000;
  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => {
      console.log(`[LinkedIn] ${TIMEOUT_MS / 1000}s timeout reached, returning ${collectedJobs.length} collected jobs.`);
      resolve();
    }, TIMEOUT_MS)
  );

  await Promise.race([scraperPromise, timeoutPromise]).catch(() => {});
  delete process.env.LI_AT_COOKIE;

  console.log(`[LinkedIn] Responding with ${collectedJobs.length} jobs.`);
  res.json(collectedJobs);
});

// ============================================================================
// INTERNSHALA ROUTE — paginated multi-page scraping
// ============================================================================
const axios = require('axios');
const cheerio = require('cheerio');

app.get('/search-internshala', async (req, res) => {
  const { query, location, results, job_offer } = req.query;
  const MAX_RESULTS = parseInt(results) || 200;
  const MAX_PAGES = 15;    // up to 15 pages of results
  const collected = [];
  const isJob = job_offer === 'true';
  const basePath = isJob ? 'jobs' : 'internships';
  const searchSlug = query ? `keywords-${encodeURIComponent(query)}` : '';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'X-Requested-With': 'XMLHttpRequest',
  };

  console.log(`[Internshala] Starting paginated scrape: query='${query}' limit=${MAX_RESULTS} maxPages=${MAX_PAGES}`);

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (collected.length >= MAX_RESULTS) {
      console.log(`[Internshala] Reached limit (${MAX_RESULTS}), stopping at page ${page}.`);
      break;
    }

    // Internshala paginates via /page-N/ in the URL path
    let url = `https://internshala.com/${basePath}/`;
    if (searchSlug) url += `${searchSlug}/`;
    if (page > 1)   url += `page-${page}/`;

    console.log(`[Internshala] Fetching page ${page}: ${url}`);

    try {
      const response = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(response.data);
      const cards = $('.individual_internship');

      if (cards.length === 0) {
        console.log(`[Internshala] Page ${page} returned 0 cards — stopping pagination.`);
        break;
      }

      let pageCount = 0;
      cards.each((_index, element) => {
        if (collected.length >= MAX_RESULTS) return false;

        const $el = $(element);
        const title = $el.find('h2.job-internship-name a').text().trim()
          || $el.find('.job-title-container').text().trim()
          || 'Internship / Job';
        let link = $el.find('h2.job-internship-name a').attr('href')
          || $el.find('.view_detail_button').attr('href') || '';
        if (link && !link.startsWith('http')) link = 'https://internshala.com' + link;

        const company  = $el.find('p.company-name').text().trim() || 'Unknown Company';
        const loc      = $el.find('.locations span').text().trim() || location || 'India';
        const stipend  = $el.find('span.stipend').text().trim() || 'Not Specified';
        const descText = $el.find('.about_job .text').text().trim();
        const description = descText
          || `Apply on Internshala. Stipend/Salary: ${stipend}. Location: ${loc}.`;
        const postedDate = new Date().toISOString().split('T')[0];

        if (title && link) {
          collected.push({ title, company, location: loc, salary: stipend, url: link, source: 'Internshala', postedDate, description });
          pageCount++;
        }
      });

      console.log(`[Internshala] Page ${page}: ${pageCount} jobs added. Total so far: ${collected.length}.`);

      // Polite delay between pages
      await new Promise(r => setTimeout(r, 800));

    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`[Internshala] Page ${page} returned 404 — stopping pagination.`);
      } else {
        console.error(`[Internshala] Error on page ${page}:`, err.message);
      }
      break;
    }
  }

  console.log(`[Internshala] Done. Total jobs collected: ${collected.length}`);
  res.json(collected);
});

const PORT = 8001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`LinkedIn & Internshala scraper service running on http://127.0.0.1:${PORT}`);
});
