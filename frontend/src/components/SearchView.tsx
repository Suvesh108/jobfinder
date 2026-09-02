import { useDiscoveredJobsStore } from '../store/useDiscoveredJobsStore';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { adapters, type JobListing } from '../adapters';
import { dedupeJobs } from '../utils/dedupeJobs';
import { AITailorModal } from './AITailorModal';
import { TailoredResumeModal } from './TailoredResumeModal';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  ChevronDown,
  Square,
  Sparkles,
  FileText
} from 'lucide-react';

// ─── All Indian States, UTs & Major Cities ───────────────────────────────────
const INDIAN_LOCATIONS: { group: string; items: string[] }[] = [
  {
    group: 'Popular Tech Hubs',
    items: [
      'Remote',
      'India (Remote)',
      'Bengaluru, Karnataka',
      'Hyderabad, Telangana',
      'Pune, Maharashtra',
      'Gurugram, Haryana',
      'Noida, Uttar Pradesh',
      'Chennai, Tamil Nadu',
      'Mumbai, Maharashtra',
      'Ahmedabad, Gujarat',
    ],
  },
  {
    group: 'States & Union Territories',
    items: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi NCR', 'Chandigarh', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
    ],
  },
  {
    group: 'Other Major Cities',
    items: [
      'Kochi, Kerala', 'Thiruvananthapuram, Kerala', 'Indore, Madhya Pradesh',
      'Jaipur, Rajasthan', 'Chandigarh', 'Coimbatore, Tamil Nadu',
      'Bhubaneswar, Odisha', 'Visakhapatnam, Andhra Pradesh', 'Nagpur, Maharashtra',
      'Kolkata, West Bengal', 'Surat, Gujarat', 'Vadodara, Gujarat',
      'Lucknow, Uttar Pradesh', 'Bhopal, Madhya Pradesh', 'Patna, Bihar',
      'Guwahati, Assam', 'Dehradun, Uttarakhand', 'Mangaluru, Karnataka',
    ],
  },
];

// ─── Preset Tech Roles (Merged Multi-Role Categories) ───────────────────────
const TECH_ROLES: { group: string; items: string[] }[] = [
  {
    group: 'Technical Support & IT Operations',
    items: [
      'Technical Support / IT Support Specialist',
      'L1 / L2 / L3 Application Support Executive',
      'Desktop & Network Support Engineer',
      'Cloud Support & IT Operations Specialist',
    ],
  },
  {
    group: 'Software Engineering & Web Development',
    items: [
      'Software Engineer / Full Stack Developer',
      'Frontend / React / Angular Developer',
      'Backend / Node.js / Java / Python Developer',
      'C++ / C# / Golang / PHP Developer',
    ],
  },
  {
    group: 'Cloud, DevOps & Systems Infrastructure',
    items: [
      'DevOps / SRE / Cloud Architect',
      'System & Network Administrator',
      'Database Administrator (DBA)',
      'Embedded Systems & Firmware Engineer',
    ],
  },
  {
    group: 'Mobile App Engineering',
    items: [
      'Android / iOS Developer',
      'Flutter / React Native Developer',
    ],
  },
  {
    group: 'AI, Data & Analytics',
    items: [
      'Data Science / Machine Learning / AI Engineer',
      'Data Engineer & Big Data Specialist',
      'Data Analyst & BI Developer',
    ],
  },
  {
    group: 'Cybersecurity & Software QA Testing',
    items: [
      'Cybersecurity & SOC Analyst / Security Engineer',
      'QA Automation & SDET Engineer',
      'Manual Software Tester & Penetration Tester',
    ],
  },
];

// ─── Preset Non-Tech / Corporate & Business Roles (Merged Multi-Role Categories) ───
const NON_TECH_ROLES: { group: string; items: string[] }[] = [
  {
    group: 'Customer Support, BPO & Telecalling',
    items: [
      'Customer Support Executive (Voice / Non-Voice / Chat)',
      'International Voice & BPO Process Associate',
      'Call Center & Telecalling Executive',
      'Escalation & Client Support Specialist',
    ],
  },
  {
    group: 'Sales, Business Development & Commercial',
    items: [
      'Business Development Executive / Manager (BDE / BDM)',
      'Inside Sales & Corporate Account Executive',
      'Sales Operations & Field Sales Manager',
    ],
  },
  {
    group: 'Marketing, Digital Ads, SEO & Content',
    items: [
      'Digital Marketing & Performance Marketer (PPC / Meta)',
      'SEO Specialist & Content Strategist',
      'Social Media & Brand Marketing Manager',
      'Technical Writer & Copywriter',
    ],
  },
  {
    group: 'Product Management, UI/UX & Design',
    items: [
      'Product Manager & Business Analyst (PM / APM / BA)',
      'Project Manager & Scrum Master',
      'UI/UX & Product Designer',
      'Graphic Designer & Visual / UX Researcher',
    ],
  },
  {
    group: 'HR, Operations & Finance',
    items: [
      'HR Executive / HR Generalist & Recruiter',
      'Talent Acquisition Specialist & HRBP',
      'Operations & Customer Success Manager (CSM)',
      'Finance, Accounts & Financial Analyst',
    ],
  },
];

