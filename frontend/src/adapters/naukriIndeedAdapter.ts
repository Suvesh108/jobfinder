import type { JobAdapter, JobListing } from './types';

// ==========================================
// MOCK GENERATORS (FALLBACK LAYER)
// ==========================================

const generateNaukriMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Bengaluru, Karnataka';
  return [
    {
      title: `${capQuery} Developer - HTML/CSS/React`,
      company: 'Wipro Limited',
      location: capLoc,
      salary: '8 - 13 LPA',
      url: `https://www.naukri.com/job-listings-mock-${Date.now()}-1`,
      source: 'Naukri.com',
      postedDate: new Date().toISOString().split('T')[0],
      description: `EduTech/Service requirements. We are looking for an experienced ${capQuery} engineer to develop responsive dashboards. Skills: Javascript, React, TypeScript.`,
    },
    {
      title: `Senior Web UI Engineer (${capQuery})`,
      company: 'HCL Technologies',
      location: capLoc,
      salary: '10 - 15 LPA',
      url: `https://www.naukri.com/job-listings-mock-${Date.now()}-2`,
      source: 'Naukri.com',
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Hiring senior resource for development of responsive web applications. Ideal candidate must possess strong experience in ${capQuery} and state management.`,
    }
  ];
};

const generateIndeedMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Pune, Maharashtra';
  return [
    {
      title: `Frontend Developer - ${capQuery}`,
      company: 'Tata Consultancy Services (TCS)',
      location: capLoc,
      salary: '₹6,00,000 - ₹9,50,000 a year',
      url: `https://in.indeed.com/viewjob?jk=indeed_mock_${Date.now()}_1`,
      source: 'Indeed India',
      postedDate: new Date().toISOString().split('T')[0],
      description: `Responsible for building interactive interfaces using ${capQuery}. Work closely with UX designers to translate mockups into semantic code.`,
    }
  ];
};

const generateGlassdoorMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Mumbai, Maharashtra';
  return [
    {
      title: `Technical Architect (${capQuery})`,
      company: 'Glassdoor Verified Corp',
      location: capLoc,
      salary: '₹18,00,000 - ₹25,00,000 a year',
      url: `https://www.glassdoor.co.in/job-listings-mock-${Date.now()}`,
      source: 'Glassdoor',
      postedDate: new Date().toISOString().split('T')[0],
      description: `Join our verification analytics team! Looking for a seasoned ${capQuery} professional. Work involves API gateways, scale designs, and performance profiling.`,
    }
  ];
};

// ==========================================
// LOCAL PYTHON SERVICE ADAPTERS
// Timeout raised to 8 minutes to allow Python/jobspy to fully paginate all sources.
// results param raised to 200 to match the server-side high-count config.
// ==========================================

const PYTHON_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes — completeness over speed
const RESULTS_WANTED = 200;
const DEFAULT_PYTHON_URL = 'https://jobfinder-xgb9.onrender.com';
const PYTHON_BACKEND_URL = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || DEFAULT_PYTHON_URL;

export const naukriAdapter: JobAdapter = {
  id: 'naukri',
  name: 'Naukri.com',
  fetchJobs: async (query: string, location: string, postedAfter?: string): Promise<JobListing[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);

    try {
      console.log(`[Python Scraper] Querying ${PYTHON_BACKEND_URL} for Naukri: "${query}" in "${location}" (postedAfter: ${postedAfter}) — requesting ${RESULTS_WANTED} results`);
      let url = `${PYTHON_BACKEND_URL}/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&sources=naukri&results=${RESULTS_WANTED}`;
      if (postedAfter) {
        url += `&postedAfter=${encodeURIComponent(postedAfter)}`;
      }
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service returned HTTP ${response.status}`);
      }

      const listings = await response.json();
      console.log(`[Naukri Adapter] Received ${Array.isArray(listings) ? listings.length : 0} jobs from Python service.`);
      if (Array.isArray(listings) && listings.length > 0) {
        return listings;
      }
      
      console.warn('[Local Scraper] Naukri returned empty results, falling back to mock data.');
      return generateNaukriMock(query, location);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(
        `%c Naukri scraper not running — showing sample data. Run \`npm run scraper:jobspy\` to enable.`,
        'color: #F2B84B; font-weight: bold;'
      );
      console.error('[Naukri Scraper Error]', err);
      return generateNaukriMock(query, location);
    }
  }
};

export const indeedAdapter: JobAdapter = {
  id: 'indeed',
  name: 'Indeed India',
  fetchJobs: async (query: string, location: string, postedAfter?: string): Promise<JobListing[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);

    try {
      console.log(`[Python Scraper] Querying ${PYTHON_BACKEND_URL} for Indeed: "${query}" in "${location}" (postedAfter: ${postedAfter}) — requesting ${RESULTS_WANTED} results`);
      let url = `${PYTHON_BACKEND_URL}/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&sources=indeed&results=${RESULTS_WANTED}`;
      if (postedAfter) {
        url += `&postedAfter=${encodeURIComponent(postedAfter)}`;
      }
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service returned HTTP ${response.status}`);
      }

      const listings = await response.json();
      console.log(`[Indeed Adapter] Received ${Array.isArray(listings) ? listings.length : 0} jobs from Python service.`);
      if (Array.isArray(listings) && listings.length > 0) {
        return listings;
      }

      console.warn('[Python Scraper] Indeed returned empty results, falling back to mock data.');
      return generateIndeedMock(query, location);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(
        `%c Indeed scraper not running — showing sample data. Run \`npm run scraper:jobspy\` to enable.`,
        'color: #F2B84B; font-weight: bold;'
      );
      console.error('[Indeed Scraper Error]', err);
      return generateIndeedMock(query, location);
    }
  }
};

export const glassdoorAdapter: JobAdapter = {
  id: 'glassdoor',
  name: 'Glassdoor',
  fetchJobs: async (query: string, location: string, postedAfter?: string): Promise<JobListing[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);

    try {
      console.log(`[Python Scraper] Querying ${PYTHON_BACKEND_URL} for Glassdoor: "${query}" in "${location}" (postedAfter: ${postedAfter}) — requesting ${RESULTS_WANTED} results`);
      let url = `${PYTHON_BACKEND_URL}/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&sources=glassdoor&results=${RESULTS_WANTED}`;
      if (postedAfter) {
        url += `&postedAfter=${encodeURIComponent(postedAfter)}`;
      }
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service returned HTTP ${response.status}`);
      }

      const listings = await response.json();
      console.log(`[Glassdoor Adapter] Received ${Array.isArray(listings) ? listings.length : 0} jobs from Python service.`);
      if (Array.isArray(listings) && listings.length > 0) {
        return listings;
      }

      console.warn('[Local Scraper] Glassdoor returned empty results, falling back to mock data.');
      return generateGlassdoorMock(query, location);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(
        `%c Glassdoor scraper not running — showing sample data. Run \`npm run scraper:jobspy\` to enable.`,
        'color: #F2B84B; font-weight: bold;'
      );
      console.error('[Glassdoor Scraper Error]', err);
      return generateGlassdoorMock(query, location);
    }
  }
};
