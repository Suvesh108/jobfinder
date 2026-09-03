import type { JobAdapter, JobListing } from './types';

// ==========================================
// SHARED INFRASTRUCTURE CONFIG & CACHE
// ==========================================

const ACTOR_CONFIG = {
  naukri: {
    actorId: 'epicscrapers/naukri-scraper',
    name: 'Naukri',
  },
  indeed: {
    actorId: 'misceres/indeed-scraper',
    name: 'Indeed India',
  },
  linkedin: {
    actorId: 'nexgendata/linkedin-jobs-scraper',
    name: 'LinkedIn',
  },
};

// Caching with 15-minute Time-To-Live (TTL)
interface CacheEntry {
  timestamp: number;
  results: JobListing[];
}
const cacheMap = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCachedResults = (source: string, query: string, location: string): JobListing[] | null => {
  const cacheKey = `${source.toLowerCase()}:${query.toLowerCase().trim()}:${location.toLowerCase().trim()}`;
  const entry = cacheMap.get(cacheKey);
  if (entry) {
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      console.log(`[Cache Hit] Serving ${source} search from cache`);
      return entry.results;
    } else {
      cacheMap.delete(cacheKey); // Expired
    }
  }
  return null;
};

const setCachedResults = (source: string, query: string, location: string, results: JobListing[]) => {
  const cacheKey = `${source.toLowerCase()}:${query.toLowerCase().trim()}:${location.toLowerCase().trim()}`;
  cacheMap.set(cacheKey, {
    timestamp: Date.now(),
    results,
  });
};

// Get API token from LocalStorage or environment variables
const getApifyToken = (): string | null => {
  return localStorage.getItem('karmtrack_apify_token') || (import.meta.env.VITE_APIFY_TOKEN as string) || null;
};

// ==========================================
// UNIFIED ACTOR RUNNER
// ==========================================

const runApifyActor = async (actorId: string, input: any): Promise<any[]> => {
  // Replace slash with tilde for API URL
  const apiActorId = actorId.replace('/', '~');
  const token = getApifyToken();
  if (!token) {
    throw new Error('Apify API token is missing.');
  }

  // 90-second timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const url = `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Apify run failed with status: ${response.status}`);
    }

    const items = await response.json();
    return Array.isArray(items) ? items : [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Apify request timed out after 90 seconds.');
    }
    throw err;
  }
};

