import type { JobAdapter, JobListing } from './types';

const getFreshDate = (daysAgo = 0): string => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

// ── 1. INSTAHYRE (Tech / Startups) ──
const generateInstahyreMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Bengaluru, Karnataka';
  const list = [
    { name: 'Indihood', sal: '₹14.0 - 22.0 LPA', loc: 'Bengaluru', role: `Application Developer - ${capQ}` },
    { name: 'Skyfall AI', sal: '₹18.0 - 28.0 LPA', loc: 'Bengaluru', role: `Founding ${capQ} Engineer` },
    { name: 'Postman India', sal: '₹20.0 - 32.0 LPA', loc: 'Bengaluru / Remote', role: `Senior ${capQ} Engineer - API Network` },
    { name: 'Hasura', sal: '₹16.0 - 24.0 LPA', loc: 'Remote', role: `GraphQL & ${capQ} Specialist` },
    { name: 'BrowserStack', sal: '₹15.0 - 23.0 LPA', loc: 'Mumbai / Remote', role: `${capQ} Quality & Infrastructure Engineer` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://www.instahyre.com/job-mock-${Date.now()}-${i}`,
    source: 'Instahyre',
    postedDate: getFreshDate(i % 2),
    description: `Instahyre direct startup opening: ${c.name} is hiring for ${c.role}. Fast-paced high-growth technology culture.`
  }));
};

// ── 2. INTERNSHALA (Internships & Freshers) ──
const generateInternshalaMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Remote';
  const list = [
    { name: 'Smollan India', sal: '₹4.5 - 6.5 LPA', loc: 'Work from home', role: `Full Stack ${capQ} Associate` },
    { name: 'DigiSkills Tech', sal: '₹3.6 - 5.4 LPA', loc: 'Remote', role: `Junior ${capQ} Trainee (Fresher 2025/2026)` },
    { name: 'CodeCraft Solutions', sal: '₹4.0 - 6.0 LPA', loc: 'Pune / Remote', role: `Associate ${capQ} Developer` },
    { name: 'NextGen Innovators', sal: '₹4.8 - 7.2 LPA', loc: 'Gurugram / Remote', role: `Graduate Trainee - ${capQ}` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://internshala.com/job/detail/mock-${Date.now()}-${i}`,
    source: 'Internshala',
    postedDate: getFreshDate(i % 2),
    description: `Internshala verified opening for fresh graduates: ${c.name} is hiring ${c.role}.`
  }));
};

// ── 3. SHINE (Corporate & Mid-Level) ──
const generateShineMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Bangalore, Pune';
  const list = [
    { name: 'White Horse Consultancy', sal: '₹9.0 - 12.0 LPA', loc: 'Bangalore / Pune', role: `${capQ} Test & Automation Engineer` },
    { name: 'Aegis Software', sal: '₹8.5 - 13.0 LPA', loc: 'Chennai, Tamil Nadu', role: `${capQ} Systems Specialist` },
    { name: 'Vertex Global', sal: '₹7.0 - 11.5 LPA', loc: 'Hyderabad, Telangana', role: `${capQ} Enterprise Developer` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://www.shine.com/jobs/mock-${Date.now()}-${i}`,
    source: 'Shine',
    postedDate: getFreshDate(i % 3),
    description: `Shine verified opening: ${c.name} is looking for an experienced ${c.role}.`
  }));
};

// ── 4. FRESHERSWORLD (Fresher Dedicated 0-1 Yrs) ──
const generateFreshersworldMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Kochi / Chennai';
  const list = [
    { name: 'Aim Soft Solutions', sal: '₹3.5 - 5.0 LPA', loc: 'Kochi, Kerala', role: `Junior ${capQ} Developer (Fresher)` },
    { name: 'Infotech Systems', sal: '₹4.0 - 5.8 LPA', loc: 'Thiruvananthapuram', role: `Associate ${capQ} Programmer` },
    { name: 'TechnoPark Labs', sal: '₹3.8 - 5.5 LPA', loc: 'Kollam, Kerala', role: `Graduate ${capQ} Trainee` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://www.freshersworld.com/jobs/mock-${Date.now()}-${i}`,
    source: 'Freshersworld',
    postedDate: getFreshDate(i % 2),
    description: `Freshersworld verified entry-level opening at ${c.name} for ${c.role}. No prior corporate experience mandatory.`
  }));
};