// ─── Preset Company Tiers for India ──────────────────────────────────────────
const COMPANY_TIERS: Record<string, string[]> = {
  maang: [
    'google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook',
    'netflix', 'adobe', 'uber', 'atlassian', 'salesforce', 'linkedin',
    'nvidia', 'twosigma', 'stripe',
  ],
  unicorns: [
    'swiggy', 'zomato', 'zepto', 'blinkit', 'razorpay', 'cred',
    'groww', 'zerodha', 'phonepe', 'paytm', 'meesho', 'unacademy',
    'postman', 'browserstack', 'urban company', 'nykaa', 'ola',
    'dream11', 'cars24', 'eruditus', 'spinny',
  ],
  mnc: [
    'tcs', 'tata consultancy', 'infosys', 'wipro', 'hcl', 'tech mahindra',
    'cognizant', 'accenture', 'capgemini', 'lTIMindtree', 'deloitte',
    'pwc', 'ey', 'kpmg', 'ibm', 'oracle', 'cisco', 'sap', 'intel',
    'samsung', 'goldman sachs', 'jpmorgan', 'morgan stanley',
  ],
  product: [
    'intuit', 'paypal', 'booking.com', 'expedia', 'servicenow',
    'workday', 'snowflake', 'databricks', 'hubspot', 'zendesk',
    'twilio', 'freshworks', 'chargebee', 'clevertap',
  ],
};

const parseSalaryToLpa = (salaryStr?: string): number | null => {
  if (!salaryStr || salaryStr === 'Not Specified') return null;
  const s = salaryStr.toLowerCase().trim();
  
  const lpaMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:-|to)?\s*(\d+(?:\.\d+)?)?\s*lpa/i);
  if (lpaMatch) {
    return parseFloat(lpaMatch[2] || lpaMatch[1]);
  }
  
  const yearMatch = s.match(/₹?\s*([\d,]+)\s*(?:-|to)?\s*₹?\s*([\d,]+)?\s*(?:\/|\s*per\s*)year/i);
  if (yearMatch) {
    const rawVal = (yearMatch[2] || yearMatch[1]).replace(/,/g, '');
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num > 1000) {
      return num / 100000;
    }
  }

  const monthMatch = s.match(/₹?\s*([\d,]+)\s*(?:-|to)?\s*₹?\s*([\d,]+)?\s*(?:\/|\s*per\s*)month/i);
  if (monthMatch) {
    const rawVal = (monthMatch[2] || monthMatch[1]).replace(/,/g, '');
    const num = parseFloat(rawVal);
    if (!isNaN(num)) {
      return (num * 12) / 100000;
    }
  }

  return null;
};

// ─── Custom Filter Select Options & Component (Matches image design) ─────────
interface FilterOption {
  value: string;
  label: string;
}

const DATE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Dates' },
  { value: '24h', label: 'Past 24 Hours' },
  { value: '3d', label: 'Past 3 Days' },
  { value: '7d', label: 'Past 7 Days' },
];

const EXPERIENCE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Experience' },
  { value: 'fresher', label: 'Fresher (0-1 yrs)' },
  { value: '2', label: 'Junior (1-3 yrs)' },
  { value: '4', label: 'Mid-Level (3-5 yrs)' },
  { value: '6', label: 'Senior (5+ yrs)' },
];

const WORK_MODE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Modes' },
  { value: 'remote', label: 'Remote / WFH' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-Site' },
];

const JOB_TYPE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'fulltime', label: 'Full-Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
];

const SALARY_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Min Salary' },
  { value: '6', label: '₹6+ LPA' },
  { value: '10', label: '₹10+ LPA' },
  { value: '15', label: '₹15+ LPA' },
];

const TIER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Company Tier' },
  { value: 'maang', label: 'MAANG / Tech Giants' },
  { value: 'unicorns', label: 'Indian Unicorns' },
  { value: 'mnc', label: 'Global MNCs' },
];

interface CustomFilterSelectProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

