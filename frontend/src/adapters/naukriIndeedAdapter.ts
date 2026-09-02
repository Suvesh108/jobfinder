import type { JobAdapter, JobListing } from './types';

// ==========================================
// ACCURATE MOCK & SCRAPER FALLBACK DATA ENGINE
// ==========================================

const getFreshDate = (daysAgo = 0): string => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const generateNaukriMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Bengaluru, Karnataka';
  return [
    {
      title: `${capQuery} Engineer (Fresher / 0-1 Yrs)`,
      company: 'Wipro Limited',
      location: capLoc,
      salary: '₹6.5 - 9.0 LPA',
      url: `https://www.naukri.com/job-listings-mock-${Date.now()}-1`,
      source: 'Naukri.com',
      postedDate: getFreshDate(0), // Today
      description: `Urgent requirement for entry-level / fresher ${capQuery} developer. Requirements: Strong computer science fundamentals, JavaScript/TypeScript or Python, Git, and eager to learn modern web frameworks.`,
    },
    {
      title: `Junior ${capQuery} Developer`,
      company: 'Tata Consultancy Services (TCS)',
      location: capLoc,
      salary: '₹5.0 - 7.5 LPA',
      url: `https://www.naukri.com/job-listings-mock-${Date.now()}-2`,
      source: 'Naukri.com',
      postedDate: getFreshDate(1), // Yesterday
      description: `Exciting opportunity for freshers and 0-2 yrs experience. Work on enterprise applications using ${capQuery} and agile tools.`,
    }
  ];
};

const generateIndeedMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Pune, Maharashtra';
  return [
    {
      title: `Graduate Trainee - ${capQuery}`,
      company: 'Infosys',
      location: capLoc,
      salary: '₹4.5 - 6.8 LPA',
      url: `https://in.indeed.com/viewjob?jk=indeed_mock_${Date.now()}_1`,
      source: 'Indeed India',
      postedDate: getFreshDate(0), // Today
      description: `Looking for passionate 2024/2025/2026 graduates with ${capQuery} knowledge. Hands-on coding and problem solving skills required.`,
    },
    {
      title: `${capQuery} Software Engineer`,
      company: 'Cognizant',
      location: capLoc,
      salary: '₹7.0 - 11.0 LPA',
      url: `https://in.indeed.com/viewjob?jk=indeed_mock_${Date.now()}_2`,
      source: 'Indeed India',
      postedDate: getFreshDate(2),
      description: `Responsible for building modular components and API integrations for ${capQuery} systems.`,
    }
  ];
};

const generateLinkedInMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Bengaluru, Karnataka';
  return [
    {
      title: `Associate ${capQuery} Developer (Early Career)`,
      company: 'Zepto Tech',
      location: capLoc,
      salary: '₹12.0 - 16.0 LPA',
      url: `https://www.linkedin.com/jobs/view/linkedin_mock_${Date.now()}_1`,
      source: 'LinkedIn',
      postedDate: getFreshDate(0), // Today
      description: `Zepto is hiring early career & fresher ${capQuery} builders. High growth environment with modern stack and competitive compensation.`,
    },
    {
      title: `Frontend Engineer - ${capQuery}`,
      company: 'Razorpay',
      location: capLoc,
      salary: '₹14.0 - 18.0 LPA',
      url: `https://www.linkedin.com/jobs/view/linkedin_mock_${Date.now()}_2`,
      source: 'LinkedIn',
      postedDate: getFreshDate(1),
      description: `Build delightful payments UX. Fast-paced engineering team working on ${capQuery}, performance tuning, and design systems.`,
    }
  ];
};

const generateGlassdoorMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Hyderabad, Telangana';
  return [
    {
      title: `Entry Level ${capQuery} Specialist`,
      company: 'Tech Mahindra',
      location: capLoc,
      salary: '₹5.5 - 8.5 LPA',
      url: `https://www.glassdoor.co.in/job-listings-mock-${Date.now()}`,
      source: 'Glassdoor',
      postedDate: getFreshDate(0), // Today
      description: `Great launchpad for freshers in ${capQuery}. Strong foundation in data structures and clean code design.`,
    }
  ];
};

const generateZipRecruiterMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() ? (location.trim().charAt(0).toUpperCase() + location.trim().slice(1)) : 'Remote, India';
  return [
    {
      title: `Junior Cloud & ${capQuery} Engineer`,
      company: 'Jio Platforms',
      location: capLoc,
      salary: '₹8.0 - 12.0 LPA',
      url: `https://www.ziprecruiter.com/job/mock-${Date.now()}`,
      source: 'ZipRecruiter',
      postedDate: getFreshDate(1),
      description: `Remote opportunity for ${capQuery} engineers. Work on nationwide telecommunication and streaming platforms.`,
    }
  ];
};
// ==========================================
// LOCAL PYTHON JOBSPY SERVICE ADAPTERS
// ==========================================

const PYTHON_TIMEOUT_MS = 6000; // 8 minutes
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