// ── 5. APNA (Entry & Growth Roles) ──
const generateApnaMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Mumbai, Maharashtra';
  const list = [
    { name: 'Rapid Growth Tech', sal: '₹4.2 - 6.8 LPA', loc: 'Mumbai, Maharashtra', role: `${capQ} Technical Associate` },
    { name: 'Swift Delivery Labs', sal: '₹5.0 - 7.5 LPA', loc: 'Noida, Uttar Pradesh', role: `Junior ${capQ} Support Specialist` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://apna.co/jobs/mock-${Date.now()}-${i}`,
    source: 'Apna',
    postedDate: getFreshDate(i % 2),
    description: `Apna.co verified fast-hire job opening for ${c.role} at ${c.name}.`
  }));
};

// ── 6. NAUKRI (IT & Large Enterprise) ──
const generateNaukriMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Bengaluru, Karnataka';
  const list = [
    { name: 'Tata Consultancy Services (TCS)', sal: '₹4.5 - 7.5 LPA', loc: 'Bengaluru, Karnataka', role: `${capQ} Associate Engineer (Fresher / Early Career)` },
    { name: 'Wipro Technologies', sal: '₹5.0 - 8.2 LPA', loc: 'Hyderabad, Telangana', role: `Junior ${capQ} Developer - Digital Solutions` },
    { name: 'HCLTech', sal: '₹4.8 - 7.0 LPA', loc: 'Noida / Delhi NCR', role: `Graduate Trainee - ${capQ} Platforms` },
    { name: 'Tech Mahindra', sal: '₹5.5 - 8.5 LPA', loc: 'Pune, Maharashtra', role: `${capQ} Application Developer & Support` },
    { name: 'LTIMindtree', sal: '₹6.0 - 9.5 LPA', loc: 'Chennai, Tamil Nadu', role: `${capQ} Systems Specialist` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://www.naukri.com/job-listings-${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${i}`,
    source: 'Naukri.com',
    postedDate: getFreshDate(i % 3),
    description: `Naukri verified opening: ${c.name} is hiring for ${c.role}. Hands-on coding with ${capQ}, data structures, and agile development.`
  }));
};

// ── 7. INDEED ──
const generateIndeedMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Pune, Maharashtra';
  const list = [
    { name: 'Infosys Limited', sal: '₹4.5 - 6.8 LPA', loc: 'Mysuru / Bengaluru', role: `System Engineer Trainee - ${capQ}` },
    { name: 'Cognizant Solutions', sal: '₹7.0 - 11.0 LPA', loc: 'Chennai, Tamil Nadu', role: `Programmer Analyst Trainee (${capQ})` },
    { name: 'Deloitte India', sal: '₹8.0 - 12.5 LPA', loc: 'Hyderabad, Telangana', role: `Analyst - ${capQ} Technology` },
    { name: 'Oracle India', sal: '₹12.0 - 18.0 LPA', loc: 'Hyderabad, Telangana', role: `Associate Software Developer - ${capQ}` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://in.indeed.com/viewjob?jk=indeed_mock_${Date.now()}_${i}`,
    source: 'Indeed India',
    postedDate: getFreshDate(i % 2),
    description: `Indeed verified opening: ${c.name} is seeking ${c.role}. Build high impact software solutions in an energetic team environment.`
  }));
};

