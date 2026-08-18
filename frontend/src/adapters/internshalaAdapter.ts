import type { JobAdapter, JobListing } from './types';

const generateInternshalaMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Work from home';
  return [
    {
      title: `${capQuery} Development Internship`,
      company: 'Internshala Partner Organization',
      location: capLoc,
      salary: '₹6,00,000 / year (Equivalent)',
      url: `https://internshala.com/internship/detail/mock-${Date.now()}`,
      source: 'Internshala',
      postedDate: new Date().toISOString().split('T')[0],
      description: `Opportunity to work as a ${capQuery} Intern. You will design, build, test code, and coordinate closely with supervisors on project milestones.`,
    }
  ];
};

// Timeout: 5 minutes — Internshala paginates up to 15 pages with 800ms delay each
const INTERNSHALA_TIMEOUT_MS = 5 * 60 * 1000;
const RESULTS_WANTED = 200;
const NODE_BACKEND_URL = (import.meta.env.VITE_LINKEDIN_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://127.0.0.1:8001';

export const internshalaAdapter: JobAdapter = {
  id: 'internshala',
  name: 'Internshala',
  fetchJobs: async (query: string, location: string, postedAfter?: string): Promise<JobListing[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), INTERNSHALA_TIMEOUT_MS);

    try {
      console.log(`[Internshala Scraper] Querying ${NODE_BACKEND_URL} for Internshala: "${query}" in "${location}" (postedAfter: ${postedAfter}) — requesting ${RESULTS_WANTED} results`);
      let url = `${NODE_BACKEND_URL}/search-internshala?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&results=${RESULTS_WANTED}&job_offer=false`;
      if (postedAfter) {
        url += `&postedAfter=${encodeURIComponent(postedAfter)}`;
      }
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service returned HTTP ${response.status}`);
      }

      const listings = await response.json();
      console.log(`[Internshala Adapter] Received ${Array.isArray(listings) ? listings.length : 0} jobs from Node service.`);
      if (Array.isArray(listings) && listings.length > 0) {
        return listings;
      }

      console.warn('[Local Scraper] Internshala returned empty results, falling back to mock data.');
      return generateInternshalaMock(query, location);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(
        `%c Internshala scraper not running — showing sample data. Run \`node index.js\` inside scraper-service-linkedin to enable.`,
        'color: #F2B84B; font-weight: bold;'
      );
      console.error('[Internshala Scraper Error]', err);
      return generateInternshalaMock(query, location);
    }
  }
};