// Relative date parser helper to generate YYYY-MM-DD
const parseRelativeDate = (relStr: string): string => {
  const today = new Date();
  if (!relStr) return today.toISOString().split('T')[0];
  const lowercase = relStr.toLowerCase().trim();
  if (lowercase.includes('today') || lowercase.includes('just now')) {
    return today.toISOString().split('T')[0];
  }
  if (lowercase.includes('yesterday') || lowercase.includes('1 day ago')) {
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().split('T')[0];
  }
  const match = lowercase.match(/(\d+)\s+days?\s+ago/);
  if (match) {
    const days = parseInt(match[1], 10);
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    return pastDate.toISOString().split('T')[0];
  }
  try {
    const parsed = new Date(relStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {}
  
  return today.toISOString().split('T')[0];
};

// ==========================================
// NORMALIZATION LAYER
// ==========================================

const normalizeApifyResult = (source: 'naukri' | 'indeed' | 'linkedin', item: any): JobListing => {
  switch (source) {
    case 'nukri' as any: // Fallback safety
    case 'naukri': {
      // epicscrapers/naukri-scraper raw fields:
      // - title, companyName, locationLabel, salaryLabel, jobURL, postedAt, jobDescription
      return {
        title: item.title || item.jobTitle || 'Developer Position',
        company: item.companyName || item.company || 'Unknown Company',
        location: item.locationLabel || item.location || 'India',
        salary: item.salaryLabel || 'Not Specified',
        url: item.jobURL || item.jobUrl || item.url || '',
        source: 'Naukri',
        postedDate: parseRelativeDate(item.postedAt || item.postedDate),
        description: item.jobDescription || item.description || item.snippet || '',
      };
    }
    case 'indeed': {
      // misceres/indeed-scraper fields:
      // - positionName, company, location, salary, url, postedAt, description
      return {
        title: item.positionName || item.title || 'Developer Position',
        company: item.company || 'Unknown Company',
        location: item.location || 'India',
        salary: item.salary || 'Not Specified',
        url: item.url || item.jobUrl || '',
        source: 'Indeed India',
        postedDate: parseRelativeDate(item.postedAt || item.postedDate),
        description: item.description || item.summary || '',
      };
    }
    case 'linkedin': {
      // nexgendata/linkedin-jobs-scraper fields:
      // - job_title, company_name, location, salary, job_url, posted_date, description
      return {
        title: item.job_title || item.title || 'Developer Position',
        company: item.company_name || item.company || 'Unknown Company',
        location: item.location || 'India',
        salary: item.salary || 'Not Specified',
        url: item.job_url || item.url || '',
        source: 'LinkedIn',
        postedDate: parseRelativeDate(item.posted_date || item.postedDate),
        description: item.description || '',
      };
    }
    default: {
      return {
        title: item.title || 'Developer Position',
        company: item.company || 'Unknown Company',
        location: item.location || 'India',
        salary: item.salary || 'Not Specified',
        url: item.url || '',
        source: 'Other',
        postedDate: new Date().toISOString().split('T')[0],
        description: item.description || '',
      };
    }
  }
};

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
      source: 'Naukri',
      postedDate: new Date().toISOString().split('T')[0],
      description: `EduTech/Service requirements. We are looking for an experienced ${capQuery} engineer to develop responsive dashboards. Skills: Javascript, React, TypeScript.`,
    },
    {
      title: `Senior Web UI Engineer (${capQuery})`,
      company: 'HCL Technologies',
      location: capLoc,
      salary: '10 - 15 LPA',
      url: `https://www.naukri.com/job-listings-mock-${Date.now()}-2`,
      source: 'Naukri',
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
// EXPORTED SOURCE ADAPTERS
// ==========================================

// --- NAUKRI ADAPTER ---
export const naukriAdapter: JobAdapter = {
  id: 'naukri',
  name: 'Naukri',
  fetchJobs: async (query: string, location: string): Promise<JobListing[]> => {
    const cached = getCachedResults('naukri', query, location);
    if (cached) return cached;

    const token = getApifyToken();
    if (!token) {
      console.warn('Apify API token is missing. Falling back to Naukri mock data.');
      return generateNaukriMock(query, location);
    }

    try {
      console.log(`[Apify] Launching epicscrapers/naukri-scraper for keyword "${query}" in "${location}"`);
      
      const rawResults = await runApifyActor(ACTOR_CONFIG.naukri.actorId, {
        keyword: query.trim(),
        location: location.trim() || undefined,
        maxResultsPerQuery: 10,
        proxyConfig: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        },
      });

      console.log(`[Apify] Naukri Scraper returned ${rawResults.length} raw results.`);

      const normalized = rawResults.map(item => normalizeApifyResult('naukri', item));
      
      if (normalized.length === 0) {
        console.warn('Apify returned empty Naukri results. Using mock fallback.');
        return generateNaukriMock(query, location);
      }

      setCachedResults('naukri', query, location, normalized);
      return normalized;
    } catch (err) {
      console.error('Apify Naukri Scraper run failed. Falling back to mock data:', err);
      return generateNaukriMock(query, location);
    }
  },
};

// --- INDEED ADAPTER ---
export const indeedAdapter: JobAdapter = {
  id: 'indeed',
  name: 'Indeed India',
  fetchJobs: async (query: string, location: string): Promise<JobListing[]> => {
    const cached = getCachedResults('indeed', query, location);
    if (cached) return cached;

    const token = getApifyToken();
    if (!token) {
      console.warn('Apify API token is missing. Falling back to Indeed mock data.');
      return generateIndeedMock(query, location);
    }

    try {
      console.log(`[Apify] Launching misceres/indeed-scraper for keyword "${query}" in "${location}"`);
      
      const rawResults = await runApifyActor(ACTOR_CONFIG.indeed.actorId, {
        position: query.trim(),
        location: location.trim() || undefined,
        country: 'IN',
        maxItemsPerSearch: 10,
        proxyConfig: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        },
      });

      console.log(`[Apify] Indeed Scraper returned ${rawResults.length} raw results.`);

      const normalized = rawResults.map(item => normalizeApifyResult('indeed', item));
      
      if (normalized.length === 0) {
        console.warn('Apify returned empty Indeed results. Using mock fallback.');
        return generateIndeedMock(query, location);
      }

      setCachedResults('indeed', query, location, normalized);
      return normalized;
    } catch (err) {
      console.error('Apify Indeed Scraper run failed. Falling back to mock data:', err);
      return generateIndeedMock(query, location);
    }
  },
};

// --- LINKEDIN ADAPTER ---
export const linkedinAdapter: JobAdapter = {
  id: 'linkedin',
  name: 'LinkedIn',
  fetchJobs: async (query: string, location: string): Promise<JobListing[]> => {
    const cached = getCachedResults('linkedin', query, location);
    if (cached) return cached;

    const token = getApifyToken();
    if (!token) {
      console.warn('Apify API token is missing. Falling back to LinkedIn mock data.');
      return generateLinkedInMock(query, location);
    }

    try {
      console.log(`[Apify] Launching nexgendata/linkedin-jobs-scraper for keyword "${query}" in "${location}"`);
      
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location || 'India')}`;

      const rawResults = await runApifyActor(ACTOR_CONFIG.linkedin.actorId, {
        urls: [searchUrl],
        maxResults: 10,
        proxyConfig: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        },
      });

      console.log(`[Apify] LinkedIn Scraper returned ${rawResults.length} raw results.`);

      const normalized = rawResults.map(item => normalizeApifyResult('linkedin', item));
      
      if (normalized.length === 0) {
        console.warn('Apify returned empty LinkedIn results. Using mock fallback.');
        return generateLinkedInMock(query, location);
      }

      setCachedResults('linkedin', query, location, normalized);
      return normalized;
    } catch (err) {
      console.error('Apify LinkedIn Scraper run failed. Falling back to mock data:', err);
      return generateLinkedInMock(query, location);
    }
  },
};