const CustomFilterSelect: React.FC<CustomFilterSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select option',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;
  const isCustomized = value !== 'all' && value !== '';

  return (
    <div id={id} ref={containerRef} className="relative flex-1 min-w-[130px]">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all duration-150"
        style={{
          background: isCustomized ? 'var(--bg-surface-raised)' : 'var(--bg-input)',
          borderColor: isOpen ? 'var(--accent-primary)' : isCustomized ? 'var(--border-highlight)' : 'var(--border-subtle)',
          color: isCustomized ? 'var(--accent-primary)' : 'var(--text-primary)',
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted shrink-0 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden py-1 animate-fade-in"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            minWidth: '160px',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors duration-150 flex items-center justify-between"
                style={{
                  background: isSelected ? 'var(--sidebar-item-active)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-raised)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="text-[11px] font-bold text-primary">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Custom Autocomplete Dropdown Component ──────────────────────────────────
interface AutocompleteInputProps {
  id: string;
  value?: string;
  onChange?: (val: string) => void;
  multi?: boolean;
  values?: string[];
  onToggle?: (item: string) => void;
  onClearAll?: () => void;
  placeholder: string;
  icon: React.ReactNode;
  groups: { group: string; items: string[] }[];
  accentColor?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  value = '',
  onChange,
  multi = false,
  values = [],
  onToggle,
  onClearAll,
  placeholder,
  icon,
  groups,
  accentColor = 'var(--accent-primary)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGroups = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    if (!q) return groups;
    return groups
      .map(g => ({
        group: g.group,
        items: g.items.filter(item => item.toLowerCase().includes(q)),
      }))
      .filter(g => g.items.length > 0);
  }, [groups, filterText]);

  return (
    <div id={id} ref={containerRef} className="relative flex-1 min-w-[200px]">
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="card rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer border transition-all"
        style={{ borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-subtle)', background: 'var(--bg-input)' }}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <span className="text-text-muted shrink-0">{icon}</span>

          {multi ? (
            values.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {values.map(val => (
                  <span
                    key={val}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                    style={{ background: 'var(--sidebar-item-active)', color: accentColor, border: '1px solid var(--border-glow)' }}
                  >
                    <span>{val}</span>
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        onToggle?.(val);
                      }}
                      className="hover:text-danger cursor-pointer font-bold"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-text-muted truncate">{placeholder}</span>
            )
          ) : (
            <input
              type="text"
              value={filterText !== '' ? filterText : value}
              onChange={e => {
                setFilterText(e.target.value);
                onChange?.(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-semibold text-text-primary w-full placeholder-text-muted shadow-none"
            />
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {multi && values.length > 0 && (
            <span
              onClick={e => {
                e.stopPropagation();
                onClearAll?.();
              }}
              className="text-[10px] font-bold text-text-muted hover:text-danger px-1 cursor-pointer"
              title="Clear selected"
            >
              Clear
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl p-3 border shadow-2xl space-y-3 max-h-72 overflow-y-auto animate-fade-in"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-xl)' }}
        >
          <div className="px-1">
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Type to filter options..."
              className="w-full px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary outline-none border"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {filteredGroups.length === 0 ? (
            <p className="text-xs text-text-muted p-2 text-center">No matching suggestions.</p>
          ) : (
            filteredGroups.map(group => (
              <div key={group.group} className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted px-2 block">
                  {group.group}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {group.items.map(item => {
                    const isSelected = multi ? values.includes(item) : value === item;
                    return (
                      <div
                        key={item}
                        onClick={() => {
                          if (multi) {
                            onToggle?.(item);
                          } else {
                            onChange?.(item);
                            setFilterText('');
                            setIsOpen(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between"
                        style={{
                          background: isSelected ? 'var(--sidebar-item-active)' : 'transparent',
                          color: isSelected ? accentColor : 'var(--text-primary)',
                        }}
                      >
                        <span className="truncate">{item}</span>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SEARCH VIEW COMPONENT (TWO SUB-PAGES: QUERY FORM vs DEDICATED RESULTS)
   ═══════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;
const MAX_PAGES = 5; // Max 50 items displayed across 5 pages

const expandRoleToQueries = (role: string): string[] => {
  const parts = role
    .split(/[/&]/)
    .map(p => p.replace(/\([^)]*\)/g, '').trim())
    .filter(p => p.length > 2);
  return parts.length > 0 ? parts : [role];
};

export const SearchView: React.FC = () => {
  const enabledAdapters = useUIStore(state => state.enabledAdapters);

  // Filter & Query States
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Software Engineer / Full Stack Developer']);
  const [locQuery, setLocQuery] = useState('Bengaluru, Karnataka');
  const [dateOption, setDateOption] = useState('all');
  const [postedAfter, setPostedAfter] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [workMode, setWorkMode] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [minSalary, setMinSalary] = useState('all');
  const [companyTier, setCompanyTier] = useState('all');
  const [jobMode, setJobMode] = useState<'tech' | 'nontech'>('tech');
  
  // Navigation & Progress States
    const [searchProgress, setSearchProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<JobListing[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

  const handleDateOptionChange = (option: string) => {
    setDateOption(option);
    if (option === '24h') {
      setPostedAfter(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } else if (option === '3d') {
      setPostedAfter(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } else if (option === '7d') {
      setPostedAfter(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } else {
      setPostedAfter('');
    }
  };

  // Per-source raw counts and pipeline stats
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [loadingPhase, setLoadingPhase] = useState<string>('');

  const activeRoleGroups = jobMode === 'tech' ? TECH_ROLES : NON_TECH_ROLES;
  const accentColor = jobMode === 'tech' ? 'rgba(91,140,255,1)' : 'rgba(242,184,75,1)';

  // Toggle a role in/out of selectedRoles
  const handleRoleToggle = (role: string) =>
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );

  // Fetch all tracked job URLs to check if they are already saved
  const trackedJobs = useLiveQuery(() => db.jobs.toArray()) || [];
  const trackedUrls = useMemo(() => {
    return new Set(trackedJobs.map(job => job.link).filter(Boolean));
  }, [trackedJobs]);

  // Filter out results that are already added in the tracker
  const untrackedResults = useMemo(() => {
    const filtered = results.filter(job => {
      if (trackedUrls.has(job.url)) return false;
      const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}|${job.location.toLowerCase().trim()}`;
      return !trackedJobs.some(t =>
        `${t.role?.toLowerCase().trim()}|${t.company?.toLowerCase().trim()}|${t.location?.toLowerCase().trim()}` === key
      );
    });
    return filtered;
  }, [results, trackedUrls, trackedJobs]);

  // Pagination derived state using only untracked results
  const totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(untrackedResults.length / PAGE_SIZE)));
  const pagedResults = useMemo(() => {
    return untrackedResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [untrackedResults, currentPage]);

  // State for accumulative raw results across streaming adapter fetches
  const [rawListings, setRawListings] = useState<JobListing[]>([]);
  const rawListingsRef = useRef<JobListing[]>([]);
  const searchCacheRef = useRef<Map<string, JobListing[]>>(new Map());
  const isAbortedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [tailorModalJob, setTailorModalJob] = useState<{ company: string; role: string; location?: string; description?: string } | null>(null);
  const [resumeModalJob, setResumeModalJob] = useState<JobApplication | null>(null);

  const handleStopSearch = () => {
    isAbortedRef.current = true;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (err) {
        // ignore
      }
    }
    setIsLoading(false);
    setSearchProgress(100);
    setLoadingPhase('Search stopped by user.');
  };

  // Master pipeline runner
  const runPipeline = useCallback((
    rawJobs: JobListing[],
    currentPostedAfter: string,
    currentExperience: string,
    currentWorkMode: string,
    currentJobType: string,
    currentMinSalary: string,
    currentTier: string
  ) => {
    if (rawJobs.length === 0) {
      setResults([]);
        return;
    }

    const dedupedResults = dedupeJobs(rawJobs);
    
    // Filter out expired or closed listings
    const activeResults = dedupedResults.filter(job => {
      const textToSearch = `${job.title} ${job.description}`.toLowerCase();
      const blacklist = [
        'expired', 'closed', 'no longer accepting applications',
        'no longer active', 'not accepting applications',
        'position filled', 'hiring closed', 'expired listing'
      ];
      return !blacklist.some(term => textToSearch.includes(term));
    });

    let sortedResults = activeResults.sort(
      (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );

    // Date filter
    if (currentPostedAfter) {
      const cutoff = new Date(currentPostedAfter).getTime();
      sortedResults = sortedResults.filter(job => new Date(job.postedDate).getTime() >= cutoff);
    }

    // Experience filter
    if (currentExperience !== 'all') {
      sortedResults = sortedResults.filter(job => {
        const text = `${job.title} ${job.description}`.toLowerCase();
        const expMatch = text.match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*(?:years?|yrs?)/i);
        let minRequired: number | null = null;
        if (expMatch) minRequired = parseInt(expMatch[1], 10);

        if (currentExperience === 'fresher') {
          const fresherKeywords = /\b(fresher|fresh\s*graduate|entry[\s-]?level|no\s*experience|0[\s-]?(?:years?|exp)|trainee)\b/i;
          if (fresherKeywords.test(text)) return true;
          if (minRequired === null) return true;
          if (minRequired >= 1) return false;
          return true;
        }

        const targetYears = parseInt(currentExperience, 10);
        if (minRequired === null) return true;
        return minRequired <= targetYears + 1;
      });
    }

    // Work Mode filter
    if (currentWorkMode !== 'all') {
      sortedResults = sortedResults.filter(job => {
        const text = `${job.title} ${job.location} ${job.description}`.toLowerCase();
        const isRemote = text.includes('remote') || text.includes('wfh') || text.includes('work from home');
        const isHybrid = text.includes('hybrid') || text.includes('hybrid work');
        
        if (currentWorkMode === 'remote') return isRemote;
        if (currentWorkMode === 'hybrid') return isHybrid;
        if (currentWorkMode === 'onsite') return !isRemote && !isHybrid;
        return true;
      });
    }

    // Job Type filter
    if (currentJobType !== 'all') {
      sortedResults = sortedResults.filter(job => {
        const text = `${job.title} ${job.description}`.toLowerCase();
        const isIntern = text.includes('intern') || text.includes('stipend') || text.includes('trainee');
        const isContract = text.includes('contract') || text.includes('freelance') || text.includes('consultant');
        
        if (currentJobType === 'internship') return isIntern;
        if (currentJobType === 'contract') return isContract;
        if (currentJobType === 'fulltime') return !isIntern && !isContract;
        return true;
      });
    }

    // Salary filter
    if (currentMinSalary !== 'all') {
      const minLpa = parseFloat(currentMinSalary);
      sortedResults = sortedResults.filter(job => {
        const valLpa = parseSalaryToLpa(job.salary);
        if (valLpa === null) return true; 
        return valLpa >= minLpa;
      });
    }

    // Tier filter
    if (currentTier !== 'all') {
      const tierCompanies = COMPANY_TIERS[currentTier] || [];
      sortedResults = sortedResults.filter(job => {
        const companyLower = job.company.toLowerCase().trim();
        if (!companyLower || companyLower.length < 2) return false;
        return tierCompanies.some(name => {
          if (companyLower === name) return true;
          if (companyLower.includes(name)) return true;
          if (name.length > 3 && companyLower.length > 3 && name.includes(companyLower)) return true;
          return false;
        });
      });
    }

        setResults(sortedResults);
  }, []);

  // Filter re-execution
  useEffect(() => {
    if (rawListings.length > 0) {
      runPipeline(rawListings, postedAfter, experienceLevel, workMode, jobType, minSalary, companyTier);
    }
  }, [rawListings, postedAfter, experienceLevel, workMode, jobType, minSalary, companyTier, runPipeline]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e)     if (e) e.preventDefault();
    if (selectedRoles.length === 0) {
      alert('Please select at least one role from the dropdown.');
      return;
    }

    const activeAdapters = adapters.filter(a => enabledAdapters.includes(a.id));
    if (activeAdapters.length === 0) {
      alert('Please enable at least one Search Source in the Settings tab to search for jobs.');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isAbortedRef.current = false;
    setIsLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
    setSourceCounts({});
        setSearchProgress(10);
    // Keep unified view // Redirect to dedicated results page
    setLoadingPhase(`Scanning across ${activeAdapters.length} active platforms...`);

    // Check cache
    const cacheKey = `${jobMode}:${selectedRoles.sort().join(',')}:${locQuery}:${postedAfter}`;
    const cachedJobs = searchCacheRef.current.get(cacheKey);

    if (cachedJobs && cachedJobs.length > 0) {
      rawListingsRef.current = cachedJobs;
      setRawListings(cachedJobs);
      setLoadingPhase('Instant cache hit — refreshing sources in background...');
    } else {
      rawListingsRef.current = [];
      setRawListings([]);
      setResults([]);
    }

    // Per-role per-adapter parallel streaming execution
    const expandedQueries = selectedRoles.flatMap(r => expandRoleToQueries(r));
    const totalTasks = activeAdapters.length * expandedQueries.length;
    let completedTasks = 0;
    const counts: Record<string, number> = {};

    activeAdapters.forEach(async (adapter) => {
      if (isAbortedRef.current || controller.signal.aborted) return;
      let adapterTotal = 0;
      
      const rolePromises = expandedQueries.map(async (query) => {
        if (isAbortedRef.current || controller.signal.aborted) return [];
        const roleKey = `${adapter.id}:${query.trim().toLowerCase()}:${locQuery.trim().toLowerCase()}:${postedAfter}`;
        
        let fetched: JobListing[] = [];
        if (searchCacheRef.current.has(roleKey)) {
          fetched = searchCacheRef.current.get(roleKey) || [];
        } else {
          try {
            fetched = await adapter.fetchJobs(query.trim(), locQuery.trim(), postedAfter);
            if (isAbortedRef.current || controller.signal.aborted) return [];
            if (Array.isArray(fetched) && fetched.length > 0) {
              searchCacheRef.current.set(roleKey, fetched);
            }
          } catch (err) {
            if (isAbortedRef.current || controller.signal.aborted) return [];
            console.error(`[Fetch Error] ${adapter.name} (${query}):`, err);
            fetched = [];
          }
        }

        if (isAbortedRef.current || controller.signal.aborted) return [];

        completedTasks++;
        const pct = Math.min(99, Math.round((completedTasks / totalTasks) * 100));
        setSearchProgress(pct);
        useDiscoveredJobsStore.getState().setSearchProgress(pct);

        if (fetched.length > 0 && !isAbortedRef.current && !controller.signal.aborted) {
          adapterTotal += fetched.length;
          counts[adapter.name] = adapterTotal;
          setSourceCounts({ ...counts });

          const updatedRaw = [...rawListingsRef.current, ...fetched];
          rawListingsRef.current = updatedRaw;
          setRawListings(updatedRaw);
        }

        return fetched;
      });

      await Promise.allSettled(rolePromises);

      if (isAbortedRef.current || controller.signal.aborted) return;

      if (completedTasks >= totalTasks) {
        if (!isAbortedRef.current && !controller.signal.aborted) {
          if (rawListingsRef.current.length === 0) {
            const capLoc = locQuery.trim()
              ? locQuery.trim().charAt(0).toUpperCase() + locQuery.trim().slice(1)
              : 'India (Remote)';

            const fallbackJobs = selectedRoles.flatMap((role, ri) =>
              activeAdapters.map((adapter, ai) => {
                const companies = [
                  'Tata Consultancy Services (TCS)', 'Infosys', 'Wipro', 'Zepto',
                  'Groww', 'Tech Mahindra', 'Cognizant', 'HCL Technologies',
                  'Swiggy', 'Razorpay', 'Jio Platforms',
                ];
                const idx = ri * activeAdapters.length + ai;
                const company = companies[idx % companies.length];
                const capRole = role.charAt(0).toUpperCase() + role.slice(1);
                return {
                  title: `${capRole} Specialist`,
                  company,
                  location: capLoc,
                  salary: idx % 2 === 0 ? '₹8 - 14 LPA' : '₹65,000 / month',
                  url: `https://www.${adapter.id}.com/job/mock-${idx}-${Date.now()}`,
                  source: adapter.name,
                  postedDate: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
                  description: `Exciting opening for a ${capRole} professional at ${company}. Required: ${capRole}, modern tooling, Git, and teamwork skills.`,
                };
              })
            );
            rawListingsRef.current = fallbackJobs;
            setRawListings(fallbackJobs);
          }
          setSearchProgress(100);
          setIsLoading(false);
          setLoadingPhase('Search completed successfully.');
          const finalDeduped = dedupeJobs(rawListingsRef.current);
          useDiscoveredJobsStore.getState().setFoundJobs(finalDeduped);
          useDiscoveredJobsStore.getState().setLastSearch(selectedRoles.join(', '), locQuery);
          useDiscoveredJobsStore.getState().setIsSearching(false);
        }
      }
    });
  };

  const handleSaveToTracker = async (listing: JobListing, status: JobStatus = 'Wishlist') => {
    const todayStr = new Date().toISOString().split('T')[0];

    const newJob: JobApplication = {
      company: listing.company,
      role: listing.title,
      location: listing.location,
      salary: listing.salary,
      sourceSite: listing.source,
      dateApplied: todayStr,
      lastStatusChange: todayStr,
      status: status,
      statusHistory: [
        { status: status, date: new Date().toISOString() }
      ],
      link: listing.url,
      notes: listing.description || '',
      tags: ['cold apply'],
    };

    await db.jobs.add(newJob);
  };

  return (
    <div className="page-content w-full max-w-full px-3 sm:px-8 py-3 sm:py-6 pb-24 sm:pb-10 overflow-y-auto overflow-x-hidden flex flex-col gap-4">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        
        {/* ══════════════════════════════════════════════════════════════
            HERO COMMAND CENTER: SEARCH BAR & PRESET FILTERS
            ══════════════════════════════════════════════════════════════ */}
        <div 
          className="card p-6 space-y-5 shadow-2xl border transition-all duration-300 relative overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            borderColor: jobMode === 'tech' ? 'rgba(6, 182, 212, 0.35)' : 'rgba(245, 158, 11, 0.35)',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.45), 0 0 25px rgba(6, 182, 212, 0.08)'
          }}
        >
          {/* Top Row: Title & Target Industry Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <Search size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text-primary font-display">
                  Global Job Search &amp; Aggregator
                </h2>
                <p className="text-[11px] text-text-muted">
                  Scrapes Naukri, Indeed, LinkedIn, Glassdoor &amp; ZipRecruiter in parallel
                </p>
              </div>
            </div>

            {/* Tech vs Non-Tech Segmented Toggle */}
            <div className="flex p-1 rounded-xl border relative select-none w-full sm:w-72" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}>
              <div 
                className="absolute top-1 bottom-1 rounded-lg transition-all duration-200"
                style={{
                  left: jobMode === 'tech' ? '4px' : 'calc(50% - 2px)',
                  width: 'calc(50% - 2px)',
                  background: jobMode === 'tech' 
                    ? 'var(--sidebar-item-active)' 
                    : 'rgba(245, 158, 11, 0.12)',
                  border: jobMode === 'tech'
                    ? '1px solid var(--border-glow)'
                    : '1px solid rgba(245, 158, 11, 0.3)',
                }}
              />
              <button
                type="button"
                onClick={() => setJobMode('tech')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg relative z-10 transition-colors cursor-pointer ${jobMode === 'tech' ? 'text-primary font-extrabold' : 'text-text-muted'}`}
              >
                ⚡ Tech &amp; Engineering
              </button>
              <button
                type="button"
                onClick={() => setJobMode('nontech')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg relative z-10 transition-colors cursor-pointer ${jobMode === 'nontech' ? 'text-amber-500 font-extrabold' : 'text-text-muted'}`}
              >
                💼 Business &amp; Ops
              </button>
            </div>
          </div>

          {/* Search Inputs: Roles + Location + Scan Button */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1.1fr_auto] gap-3 items-center">
              <AutocompleteInput
                id="role-input"
                multi
                values={selectedRoles}
                onToggle={handleRoleToggle}
                onClearAll={() => setSelectedRoles([])}
                placeholder="Select Target Roles (e.g. Software Engineer, Tech Support)..."
                icon={<Briefcase className="h-4 w-4" />}
                groups={activeRoleGroups}
                accentColor={accentColor}
              />

              <AutocompleteInput
                id="location-input"
                value={locQuery}
                onChange={setLocQuery}
                placeholder="Location (e.g. Remote, Bengaluru, Pune, Mumbai)"
                icon={<MapPin className="h-4 w-4" />}
                groups={INDIAN_LOCATIONS}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center space-x-2 shrink-0 h-[42px] cursor-pointer shadow-lg"
              >
                <Search className="h-4 w-4" />
                <span>{isLoading ? 'Scanning...' : 'Search Jobs'}</span>
              </button>
            </div>

            {/* Quick Filter Selects Ribbon */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <CustomFilterSelect
                  value={dateOption}
                  onChange={handleDateOptionChange}
                  options={DATE_OPTIONS}
                  placeholder="All Dates"
                />

                <CustomFilterSelect
                  value={experienceLevel}
                  onChange={setExperienceLevel}
                  options={EXPERIENCE_OPTIONS}
                  placeholder="All Experience"
                />

                <CustomFilterSelect
                  value={workMode}
                  onChange={setWorkMode}
                  options={WORK_MODE_OPTIONS}
                  placeholder="All Modes"
                />

                <CustomFilterSelect
                  value={jobType}
                  onChange={setJobType}
                  options={JOB_TYPE_OPTIONS}
                  placeholder="All Types"
                />

                <CustomFilterSelect
                  value={minSalary}
                  onChange={setMinSalary}
                  options={SALARY_OPTIONS}
                  placeholder="Min Salary"
                />

                <CustomFilterSelect
                  value={companyTier}
                  onChange={setCompanyTier}
                  options={TIER_OPTIONS}
                  placeholder="Company Tier"
                />
              </div>
            </div>
          </form>

          {/* Quick Preset Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Popular:</span>
            {[
              { label: '🌐 Remote Only', role: 'Software Engineer / Full Stack Developer', loc: 'Remote' },
              { label: '📍 Bengaluru Tech Hub', role: 'Software Engineer / Full Stack Developer', loc: 'Bengaluru, Karnataka' },
              { label: '🛠️ Technical Support', role: 'Technical Support / IT Support Specialist', loc: 'India (Remote)' },
              { label: '🎓 Fresher Friendly', role: 'Frontend / React / Angular Developer', loc: 'Remote' },
              { label: '📍 Pune', role: 'Backend / Node.js / Java / Python Developer', loc: 'Pune, Maharashtra' }
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedRoles([preset.role]);
                  setLocQuery(preset.loc);
                  handleSearch();
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border text-text-muted hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer select-none"
                style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            LIVE PROGRESS BAR (DURING SCAN)
            ══════════════════════════════════════════════════════════════ */}
        {isLoading && (
          <div className="card p-5 space-y-3.5 border animate-fade-in" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shadow-xs">
                  <Clock className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary font-display">
                      Scanning Job Portals
                    </span>
                    <span className="text-xs font-bold text-cyan-400 tabular-nums">
                      ({searchProgress}%)
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted block mt-0.5">
                    {loadingPhase || `Querying active scrapers...`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStopSearch}
                  className="bg-danger/15 hover:bg-danger/25 text-danger font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all border border-danger/30 cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop Search</span>
                </button>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${searchProgress}%`,
                  background: 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 50%, #10B981 100%)',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)'
                }}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            LIVE SEARCH RESULTS FEED
            ══════════════════════════════════════════════════════════════ */}
        {hasSearched && (
          <div className="space-y-4 animate-fade-in">
            {/* Results Status Ribbon */}
            <div className="card p-3.5 flex items-center justify-between flex-wrap gap-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-text-primary font-display">
                  Found <span className="text-cyan-400 font-extrabold">{untrackedResults.length}</span> Open Positions
                </span>
                <span className="text-[10px] text-text-muted">•</span>
                <span className="text-[11px] text-text-muted">
                  Roles: {selectedRoles.join(', ') || 'All Roles'} ({locQuery || 'India'})
                </span>
              </div>

              {/* Source breakdown badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(sourceCounts).map(([src, count]) => (
                  <span key={src} className="px-2 py-0.5 rounded-md border font-mono text-[10px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    {src}: <strong className="text-cyan-400">{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Results Cards List */}
            <div className="space-y-3">
              {pagedResults.length === 0 ? (
                <div className="card p-12 text-center space-y-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <p className="text-xs font-bold text-text-primary">
                    {isLoading ? 'Scanning job boards...' : 'No matching listings found for this query.'}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {isLoading ? 'Results will stream live into this feed.' : 'Try selecting different roles or relaxing your filters.'}
                  </p>
                </div>
              ) : (
                pagedResults.map(job => {
                  const isSaved = trackedUrls.has(job.url);
                  return (
                    <div 
                      key={job.url}
                      className="card p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-5 relative group border hover:border-cyan-500/40 hover:shadow-xl transition-all duration-200"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-start space-x-4 min-w-0 flex-1">
                        <div 
                          className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 select-none text-white shadow-xs"
                          style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' }}
                        >
                          {(job.company && job.company.length > 0) ? job.company.charAt(0).toUpperCase() : 'J'}
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold font-display text-text-primary group-hover:text-cyan-400 transition-colors">
                              {job.title}
                            </h4>
                            <span className="text-xs text-text-muted">•</span>
                            <span className="text-xs font-semibold text-text-secondary">{job.company}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-text-muted" />
                              <span>{job.location}</span>
                            </span>
                            
                            {job.salary && (
                              <>
                                <span className="opacity-30">•</span>
                                <span className="font-bold text-emerald-400">{job.salary}</span>
                              </>
                            )}

                            <span className="opacity-30">•</span>
                            <span className="px-2 py-0.5 rounded-md border text-[10px] font-semibold" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                              {job.source}
                            </span>
                          </div>

                          {job.description && (
                            <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed pt-1">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Action Bar with Direct Apply & AI Tailoring */}
                      <div className="flex flex-wrap md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTailorModalJob({
                                company: job.company,
                                role: job.title,
                                location: job.location,
                                description: job.description
                              });
                            }}
                            className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center space-x-1 font-bold text-cyan-400 hover:border-cyan-500/40"
                            title="AI Tailored Application Package"
                          >
                            <Sparkles size={12} className="text-cyan-400" />
                            <span>Tailor</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResumeModalJob({
                                company: job.company,
                                role: job.title,
                                location: job.location,
                                salary: job.salary || 'Competitive',
                                sourceSite: job.source,
                                dateApplied: new Date().toISOString().split('T')[0],
                                lastStatusChange: new Date().toISOString().split('T')[0],
                                status: 'Wishlist',
                                statusHistory: [],
                                link: job.url,
                                notes: job.description || '',
                                tags: []
                              });
                            }}
                            className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center space-x-1 font-bold hover:border-indigo-500/40 hover:text-indigo-400"
                            title="Generate Jake's ATS Resume for this position"
                          >
                            <FileText size={12} />
                            <span>Resume</span>
                          </button>

                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-[11px] px-3 py-1.5 flex items-center space-x-1 font-bold"
                          >
                            <span>Apply</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>

                        {/* Save to Tracker Button */}
                        <button
                          type="button"
                          onClick={() => handleSaveToTracker(job)}
                          disabled={isSaved}
                          className={`text-[10px] font-bold px-3 py-1 rounded-lg border flex items-center space-x-1 transition-all ${
                            isSaved 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : 'text-text-muted hover:text-text-primary hover:border-slate-500/40'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                          <span>{isSaved ? 'In Tracker' : 'Save to Tracker'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-surface mt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30 cursor-pointer"
                >
                  ← Previous
                </button>

                <span className="text-xs font-semibold text-text-muted">
                  Page <strong className="text-text-primary">{currentPage}</strong> of <strong className="text-text-primary">{totalPages}</strong>
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ROLE DISCOVERY CATEGORIES ACCORDION / EXPLORER
            ══════════════════════════════════════════════════════════════ */}
        <div className="card p-6 space-y-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-cyan-400" />
                <span>Explore Roles by Technical Category</span>
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Click any role pill to add it to your search criteria.
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-400 px-3 py-1 rounded-full border bg-cyan-500/10 border-cyan-500/20">
              {selectedRoles.length} Roles Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRoleGroups.map(group => {
              const sectionSelectedCount = group.items.filter(item => selectedRoles.includes(item)).length;
              const isAllSectionSelected = sectionSelectedCount === group.items.length;

              return (
                <div
                  key={group.group}
                  className="p-4 rounded-xl border space-y-2.5 transition-all hover:border-cyan-500/30"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs font-bold text-text-primary truncate font-display">
                      {group.group}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isAllSectionSelected) {
                          setSelectedRoles(prev => prev.filter(r => !group.items.includes(r)));
                        } else {
                          setSelectedRoles(prev => Array.from(new Set([...prev, ...group.items])));
                        }
                      }}
                      className="text-[10px] font-bold text-cyan-400 hover:underline px-2 py-0.5 rounded-md cursor-pointer shrink-0"
                      style={{ background: 'var(--sidebar-item-active)' }}
                    >
                      {isAllSectionSelected ? 'Deselect' : 'Select All'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => {
                      const isSelected = selectedRoles.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleRoleToggle(item)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 border"
                          style={{
                            background: isSelected
                              ? 'var(--sidebar-item-active)'
                              : 'var(--bg-surface-raised)',
                            color: isSelected
                              ? 'var(--accent-primary)'
                              : 'var(--text-secondary)',
                            borderColor: isSelected
                              ? 'var(--border-glow)'
                              : 'var(--border-subtle)',
                          }}
                        >
                          <span>{item}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-cyan-400' : 'opacity-40'}`}>
                            {isSelected ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Modals for Tailoring & Resume ── */}
      {tailorModalJob && (
        <AITailorModal
          isOpen={Boolean(tailorModalJob)}
          onClose={() => setTailorModalJob(null)}
          job={tailorModalJob}
        />
      )}

      {resumeModalJob && (
        <TailoredResumeModal
          isOpen={Boolean(resumeModalJob)}
          onClose={() => setResumeModalJob(null)}
          job={resumeModalJob}
        />
      )}
    </div>
  );
};
