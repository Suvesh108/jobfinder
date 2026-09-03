import type { JobApplication } from '../db/schema';

// Helper to format currency/salary
export const formatSalary = (salary: string): string => {
  if (!salary) return 'Not Specified';
  return salary;
};

// Help to format dates
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Smart URL parsing for popular job sites
export interface ParsedJobInfo {
  company: string;
  role: string;
  sourceSite: string;
  link: string;
}

export const parseJobUrl = (url: string): ParsedJobInfo => {
  const result: ParsedJobInfo = {
    company: '',
    role: '',
    sourceSite: 'Other',
    link: url,
  };

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    // Detect Source Site
    if (host.includes('indeed')) {
      result.sourceSite = 'Indeed India';
    } else if (host.includes('naukri')) {
      result.sourceSite = 'Naukri';
    } else if (host.includes('apna.co')) {
      result.sourceSite = 'Apna';
    } else if (host.includes('jobhai')) {
      result.sourceSite = 'Job Hai';
    } else if (host.includes('internshala')) {
      result.sourceSite = 'Internshala';
    } else if (host.includes('glassdoor')) {
      result.sourceSite = 'Glassdoor';
    } else if (host.includes('ziprecruiter')) {
      result.sourceSite = 'ZipRecruiter';
    } else if (host.includes('wellfound')) {
      result.sourceSite = 'Wellfound';
    } else if (host.includes('workatastartup')) {
      result.sourceSite = 'YC Work at a Startup';
    } else if (host.includes('instahyre')) {
      result.sourceSite = 'Instahyre';
    } else if (host.includes('cutshort')) {
      result.sourceSite = 'CutShort';
    } else if (host.includes('linkedin')) {
      result.sourceSite = 'LinkedIn';
    }

    // Smart parsing of path segments
    // E.g., naukri.com/job-listings-react-js-developer-wipro-bengaluru-12345
    if (host.includes('naukri.com')) {
      const parts = pathname.split('/');
      const jobListingSegment = parts.find(p => p.startsWith('job-listings-'));
      if (jobListingSegment) {
        // Remove prefix
        const clean = jobListingSegment.replace('job-listings-', '');
        // Usually: role-name-company-location-id
        const subParts = clean.split('-');
        if (subParts.length >= 3) {
          // Guessing: last items are ID, location, company
          // E.g. react-developer-tcs-bengaluru-12345
          const companyIdx = subParts.length - 3;
          result.company = capitalizeWords(subParts[companyIdx]);
          result.role = capitalizeWords(subParts.slice(0, companyIdx).join(' '));
        }
      }
    }
    
    // E.g. apna.co/job/pixelkraft-react-ui-12345
    else if (host.includes('apna.co')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts[0] === 'job' && parts[1]) {
        const subParts = parts[1].split('-');
        if (subParts.length >= 2) {
          result.company = capitalizeWords(subParts[0]);
          result.role = capitalizeWords(subParts.slice(1, subParts.length - 1).join(' '));
        }
      }
    }

    // E.g. internshala.com/internship/detail/reactjs-web-dev-wfh-mock-123
    else if (host.includes('internshala.com')) {
      const parts = pathname.split('/').filter(Boolean);
      const detailIdx = parts.indexOf('detail');
      if (detailIdx !== -1 && parts[detailIdx + 1]) {
        const subParts = parts[detailIdx + 1].split('-');
        result.role = capitalizeWords(subParts.slice(0, -1).join(' '));
      }
    }

    // E.g. wellfound.com/jobs/1234-finflow-react-ts
    else if (host.includes('wellfound.com')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts[0] === 'jobs' && parts[1]) {
        const subParts = parts[1].split('-');
        // Remove number prefix if present
        const startIdx = isNaN(Number(subParts[0])) ? 0 : 1;
        result.company = capitalizeWords(subParts[startIdx]);
        result.role = capitalizeWords(subParts.slice(startIdx + 1).join(' '));
      }
    }

    // Fallback parser if nothing matched specifically
    if (!result.company || !result.role) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        const cleanSegment = lastSegment.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();
        if (cleanSegment.length > 5) {
          result.role = capitalizeWords(cleanSegment);
        }
      }
      
      // Auto-fill company from hostname
      if (!result.company) {
        const domainParts = host.split('.');
        const mainDomain = domainParts.length > 2 ? domainParts[domainParts.length - 2] : domainParts[0];
        result.company = capitalizeWords(mainDomain);
      }
    }

  } catch (e) {
    console.error('URL Parsing failed', e);
  }

  return result;
};

const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Export to CSV
export const exportToCSV = (jobs: JobApplication[]): string => {
  const headers = [
    'ID', 'Company', 'Role', 'Location', 'Salary', 'Source', 
    'Date Applied', 'Last Status Change', 'Status', 'Link', 
    'Tags', 'Notes', 'Contact Name', 'Contact Email', 'Contact Phone'
  ];

  const csvRows = [headers.join(',')];

  for (const job of jobs) {
    const values = [
      job.id || '',
      escapeCSV(job.company),
      escapeCSV(job.role),
      escapeCSV(job.location),
      escapeCSV(job.salary),
      escapeCSV(job.sourceSite),
      job.dateApplied,
      job.lastStatusChange,
      job.status,
      escapeCSV(job.link),
      escapeCSV(job.tags.join('; ')),
      escapeCSV(job.notes),
      escapeCSV(job.contactName || ''),
      escapeCSV(job.contactEmail || ''),
      escapeCSV(job.contactPhone || '')
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

const escapeCSV = (val: string): string => {
  if (val === null || val === undefined) return '""';
  const str = val.toString().replace(/"/g, '""');
  return `"${str}"`;
};

// Check if a job application needs a follow up
export const checkNeedsFollowUp = (
  job: JobApplication, 
  customDays: number = 14
): boolean => {
  if (job.status !== 'Applied') return false;
  
  const lastChange = new Date(job.lastStatusChange);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = Math.abs(now.getTime() - lastChange.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= customDays;
};
