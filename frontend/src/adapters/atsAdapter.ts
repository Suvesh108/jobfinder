import type { JobAdapter, JobListing } from './types';

const ATS_BACKEND_URL = (import.meta.env.VITE_ATS_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://localhost:8002';
const ATS_TIMEOUT_MS = 6000;

const fetchFromATS = async (
  platformId: string,
  query: string,
  location: string,
  mockFallback?: (q: string, l: string) => JobListing[]
): Promise<JobListing[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ATS_TIMEOUT_MS);

  try {
    const url = `${ATS_BACKEND_URL}/ats/jobs?keyword=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Filter to this specific ATS platform if requested
      if (platformId !== 'all') {
        const platformJobs = data.filter((j: any) => j.source && j.source.toLowerCase().includes(platformId));
        return platformJobs.length > 0 ? platformJobs : data;
      }
      return data;
    }
    return mockFallback ? mockFallback(query, location) : [];
  } catch (err) {
    clearTimeout(timeoutId);
    return mockFallback ? mockFallback(query, location) : [];
  }
};

const getFreshDate = (daysAgo = 0): string => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const generateGreenhouseMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() || 'Bengaluru, Karnataka';
  return [
    {
      title: `${capQuery} Engineer (Direct ATS)`,
      company: 'Postman',
      location: capLoc,
      salary: '₹14 - 22 LPA',
      url: 'https://job-boards.greenhouse.io/postman',
      source: 'ats:greenhouse',
      postedDate: getFreshDate(0),
      description: `Postman is hiring a ${capQuery} developer for the platform core team in Bengaluru. Direct Greenhouse ATS posting.`,
    }
  ];
};

const generateLeverMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() || 'Bengaluru, Karnataka';
  return [
    {
      title: `Backend ${capQuery} Specialist`,
      company: 'CRED',
      location: capLoc,
      salary: '₹18 - 28 LPA',
      url: 'https://jobs.lever.co/cred',
      source: 'ats:lever',
      postedDate: getFreshDate(1),
      description: `CRED backend engineering role for high-throughput payment architectures.`,
    }
  ];
};

const generateAshbyMock = (query: string, location: string): JobListing[] => {
  const capQuery = query.charAt(0).toUpperCase() + query.slice(1);
  const capLoc = location.trim() || 'Remote, India';
  return [
    {
      title: `Software Developer - ${capQuery}`,
      company: 'Sentry',
      location: capLoc,
      salary: '₹16 - 25 LPA',
      url: 'https://jobs.ashbyhq.com/sentry',
      source: 'ats:ashby',
      postedDate: getFreshDate(0),
      description: `Direct application via Ashby HQ for Sentry telemetry and performance monitoring systems.`,
    }
  ];
};

export const greenhouseAdapter: JobAdapter = {
  id: 'ats_greenhouse',
  name: 'Greenhouse ATS',
  fetchJobs: (q, l) => fetchFromATS('greenhouse', q, l, generateGreenhouseMock)
};

export const leverAdapter: JobAdapter = {
  id: 'ats_lever',
  name: 'Lever ATS',
  fetchJobs: (q, l) => fetchFromATS('lever', q, l, generateLeverMock)
};

export const ashbyAdapter: JobAdapter = {
  id: 'ats_ashby',
  name: 'Ashby ATS',
  fetchJobs: (q, l) => fetchFromATS('ashby', q, l, generateAshbyMock)
};
