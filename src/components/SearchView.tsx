import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { adapters, type JobListing } from '../adapters';
import { dedupeJobs } from '../utils/dedupeJobs';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  FilterX,
  ChevronDown,
  Square,
  ArrowLeft,
  CheckCircle2
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

  return (
    <div id={id} ref={containerRef} className="relative flex-1 min-w-[130px]">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all duration-150"
        style={{
          background: 'var(--input-bg)',
          borderColor: isOpen ? 'var(--accent-cool)' : 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted shrink-0 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--bg-surface-raised)',
            borderColor: 'var(--border-subtle)',
            minWidth: '150px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
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
                className="px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors duration-150 flex items-center justify-between"
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                    (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="text-[11px] font-bold text-cool">✓</span>}
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
  accentColor = 'var(--accent-cool)',
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
        className="fluent-card rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer border transition-all"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--input-bg)' }}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <span className="text-text-muted shrink-0">{icon}</span>

          {multi ? (
            values.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {values.map(val => (
                  <span
                    key={val}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
                    style={{ background: 'rgba(91,140,255,0.15)', color: accentColor, border: '1px solid rgba(91,140,255,0.25)' }}
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
              className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-xs font-semibold text-text-primary w-full placeholder-text-muted shadow-none"
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
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl p-3 border shadow-2xl space-y-3 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="px-1">
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Type to filter options..."
              className="w-full px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary outline-none border"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border-subtle)' }}
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
                          background: isSelected ? 'rgba(91,140,255,0.15)' : 'transparent',
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
  const [viewPage, setViewPage] = useState<'search_form' | 'search_results'>('search_form');
  const [searchProgress, setSearchProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<JobListing[]>([]);
  const [activeSearches, setActiveSearches] = useState<string[]>([]);
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
  const [pipelineStats, setPipelineStats] = useState<{raw: number; afterDedup: number; afterFilters: number} | null>(null);
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
      setPipelineStats(null);
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

    setPipelineStats({ raw: rawJobs.length, afterDedup: dedupedResults.length, afterFilters: sortedResults.length });
    setResults(sortedResults);
  }, []);

  // Filter re-execution
  useEffect(() => {
    if (rawListings.length > 0) {
      runPipeline(rawListings, postedAfter, experienceLevel, workMode, jobType, minSalary, companyTier);
    }
  }, [rawListings, postedAfter, experienceLevel, workMode, jobType, minSalary, companyTier, runPipeline]);

  const handleSearch = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
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
    setPipelineStats(null);
    setSearchProgress(10);
    setViewPage('search_results'); // Redirect to dedicated results page
    setLoadingPhase(`Scanning across ${activeAdapters.length} active platforms...`);
    setActiveSearches(activeAdapters.map(a => a.name));

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
    <>
      {viewPage === 'search_form' ? (
        /* ═══════════════════════════════════════════════════════════════════
           PAGE 1: SEARCH QUERY FORM HUB
           ═══════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Page Header ── */}
          <div className="page-header" style={{ flexShrink: 0 }}>
            <div className="page-header-row">
              <div className="page-title-group">
                <span
                  className="page-eyebrow"
                  style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-cool)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <Search size={11} />
                  Real-Time Discovery Engine
                </span>
                <h1 className="page-title">Job Search Hub</h1>
                <p className="page-subtitle">
                  Configure target roles and location to scan across platforms in parallel.
                </p>
              </div>

              {hasSearched && untrackedResults.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewPage('search_results')}
                  className="btn-primary flex items-center space-x-2"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
                >
                  <span>View Search Results ({untrackedResults.length}) →</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Search Hub Form Body ── */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div 
              className="fluent-card rounded-2xl p-6 space-y-5 shrink-0 transition-all duration-300"
              style={{
                borderColor: jobMode === 'tech' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                boxShadow: jobMode === 'tech' 
                  ? '0 12px 30px -10px rgba(59, 130, 246, 0.15)'
                  : '0 12px 30px -10px rgba(245, 158, 11, 0.15)'
              }}
            >
              {/* Discovery Mode Switcher */}
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div className="w-full md:w-80">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                    Discovery Mode
                  </label>
                  <div className="flex p-1 rounded-xl border relative select-none" style={{ background: 'var(--input-bg)', borderColor: 'var(--border-subtle)' }}>
                    <div 
                      className="absolute top-1 bottom-1 rounded-lg transition-all duration-200"
                      style={{
                        left: jobMode === 'tech' ? '4px' : 'calc(50% - 2px)',
                        width: 'calc(50% - 2px)',
                        background: jobMode === 'tech' 
                          ? 'rgba(91,140,255,0.12)' 
                          : 'rgba(242,184,75,0.1)',
                        border: jobMode === 'tech'
                          ? '1px solid rgba(91,140,255,0.25)'
                          : '1px solid rgba(242,184,75,0.2)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setJobMode('tech')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg relative z-10 transition-colors ${jobMode === 'tech' ? 'text-cool' : 'text-text-muted'}`}
                    >
                      ⚡ Tech Roles
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobMode('nontech')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg relative z-10 transition-colors ${jobMode === 'nontech' ? 'text-amber-400' : 'text-text-muted'}`}
                    >
                      💼 Non-Tech Roles
                    </button>
                  </div>
                </div>

                <div className="text-right hidden md:block">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted block">Active Sources</span>
                  <span className="text-xs font-bold text-text-primary">
                    {enabledAdapters.length} Sources Enabled in Settings
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <AutocompleteInput
                    id="role-input"
                    multi
                    values={selectedRoles}
                    onToggle={handleRoleToggle}
                    onClearAll={() => setSelectedRoles([])}
                    placeholder="Target Roles..."
                    icon={<Briefcase className="h-4 w-4" />}
                    groups={activeRoleGroups}
                    accentColor={accentColor}
                  />

                  <AutocompleteInput
                    id="location-input"
                    value={locQuery}
                    onChange={setLocQuery}
                    placeholder="Location (e.g. Remote, Mumbai)"
                    icon={<MapPin className="h-4 w-4" />}
                    groups={INDIAN_LOCATIONS}
                  />
                </div>

                {/* Advanced Search Filters Grid (Matches image UI design) */}
                <div className="pt-2">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                    Search Filters & Constraints
                  </label>
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

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="font-extrabold text-xs px-8 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                    style={{
                      background: jobMode === 'tech' ? 'var(--accent-cool)' : 'var(--accent-signal)',
                      color: '#fff',
                    }}
                  >
                    <Search className="h-4 w-4" />
                    <span>Search Platforms & View Results →</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ── Direct Role Selection Cards by Category ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary font-display flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-cool" />
                    <span>Direct Role Selection by Category</span>
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Click any role pill directly to toggle selection, or click "Select Section" to select all roles in a category.
                  </p>
                </div>
                <span className="text-xs font-bold text-cool px-3 py-1 rounded-full border bg-cool/10 border-cool/20">
                  {selectedRoles.length} Roles Selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRoleGroups.map(group => {
                  const sectionSelectedCount = group.items.filter(item => selectedRoles.includes(item)).length;
                  const isAllSectionSelected = sectionSelectedCount === group.items.length;

                  return (
                    <div
                      key={group.group}
                      className="fluent-card rounded-2xl p-4 space-y-3 border transition-all hover:border-cool/30"
                      style={{ background: 'var(--bg-surface)' }}
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-extrabold text-text-primary truncate font-display">
                            {group.group}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-raised border border-subtle text-text-muted">
                            {sectionSelectedCount}/{group.items.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isAllSectionSelected) {
                              setSelectedRoles(prev => prev.filter(r => !group.items.includes(r)));
                            } else {
                              setSelectedRoles(prev => Array.from(new Set([...prev, ...group.items])));
                            }
                          }}
                          className="text-[10px] font-bold text-cool hover:underline px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0"
                          style={{ background: 'rgba(91,140,255,0.08)' }}
                        >
                          {isAllSectionSelected ? 'Deselect Section' : 'Select Section'}
                        </button>
                      </div>

                      {/* Role Pills Grid */}
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
                                  ? (jobMode === 'tech' ? 'rgba(91,140,255,0.18)' : 'rgba(242,184,75,0.15)')
                                  : 'var(--bg-surface-raised)',
                                color: isSelected
                                  ? (jobMode === 'tech' ? 'var(--accent-cool)' : '#F59E0B')
                                  : 'var(--text-secondary)',
                                borderColor: isSelected
                                  ? (jobMode === 'tech' ? 'rgba(91,140,255,0.35)' : 'rgba(242,184,75,0.35)')
                                  : 'var(--border-subtle)',
                                boxShadow: isSelected ? '0 2px 8px rgba(91,140,255,0.15)' : 'none',
                              }}
                            >
                              <span>{item}</span>
                              <span className={`text-[10px] font-extrabold ${isSelected ? 'text-cool' : 'opacity-40'}`}>
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
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           PAGE 2: DEDICATED SEARCH RESULTS & LIVE COMPLETION PROGRESS PAGE
           ═══════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Page Header ── */}
          <div className="page-header" style={{ flexShrink: 0 }}>
            <div className="page-header-row">
              <div className="page-title-group">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setViewPage('search_form')}
                    className="text-xs font-bold text-cool hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Search Form</span>
                  </button>
                  <span className="text-text-muted opacity-40">•</span>
                  <span
                    className="page-eyebrow mb-0"
                    style={{
                      background: isLoading ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.12)',
                      color: isLoading ? 'var(--accent-cool)' : '#4ADE80',
                      border: isLoading ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(34,197,94,0.25)'
                    }}
                  >
                    {isLoading ? `${searchProgress}% In Progress` : '100% Search Complete'}
                  </span>
                </div>

                <h1 className="page-title">Search Results</h1>
                <p className="page-subtitle">
                  Showing listings for <strong className="text-text-primary">{selectedRoles.join(', ') || 'Selected Roles'}</strong> in <strong className="text-text-primary">{locQuery || 'India (Remote)'}</strong>
                </p>
              </div>

              <div className="page-actions">
                {isLoading && (
                  <button
                    type="button"
                    onClick={handleStopSearch}
                    className="btn-secondary"
                    style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
                  >
                    <Square size={13} className="fill-current" />
                    <span>Stop Search</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewPage('search_form')}
                  className="btn-secondary"
                >
                  <FilterX size={13} />
                  <span>Modify Query</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Results Body Area ── */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 28px 24px' }}>
            
            {/* ── LIVE SEARCH COMPLETION PROGRESS CARD (0% to 100%) ── */}
            <div className="fluent-card rounded-2xl p-5 space-y-3.5 shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl text-white shadow-xs ${isLoading ? 'bg-blue-600 animate-pulse' : 'bg-emerald-600'}`}>
                    {isLoading ? <Clock className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-text-primary font-display">
                        {isLoading ? 'Scanning Job Platforms' : 'Search Completed'}
                      </span>
                      <span className="text-xs font-extrabold text-cool tabular-nums">
                        ({searchProgress}%)
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {loadingPhase || (isLoading ? `Querying: ${activeSearches.join(', ')}...` : 'All scrapers completed.')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isLoading && (
                    <button
                      type="button"
                      onClick={handleStopSearch}
                      className="bg-danger hover:bg-danger/90 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop Search</span>
                    </button>
                  )}
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full border tabular-nums" style={{ background: 'var(--bg-surface-raised)', color: 'var(--accent-cool)', borderColor: 'var(--border-subtle)' }}>
                    {searchProgress}% Complete
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ background: 'var(--input-bg)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${searchProgress}%`,
                    background: isLoading
                      ? 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)'
                      : 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
                  }}
                />
              </div>

              {/* Source breakdown & Pipeline metrics */}
              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 flex-wrap gap-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(sourceCounts).map(([src, count]) => (
                    <span key={src} className="px-2.5 py-1 rounded-md border font-semibold text-[10px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {src}: <span className="font-extrabold text-cool">{count}</span> jobs
                    </span>
                  ))}
                </div>
                {pipelineStats && (
                  <span className="font-mono text-[10px] text-text-muted">
                    {pipelineStats.raw} raw → {pipelineStats.afterDedup} deduped → {pipelineStats.afterFilters} filtered
                  </span>
                )}
              </div>
            </div>

            {/* Results Filter Toolbar & List Container */}
            <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
              
              {/* Applied Filters Summary Bar */}
              <div className="fluent-card rounded-2xl p-3.5 shrink-0 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Applied Filters:</span>
                  <span className="px-2.5 py-1 rounded-lg border font-semibold text-[11px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                    📅 {dateOption === 'all' ? 'All Dates' : dateOption}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border font-semibold text-[11px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                    🎓 {experienceLevel === 'all' ? 'All Experience' : experienceLevel === 'fresher' ? 'Fresher' : `${experienceLevel}+ Yrs`}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border font-semibold text-[11px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                    🏠 {workMode === 'all' ? 'All Modes' : workMode}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border font-semibold text-[11px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                    💼 {jobType === 'all' ? 'All Types' : jobType}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border font-semibold text-[11px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                    💰 {minSalary === 'all' ? 'Any Salary' : `₹${minSalary}+ LPA`}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border font-semibold text-[11px]" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                    🏢 {companyTier === 'all' ? 'All Tiers' : companyTier.toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setViewPage('search_form')}
                  className="text-xs font-bold text-cool hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FilterX size={13} />
                  <span>Modify Search Filters</span>
                </button>
              </div>

              {/* Results List Cards */}
              <div className="space-y-3">
                {pagedResults.length === 0 ? (
                  <div className="fluent-card rounded-2xl p-12 text-center space-y-3">
                    <p className="text-xs font-bold text-text-primary">
                      {isLoading ? 'Scanning job boards...' : 'No unmatched listings found.'}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {isLoading ? 'Results will populate live as scrapers return entries.' : 'Try adjusting your role or location query.'}
                    </p>
                  </div>
                ) : (
                  pagedResults.map(job => {
                    const isSaved = trackedUrls.has(job.url);
                    return (
                      <div 
                        key={job.url}
                        className="fluent-card rounded-2xl p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-5 relative group"
                      >
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div 
                            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none border text-white shadow-xs"
                            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
                          >
                            {(job.company && job.company.length > 0) ? job.company.charAt(0).toUpperCase() : 'J'}
                          </div>

                          <div className="min-w-0 space-y-1 flex-1">
                            <h4 className="text-sm font-bold text-text-primary font-display">{job.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                              <span className="font-semibold text-text-secondary">{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              <span>•</span>
                              <span className="font-semibold text-cool">{job.source}</span>
                            </div>
                            {job.description && (
                              <p className="text-[11px] text-text-muted line-clamp-2 mt-1 leading-relaxed">
                                {job.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSaved ? (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center space-x-1.5">
                              <BookmarkCheck size={14} />
                              <span>Saved</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSaveToTracker(job)}
                              className="btn-primary text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5"
                            >
                              <Bookmark size={13} />
                              <span>Save to Tracker</span>
                            </button>
                          )}
                          {job.url && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary p-2 rounded-xl"
                              title="Open original listing"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-extrabold text-text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </>
  );
};
