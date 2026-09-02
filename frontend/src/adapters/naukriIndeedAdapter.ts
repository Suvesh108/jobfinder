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
      description: `We are looking for an experienced ${capQuery} engineer to develop responsive dashboards. Skills: Javascript, React, TypeScript.`,
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

const generateLinkedInMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Bengaluru, Karnataka';
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

const generateZipRecruiterMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Remote, India';
  return [
    {
      title: `Full Stack Engineer - ${capQuery}`,
      company: 'ZipRecruiter Partner Tech',
      location: capLoc,
      salary: '₹12,00,000 - ₹20,00,000 a year',
      url: `https://www.ziprecruiter.com/job/mock-${Date.now()}`,
      source: 'ZipRecruiter',
      postedDate: new Date().toISOString().split('T')[0],
      description: `Engineering role for ${capQuery} specialists. Distributed team building resilient cloud services.`,
    }
  ];
};

// ==========================================
// LOCAL PYTHON JOBSPY SERVICE ADAPTERS
// ==========================================

const PYTHON_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes
const RESULTS_WANTED = 200;
const DEFAULT_PYTHON_URL = 'https://jobfinder-xgb9.onrender.com';
const PYTHON_BACKEND_URL = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || DEFAULT_PYTHON_URL;

const fetchFromJobSpy = async (
  sourceId: string,
  sourceName: string,
  query: string,
  location: string,
  postedAfter?: string,
  mockFallback?: (q: string, l: string) => JobListing[]
): Promise<JobListing[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);

  try {
    console.log(`[JobSpy] Querying ${PYTHON_BACKEND_URL} for ${sourceName}: "${query}" in "${location}" (postedAfter: ${postedAfter})`);
    let url = `${PYTHON_BACKEND_URL}/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&sources=${encodeURIComponent(sourceId)}&results=${RESULTS_WANTED}`;
    if (postedAfter) {
      url += `&postedAfter=${encodeURIComponent(postedAfter)}`;
    }
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Service returned HTTP ${response.status}`);
    }

    const listings = await response.json();
    console.log(`[JobSpy ${sourceName}] Received ${Array.isArray(listings) ? listings.length : 0} jobs.`);
    if (Array.isArray(listings) && listings.length > 0) {
      return listings;
    }
    
    return mockFallback ? mockFallback(query, location) : [];
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`%c JobSpy scraper for ${sourceName} offline or returned error. Showing mock data.`, 'color: #F59E0B; font-weight: bold;');
    console.error(`[JobSpy ${sourceName} Error]`, err);
    return mockFallback ? mockFallback(query, location) : [];
  }
};

export const naukriAdapter: JobAdapter = {
  id: 'naukri',
  name: 'Naukri.com',
  fetchJobs: (query, location, postedAfter) => fetchFromJobSpy('naukri', 'Naukri.com', query, location, postedAfter, generateNaukriMock)
};

export const indeedAdapter: JobAdapter = {
  id: 'indeed',
  name: 'Indeed India',
  fetchJobs: (query, location, postedAfter) => fetchFromJobSpy('indeed', 'Indeed India', query, location, postedAfter, generateIndeedMock)
};

export const linkedinAdapter: JobAdapter = {
  id: 'linkedin',
  name: 'LinkedIn',
  fetchJobs: (query, location, postedAfter) => fetchFromJobSpy('linkedin', 'LinkedIn', query, location, postedAfter, generateLinkedInMock)
};

export const glassdoorAdapter: JobAdapter = {
  id: 'glassdoor',
  name: 'Glassdoor',
  fetchJobs: (query, location, postedAfter) => fetchFromJobSpy('glassdoor', 'Glassdoor', query, location, postedAfter, generateGlassdoorMock)
};

export const zipRecruiterAdapter: JobAdapter = {
  id: 'zip_recruiter',
  name: 'ZipRecruiter',
  fetchJobs: (query, location, postedAfter) => fetchFromJobSpy('zip_recruiter', 'ZipRecruiter', query, location, postedAfter, generateZipRecruiterMock)
};