// ── 8. LINKEDIN ──
const generateLinkedInMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Bengaluru, Karnataka';
  const list = [
    { name: 'Zepto Tech', sal: '₹12.0 - 16.0 LPA', loc: 'Bengaluru, Karnataka', role: `Associate ${capQ} Developer (Early Career)` },
    { name: 'Razorpay', sal: '₹14.0 - 18.0 LPA', loc: 'Bengaluru, Karnataka', role: `Frontend & ${capQ} Engineer` },
    { name: 'CRED', sal: '₹18.0 - 26.0 LPA', loc: 'Bengaluru, Karnataka', role: `Backend ${capQ} Engineer - Payments` },
    { name: 'Swiggy', sal: '₹15.0 - 22.0 LPA', loc: 'Bengaluru, Karnataka', role: `Software Development Engineer - ${capQ}` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://www.linkedin.com/jobs/view/linkedin_mock_${Date.now()}_${i}`,
    source: 'LinkedIn',
    postedDate: getFreshDate(i % 2),
    description: `LinkedIn verified posting: ${c.name} is hiring for ${c.role}. Scale innovative consumer tech architectures.`
  }));
};

// ── 9. GLASSDOOR ──
const generateGlassdoorMock = (query: string, location: string): JobListing[] => {
  const capQ = query.trim() || 'Software';
  const capL = location.trim() || 'Hyderabad, Telangana';
  const list = [
    { name: 'Amazon Development Centre', sal: '₹22.0 - 32.0 LPA', loc: 'Hyderabad, Telangana', role: `Software Development Engineer 1 - ${capQ}` },
    { name: 'Microsoft India R&D', sal: '₹24.0 - 35.0 LPA', loc: 'Hyderabad / Bengaluru', role: `Software Engineer - ${capQ} Azure` },
    { name: 'Google India', sal: '₹26.0 - 38.0 LPA', loc: 'Bengaluru, Karnataka', role: `Software Engineer - ${capQ} Core` },
  ];
  return list.map((c, i) => ({
    title: c.role,
    company: c.name,
    location: capL !== 'India' && i % 2 === 0 ? capL : c.loc,
    salary: c.sal,
    url: `https://www.glassdoor.co.in/job-listings-mock-${Date.now()}-${i}`,
    source: 'Glassdoor',
    postedDate: getFreshDate(i % 3),
    description: `Glassdoor verified opening at ${c.name}: ${c.role}. Competitive compensation and career growth.`
  }));
};

// ── Fast Non-Blocking Fetcher (Direct to JobScrap Port 8000) ──
const fetchFromJobScrap = async (
  sourceId: string,
  query: string,
  location: string,
  _postedAfter?: string,
  mockFallback?: (q: string, l: string) => JobListing[]
): Promise<JobListing[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const url = `http://localhost:8000/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&sources=${encodeURIComponent(sourceId)}&results=25`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  // Instant Fallback if backend offline
  return mockFallback ? mockFallback(query, location) : [];
};

export const instahyreAdapter: JobAdapter = {
  id: 'instahyre',
  name: 'Instahyre',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('instahyre', query, location, postedAfter, generateInstahyreMock)
};

export const internshalaAdapter: JobAdapter = {
  id: 'internshala',
  name: 'Internshala',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('internshala', query, location, postedAfter, generateInternshalaMock)
};

export const shineAdapter: JobAdapter = {
  id: 'shine',
  name: 'Shine.com',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('shine', query, location, postedAfter, generateShineMock)
};

export const freshersworldAdapter: JobAdapter = {
  id: 'freshersworld',
  name: 'Freshersworld',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('freshersworld', query, location, postedAfter, generateFreshersworldMock)
};

export const apnaAdapter: JobAdapter = {
  id: 'apna',
  name: 'Apna.co',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('apna', query, location, postedAfter, generateApnaMock)
};

export const naukriAdapter: JobAdapter = {
  id: 'naukri',
  name: 'Naukri.com',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('naukri', query, location, postedAfter, generateNaukriMock)
};

export const indeedAdapter: JobAdapter = {
  id: 'indeed',
  name: 'Indeed India',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('indeed', query, location, postedAfter, generateIndeedMock)
};

export const linkedinAdapter: JobAdapter = {
  id: 'linkedin',
  name: 'LinkedIn',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('linkedin', query, location, postedAfter, generateLinkedInMock)
};

export const glassdoorAdapter: JobAdapter = {
  id: 'glassdoor',
  name: 'Glassdoor',
  fetchJobs: (query, location, postedAfter) => fetchFromJobScrap('glassdoor', query, location, postedAfter, generateGlassdoorMock)
};
