import type { JobAdapter, JobListing } from './types';

// ==========================================
// MOCK GENERATOR (FALLBACK LAYER)
// ==========================================

const generateLinkedInMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Mumbai, Maharashtra';
  return [
    {
      title: `Software Engineer (${capQuery})`,
      company: 'Zepto',
      location: capLoc,
      salary: '₹14,00,000 - ₹18,00,000 a year',
      url: `https://www.linkedin.com/jobs/view/linkedin_mock_${Date.now()}_1`,
      source: 'LinkedIn',
      postedDate: new Date().toISOString().split('T')[0],
      description: `Zepto tech is hiring! Seeking developers to build logistics monitoring systems with ${capQuery} and Tailwind CSS.`,
    }
  ];
};

// ==========================================
// LOCAL NODE SERVICE ADAPTER
// Timeout: 6 minutes to allow deep pagination
// results: 200 — no cap
// ==========================================

const NODE_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes
const RESULTS_WANTED = 200;

export const linkedinAdapter: JobAdapter = {
  id: 'linkedin',
  name: 'LinkedIn',
  fetchJobs: async (query: string, location: string, postedAfter?: string): Promise<JobListing[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NODE_TIMEOUT_MS);

    const cookie = localStorage.getItem('karmtrack_apify_token') || '';

    try {
      console.log(`[Local Scraper] Querying Node scraper on port 8001 for LinkedIn: "${query}" in "${location}" (postedAfter: ${postedAfter}) — requesting ${RESULTS_WANTED} results`);
      let url = `http://127.0.0.1:8001/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&results=${RESULTS_WANTED}&cookie=${encodeURIComponent(cookie)}`;
      if (postedAfter) {
        url += `&postedAfter=${encodeURIComponent(postedAfter)}`;
      }
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service returned HTTP ${response.status}`);
      }

      const listings = await response.json();
      console.log(`[LinkedIn Adapter] Received ${Array.isArray(listings) ? listings.length : 0} jobs from Node service.`);
      if (Array.isArray(listings) && listings.length > 0) {
        return listings;
      }

      console.warn('[Local Scraper] LinkedIn returned empty results, falling back to mock data.');
      return generateLinkedInMock(query, location);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(
        `%c LinkedIn scraper not running — showing sample data. Run \`npm run scraper:linkedin\` to enable.`,
        'color: #F2B84B; font-weight: bold;'
      );
      console.error('[LinkedIn Scraper Error]', err);
      return generateLinkedInMock(query, location);
    }
  }
};
