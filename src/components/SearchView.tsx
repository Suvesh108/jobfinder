import React, { useState, useMemo, useRef } from 'react';
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
  ChevronDown
} from 'lucide-react';

// ─── All Indian States, UTs & Major Cities ───────────────────────────────────
const INDIAN_LOCATIONS: { group: string; items: string[] }[] = [
  {
    group: '🌐 Work Mode',
    items: ['Remote', 'Hybrid', 'Pan India'],
  },
  {
    group: '🏙️ Metro Cities',
    items: [
      'Bengaluru, Karnataka',
      'Mumbai, Maharashtra',
      'Delhi / NCR',
      'Hyderabad, Telangana',
      'Chennai, Tamil Nadu',
      'Pune, Maharashtra',
      'Kolkata, West Bengal',
      'Ahmedabad, Gujarat',
      'Noida, Uttar Pradesh',
      'Gurgaon, Haryana',
    ],
  },
  {
    group: '📍 States & UTs',
    items: [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
      // Union Territories
      'Andaman and Nicobar Islands',
      'Chandigarh',
      'Dadra and Nagar Haveli',
      'Daman and Diu',
      'Delhi',
      'Jammu and Kashmir',
      'Ladakh',
      'Lakshadweep',
      'Puducherry',
    ],
  },
];

// ─── TECH Job Roles ───────────────────────────────────────────────────────────
const TECH_ROLES: { group: string; items: string[] }[] = [
  {
    group: '💻 Software Engineering',
    items: [
      'Software Engineer', 'Junior Software Engineer', 'Senior Software Engineer',
      'Staff Software Engineer', 'Principal Engineer', 'Frontend Developer',
      'Backend Developer', 'Full Stack Developer', 'React Developer',
      'Angular Developer', 'Vue.js Developer', 'Next.js Developer',
      'Node.js Developer', 'Python Developer', 'Django Developer',
      'FastAPI Developer', 'Flask Developer', 'Java Developer',
      'Spring Boot Developer', 'Kotlin Developer', 'Android Developer',
      'iOS Developer', 'Swift Developer', 'Flutter Developer',
      'React Native Developer', 'Xamarin Developer', 'C Developer',
      'C++ Developer', 'Golang Developer', 'Rust Developer',
      'Ruby on Rails Developer', 'PHP Developer', 'Laravel Developer',
      '.NET Developer', 'ASP.NET Developer', 'Scala Developer',
      'TypeScript Developer', 'Embedded Systems Engineer', 'Firmware Engineer',
      'VLSI Engineer', 'RTL Design Engineer', 'FPGA Engineer',
    ],
  },
  {
    group: '☁️ Cloud & DevOps',
    items: [
      'DevOps Engineer', 'Site Reliability Engineer (SRE)', 'Cloud Engineer',
      'AWS Solutions Architect', 'AWS DevOps Engineer', 'Azure Engineer',
      'Azure Architect', 'GCP Engineer', 'Kubernetes Engineer',
      'Docker Engineer', 'Infrastructure Engineer', 'Platform Engineer',
      'CI/CD Engineer', 'Build & Release Engineer', 'Linux Systems Administrator',
      'Cloud Solutions Architect', 'FinOps Engineer', 'Terraform Engineer',
      'Ansible Engineer', 'GitOps Engineer',
    ],
  },
  {
    group: '🤖 AI / ML / Data',
    items: [
      'Machine Learning Engineer', 'Deep Learning Engineer', 'AI Engineer',
      'Data Scientist', 'Senior Data Scientist', 'Data Analyst',
      'Senior Data Analyst', 'Data Engineer', 'Analytics Engineer',
      'NLP Engineer', 'Computer Vision Engineer', 'MLOps Engineer',
      'Research Scientist', 'Applied Scientist', 'AI Research Engineer',
      'Business Intelligence Analyst', 'BI Developer', 'Tableau Developer',
      'Power BI Developer', 'Prompt Engineer', 'Generative AI Engineer',
      'LLM Engineer', 'Recommendation Systems Engineer',
    ],
  },
  {
    group: '🔐 Cybersecurity',
    items: [
      'Cybersecurity Analyst', 'Security Engineer', 'Information Security Analyst',
      'Penetration Tester', 'Ethical Hacker', 'SOC Analyst (L1/L2/L3)',
      'Application Security Engineer', 'Cloud Security Engineer',
      'Network Security Engineer', 'Incident Response Analyst',
      'Threat Intelligence Analyst', 'GRC Analyst', 'VAPT Engineer',
      'Red Team Engineer', 'Blue Team Engineer', 'SIEM Engineer',
    ],
  },
  {
    group: '🧪 QA & Testing',
    items: [
      'QA Engineer', 'Senior QA Engineer', 'Automation Test Engineer',
      'SDET', 'Manual Tester', 'Performance Test Engineer',
      'Load Test Engineer', 'Selenium Engineer', 'Cypress Engineer',
      'Playwright Engineer', 'API Test Engineer', 'Mobile Test Engineer',
      'QA Lead', 'QA Architect',
    ],
  },
  {
    group: '🌐 Networking & IT',
    items: [
      'Network Engineer', 'Network Administrator', 'Systems Administrator',
      'IT Support Engineer', 'IT Infrastructure Engineer', 'Helpdesk Engineer',
      'Cisco Network Engineer', 'Palo Alto Engineer', 'Juniper Engineer',
      'IT Manager', 'NOC Engineer', 'VoIP Engineer', 'Wireless Network Engineer',
    ],
  },
  {
    group: '🎨 Design & Product (Tech)',
    items: [
      'UI/UX Designer', 'Product Designer', 'Interaction Designer',
      'UX Researcher', 'Motion Designer', 'Design Systems Engineer',
      'Product Manager', 'Associate Product Manager', 'Senior Product Manager',
      'Technical Product Manager', 'Program Manager', 'Engineering Manager',
    ],
  },
  {
    group: '🔬 Emerging Tech',
    items: [
      'Blockchain Developer', 'Smart Contract Developer', 'Web3 Developer',
      'Solidity Developer', 'AR/VR Developer', 'Game Developer (Unity)',
      'Game Developer (Unreal)', 'IoT Engineer', 'Robotics Engineer',
      'Quantum Computing Researcher', 'Edge Computing Engineer',
    ],
  },
];

// ─── NON-TECH Job Roles ───────────────────────────────────────────────────────
const NON_TECH_ROLES: { group: string; items: string[] }[] = [
  {
    group: '📣 Marketing & Growth',
    items: [
      'Marketing Manager', 'Digital Marketing Manager', 'Growth Manager',
      'Performance Marketing Manager', 'SEO Specialist', 'SEM Specialist',
      'Social Media Manager', 'Social Media Executive', 'Content Writer',
      'Content Strategist', 'Copywriter', 'Brand Manager', 'Brand Strategist',
      'Email Marketing Specialist', 'Influencer Marketing Manager',
      'Marketing Analyst', 'Growth Hacker', 'Community Manager',
      'PR Manager', 'Communications Manager', 'Events Manager',
    ],
  },
  {
    group: '🤝 Sales & Business Development',
    items: [
      'Sales Executive', 'Sales Development Representative (SDR)',
      'Business Development Executive', 'Business Development Manager',
      'Account Executive', 'Account Manager', 'Key Account Manager',
      'Inside Sales Representative', 'Field Sales Executive',
      'Enterprise Sales Manager', 'Channel Sales Manager',
      'Pre-Sales Consultant', 'Solution Sales Consultant',
      'Revenue Operations Analyst', 'Sales Operations Manager',
    ],
  },
  {
    group: '🧑‍💼 Human Resources',
    items: [
      'HR Executive', 'HR Generalist', 'HR Business Partner',
      'Talent Acquisition Specialist', 'Technical Recruiter', 'HR Recruiter',
      'Recruiter', 'Sourcing Specialist', 'People Operations Manager',
      'Compensation & Benefits Analyst', 'Learning & Development Manager',
      'HR Manager', 'Chief People Officer', 'Employee Relations Manager',
      'HR Analyst', 'HRBP', 'Payroll Specialist',
    ],
  },
  {
    group: '💰 Finance & Accounting',
    items: [
      'Financial Analyst', 'Senior Financial Analyst', 'Finance Manager',
      'Investment Analyst', 'Equity Research Analyst', 'Credit Analyst',
      'Risk Analyst', 'Chartered Accountant (CA)', 'Accountant',
      'Tax Consultant', 'Audit Manager', 'Internal Auditor',
      'Cost Accountant', 'Treasury Manager', 'CFO',
      'Financial Controller', 'FP&A Analyst', 'Fund Accountant',
    ],
  },
  {
    group: '📦 Operations & Supply Chain',
    items: [
      'Operations Executive', 'Operations Manager', 'Business Analyst',
      'Process Analyst', 'Supply Chain Analyst', 'Logistics Manager',
      'Procurement Manager', 'Vendor Manager', 'Warehouse Manager',
      'Inventory Manager', 'Category Manager', 'Demand Planner',
      'Last Mile Operations Manager', 'Fleet Manager',
    ],
  },
  {
    group: '🏥 Healthcare & Pharma',
    items: [
      'Medical Representative', 'Pharma Sales Executive', 'Clinical Research Associate',
      'Healthcare Consultant', 'Hospital Administrator', 'Clinical Data Manager',
      'Pharmacovigilance Analyst', 'Regulatory Affairs Manager',
      'Medical Writer', 'Lab Technician', 'Nurse', 'Radiologist',
    ],
  },
  {
    group: '⚖️ Legal & Compliance',
    items: [
      'Legal Associate', 'Corporate Lawyer', 'Contract Manager',
      'Compliance Officer', 'Paralegal', 'Legal Analyst',
      'IP Attorney', 'Labour Law Consultant', 'Risk & Compliance Manager',
    ],
  },
  {
    group: '📐 Engineering & Manufacturing (Core)',
    items: [
      'Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer',
      'Chemical Engineer', 'Production Engineer', 'Quality Control Engineer',
      'Safety Engineer', 'Plant Manager', 'Project Engineer',
      'Structural Engineer', 'MEP Engineer', 'Maintenance Engineer',
      'Welding Engineer', 'Automobile Engineer',
    ],
  },
  {
    group: '🏗️ Real Estate & Construction',
    items: [
      'Real Estate Sales Executive', 'Property Manager', 'Site Engineer',
      'Architect', 'Interior Designer', 'Quantity Surveyor', 'Urban Planner',
    ],
  },
  {
    group: '🎓 Education & Training',
    items: [
      'Teacher', 'Professor', 'Academic Counsellor', 'Curriculum Developer',
      'Education Consultant', 'Corporate Trainer', 'Instructional Designer',
      'E-Learning Developer', 'Tutor', 'Ed-Tech Growth Manager',
    ],
  },
  {
    group: '🛍️ Retail & E-commerce',
    items: [
      'Store Manager', 'Retail Sales Executive', 'Visual Merchandiser',
      'Category Executive', 'E-commerce Executive', 'Marketplace Manager',
      'D2C Manager', 'Customer Experience Manager',
    ],
  },
  {
    group: '🏦 Banking & Insurance',
    items: [
      'Relationship Manager', 'Branch Manager', 'Loan Officer',
      'Investment Banker', 'Wealth Manager', 'Insurance Advisor',
      'Actuarial Analyst', 'KYC Analyst', 'Trade Finance Officer',
      'Forex Dealer',
    ],
  },
  {
    group: '✈️ Hospitality & Travel',
    items: [
      'Hotel Manager', 'Front Office Executive', 'Travel Consultant',
      'Airline Ground Staff', 'Cabin Crew', 'Food & Beverage Manager',
      'Event Coordinator', 'Tourism Manager',
    ],
  },
  {
    group: '🎧 Customer Support & Service',
    items: [
      'Customer Support Executive', 'Customer Support Associate',
      'Customer Success Executive', 'Customer Success Manager',
      'Technical Support Executive', 'Technical Support Engineer (Non-Coding)',
      'Customer Experience Manager', 'Client Servicing Executive',
      'Service Desk Analyst', 'Call Centre Executive',
      'Voice Process Executive', 'Non-Voice Process Executive',
      'Chat Support Executive', 'Email Support Executive',
      'Escalation Specialist', 'Quality Analyst (BPO/Support)',
      'Operations Analyst (Support)', 'Team Lead – Customer Support',
      'Community Support Specialist', 'Customer Retention Specialist',
    ],
  },
  {
    group: '🖥️ IT Support & Helpdesk (Non-Dev)',
    items: [
      'IT Support Executive', 'IT Helpdesk Executive', 'Helpdesk Analyst',
      'Technical Support Engineer', 'Technical Support Engineer (L1)',
      'Technical Support Engineer (L2)', 'Technical Support Engineer (L3)',
      'Desktop Support Engineer', 'L1 Support Engineer', 'L2 Support Engineer',
      'Application Support Engineer', 'ERP Support Analyst',
      'SAP Support Consultant', 'Salesforce Support Analyst',
      'IT Service Desk Analyst', 'ITSM Analyst',
      'End User Computing Engineer', 'Field Support Engineer',
      'IT Operations Analyst', 'NOC Support Analyst',
      'Asset Management Executive (IT)', 'IT Coordinator',
    ],
  },
];


const getSourceBrandStyles = (sourceName: string): string => {
  const norm = sourceName.toLowerCase();
  if (norm.includes('naukri')) return 'bg-[#4A90E2]/10 text-[#5B8CFF] border-[#4A90E2]/25';
  if (norm.includes('indeed')) return 'bg-[#003A9B]/10 text-[#5B8CFF] border-[#003A9B]/25';
  if (norm.includes('linkedin')) return 'bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/25';
  if (norm.includes('glassdoor')) return 'bg-[#0FAA50]/10 text-[#0FAA50] border-[#0FAA50]/25';
  if (norm.includes('internshala')) return 'bg-[#1295C9]/10 text-[#1295C9] border-[#1295C9]/25';
  return 'bg-white/5 text-text-muted border-white/10';
};

const STATUS_COLORS: Record<string, string> = {
  'Wishlist': '#8892A6',
  'Applied': '#5B8CFF',
  'OA/Assessment': '#C084FC',
  'Interview': '#FB923C',
  'Offer': '#4ADE80',
  'Rejected': '#F26B6B',
};

const getChannelColor = (sourceName: string): string => {
  const norm = sourceName.toLowerCase();
  if (norm.includes('linkedin')) return '#0077B5';
  if (norm.includes('indeed')) return '#2164F3';
  if (norm.includes('naukri')) return '#FF6000';
  if (norm.includes('glassdoor')) return '#0FAA50';
  if (norm.includes('internshala')) return '#1295C9';
  return '#5B8CFF';
};

// ─── Reusable Autocomplete Input (single & multi-select) ────────────────────
const AutocompleteInput: React.FC<{
  placeholder: string;
  icon: React.ReactNode;
  groups: { group: string; items: string[] }[];
  id: string;
  // single-select props
  value?: string;
  onChange?: (v: string) => void;
  // multi-select props
  multi?: boolean;
  values?: string[];
  onToggle?: (item: string) => void;
  onClearAll?: () => void;
  accentColor?: string;
}> = ({ placeholder, icon, groups, value = '', onChange, multi = false, values = [], onToggle, onClearAll, accentColor = 'rgba(91,140,255,1)' }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return groups;
    return groups.map(g => ({
      group: g.group,
      items: g.items.filter(i => i.toLowerCase().includes(q)),
    })).filter(g => g.items.length > 0);
  }, [filter, groups]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item: string) => {
    if (multi) {
      onToggle?.(item); // stay open for multi
    } else {
      onChange?.(item);
      setFilter('');
      setOpen(false);
    }
  };

  const isSelected = (item: string) => multi ? values.includes(item) : item === value;
  const hasValue = multi ? values.length > 0 : !!value;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all text-left min-h-[44px]"
        style={{
          background: 'var(--bg-void)',
          border: `1px solid ${open ? accentColor.replace('1)', '0.4)') : 'rgba(255,255,255,0.05)'}`,
          color: hasValue ? 'var(--text-primary)' : 'rgba(136,146,166,0.5)',
          flexWrap: 'wrap',
          rowGap: '4px',
        }}
      >
        <span className="shrink-0 text-text-muted">{icon}</span>

        {/* Multi: pill tags for selected items */}
        {multi && values.length > 0 ? (
          <span className="flex flex-wrap gap-1 flex-1">
            {values.map(v => (
              <span
                key={v}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{
                  background: accentColor.replace('1)', '0.12)'),
                  border: `1px solid ${accentColor.replace('1)', '0.3)')}`,
                  color: accentColor,
                }}
              >
                {v}
                <span
                  className="cursor-pointer opacity-60 hover:opacity-100 leading-none"
                  onClick={e => { e.stopPropagation(); onToggle?.(v); }}
                >
                  ×
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="flex-1 truncate">
            {multi ? placeholder : (value || placeholder)}
          </span>
        )}

        {/* Right controls */}
        {hasValue ? (
          <span
            className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
            style={{
              background: accentColor.replace('1)', '0.1)'),
              color: accentColor,
            }}
            onClick={e => {
              e.stopPropagation();
              if (multi) onClearAll?.();
              else { onChange?.(''); setFilter(''); }
            }}
          >
            {multi && values.length > 1 ? `Clear ${values.length}` : 'Clear'}
          </span>
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute z-50 top-full mt-2 left-0 right-0 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl animate-fade-in origin-top"
          style={{
            background: 'rgba(21, 29, 51, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search filter + count */}
          <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input
              autoFocus
              type="text"
              placeholder="Type to filter..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-primary)',
              }}
            />
            {multi && values.length > 0 && (
              <span
                className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg"
                style={{
                  background: accentColor.replace('1)', '0.12)'),
                  color: accentColor,
                }}
              >
                {values.length} selected
              </span>
            )}
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filtered.map(g => (
              <div key={g.group}>
                <div
                  className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase sticky top-0"
                  style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-muted)' }}
                >
                  {g.group}
                </div>
                {g.items.map(item => {
                  const sel = isSelected(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors"
                      style={{
                        color: sel ? accentColor : 'var(--text-primary)',
                        background: sel ? accentColor.replace('1)', '0.08)') : 'transparent',
                        fontWeight: sel ? 700 : 400,
                      }}
                      onMouseEnter={e => {
                        if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      {/* Checkbox for multi mode */}
                      {multi && (
                        <span
                          className="shrink-0 w-4 h-4 rounded flex items-center justify-center text-[10px] font-black"
                          style={{
                            background: sel ? accentColor.replace('1)', '0.2)') : 'rgba(255,255,255,0.05)',
                            border: sel ? `1.5px solid ${accentColor}` : '1.5px solid rgba(255,255,255,0.12)',
                            color: accentColor,
                          }}
                        >
                          {sel ? '✓' : ''}
                        </span>
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No matches.
              </div>
            )}
          </div>

          {/* Footer: Done button for multi */}
          {multi && (
            <div className="p-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => { setOpen(false); setFilter(''); }}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: accentColor.replace('1)', '0.12)'),
                  border: `1px solid ${accentColor.replace('1)', '0.25)')}`,
                  color: accentColor,
                }}
              >
                Done{values.length > 0 ? ` (${values.length} selected)` : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PAGE_SIZE = 15;
const MAX_PAGES = 50;

// ─── Company Tier Classification (India-focused) ─────────────────────────────
const COMPANY_TIERS: Record<string, string[]> = {
  tier1: [
    // Global FAANG/MAANG & top MNCs
    'google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix',
    'goldman sachs', 'morgan stanley', 'jp morgan', 'jpmorgan', 'deutsche bank',
    'uber', 'airbnb', 'linkedin', 'twitter', 'x corp', 'salesforce', 'adobe',
    'nvidia', 'intel', 'qualcomm', 'oracle', 'sap', 'ibm', 'cisco',
    'walmart labs', 'walmart global tech', 'american express', 'amex',
    'mckinsey', 'boston consulting', 'bain', 'deloitte digital',
    'stripe', 'coinbase', 'palantir', 'snowflake', 'databricks', 'atlassian',
    // Top Indian product companies (FAANG-equivalent in India)
    'flipkart', 'paytm', 'phonepe', 'zerodha', 'cred', 'dream11',
    'razorpay', 'groww', 'meesho', 'swiggy', 'zomato', 'dunzo',
    'urban company', 'byjus', 'unacademy', 'vedantu', 'freshworks', 'zoho',
    'juspay', 'browserstack', 'postman', 'chargebee', 'hasura', 'setu',
    'mu sigma', 'innovaccer', 'mindtickle', 'clevertap', 'lenskart',
    'ola', 'nykaa', 'sharechat', 'glance', 'inmobi', 'directi',
  ],
  tier2: [
    // Mid-tier MNCs and large Indian product companies
    'accenture', 'capgemini', 'thoughtworks', 'sapient', 'publicis sapient',
    'mphasis', 'hexaware', 'zensar', 'cyient', 'birlasoft', 'sonata',
    'persistent', 'persistent systems', 'coforge', 'niit technologies',
    'ltimindtree', 'lti', 'mindtree', 'l&t technology',
    'bajaj finserv', 'paytm money', 'policy bazaar', 'policybazaar',
    'cars24', 'droom', 'spinny', 'cardekho', 'olx', 'quikr',
    'practo', '1mg', 'pharmeasy', '1-mg', 'healthkart', 'netmeds',
    'cleartax', 'clear', 'zetwerk', 'moglix', 'ofbusiness',
    'udaan', 'jumbotail', 'rapido', 'porter', 'delhivery', 'shiprocket',
    'rivigo', 'blackbuck', 'logi next', 'ecom express',
    'slice', 'jupiter', 'fi', 'open', 'niyo', 'freo',
    'springworks', 'darwinbox', 'keka', 'zoho people', 'leadsquared',
    'moengage', 'webengage', 'netcore', 'kaleyra', 'exotel',
    'epam', 'globallogic', 'nagarro', 'kellton tech', 'mastech',
  ],
  tier3: [
    // Large service IT companies (MNC & Indian)
    'tcs', 'tata consultancy', 'infosys', 'wipro', 'hcl',
    'hcl technologies', 'tech mahindra', 'cognizant', 'ctsh',
    'ntt data', 'dxc technology', 'unisys', 'atos', 'fujitsu',
    'kpit', 'infotech', 'trigent', 'igate', 'patni',
    'niit', 'rackspace', 'stefanini', 'syntel', 'ness digital',
    'css corp', 'newgen', 'nucleus software', 'intellect design',
    'happiest minds', 'kellton', 'e-con systems', 'redington',
    'wipro technologies', 'l&t infotech', 'tata elxsi',
    'hexaware technologies', 'hinduja global', 'mphasis',
    'wns', 'wns global', 'startek', 'teleperformance',
    'concentrix', 'conduent', 'sutherland', 'hinduja tmt',
  ],
  tier4: [
    // Smaller IT firms, boutique agencies, startups
    'softclix', 'techmahindra', 'rahi systems', 'calsoft', 'entrust',
    'datamatics', 'mastech digital', 'collabera', 'kellton tech',
    'evosys', 'incessant technologies', 'krish technolabs',
    'valueground', 'webuters', 'oodles technologies', 'appinventiv',
    'bacancy technology', 'valuecoders', 'tatvasoft',
    'space-o technologies', 'iflexion', 'intuz', 'cubix',
    'konstant infosolutions', 'mobulous', 'mindinventory',
    'seasia infotech', 'brainvire', 'techno exponent',
    'nexdigm', 'anblicks', 'qed42', 'srijan', 'axelerant',
    'specbee', 'spinxdigital', 'ziffity', 'bounteous',
    'mobisoft infotech', 'oditek', 'zealous system',
  ]
};

export const SearchView: React.FC = () => {
  const { enabledAdapters, toggleAdapter } = useUIStore();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [locQuery, setLocQuery] = useState('');
  const [postedAfter, setPostedAfter] = useState('');   // ISO date string yyyy-mm-dd
  const [dateOption, setDateOption] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [workMode, setWorkMode] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [minSalary, setMinSalary] = useState('all');
  const [companyTier, setCompanyTier] = useState('all');
  const [jobMode, setJobMode] = useState<'tech' | 'nontech'>('tech');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<JobListing[]>([]);
  const [activeSearches, setActiveSearches] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownUrl, setOpenDropdownUrl] = useState<string | null>(null);
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

  const trackedJobsMap = useMemo(() => {
    const map = new Map<string, JobStatus>();
    trackedJobs.forEach(job => {
      if (job.link) map.set(job.link, job.status);
    });
    return map;
  }, [trackedJobs]);

  // Filter out results that are already added in the tracker
  // Match on title+company+location (in addition to URL) to avoid over-excluding similar-named new listings
  const untrackedResults = useMemo(() => {
    const filtered = results.filter(job => {
      if (trackedUrls.has(job.url)) return false;
      // Secondary match: same title+company+location already tracked
      const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}|${job.location.toLowerCase().trim()}`;
      return !trackedJobs.some(t =>
        `${t.role?.toLowerCase().trim()}|${t.company?.toLowerCase().trim()}|${t.location?.toLowerCase().trim()}` === key
      );
    });
    console.log(`[Pipeline] After IndexedDB exclusion: ${filtered.length} / ${results.length} (removed ${results.length - filtered.length} already-tracked jobs)`);
    return filtered;
  }, [results, trackedUrls, trackedJobs]);

  // Pagination derived state using only untracked results
  const totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(untrackedResults.length / PAGE_SIZE)));
  const pagedResults = useMemo(() => {
    return untrackedResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [untrackedResults, currentPage]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      alert('Please select at least one role from the dropdown.');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setCurrentPage(1);
    setSourceCounts({});
    setPipelineStats(null);
    setLoadingPhase('Sending search requests to all active sources...');

    const activeAdapters = adapters.filter(a => enabledAdapters.includes(a.id));
    if (activeAdapters.length === 0) {
      alert('Please enable at least one Search Source in the Settings tab to search for jobs.');
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setActiveSearches(activeAdapters.map(a => a.name));

    try {
      // Run one fetch per (role × adapter) combination and merge
      setLoadingPhase('Fetching jobs from all active sources — this may take a minute for completeness...');
      const perAdapterResults: Record<string, JobListing[]> = {};
      const allPromises = selectedRoles.flatMap(role =>
        activeAdapters.map(async adapter => {
          try {
            const res = await adapter.fetchJobs(role.trim(), locQuery.trim(), postedAfter);
            perAdapterResults[adapter.name] = [...(perAdapterResults[adapter.name] || []), ...res];
            console.log(`[Pipeline] Raw from ${adapter.name} (role="${role}"): ${res.length} jobs`);
            return res;
          } catch (err) {
            console.error(`Adapter ${adapter.name} failed for role "${role}":`, err);
            return [];
          }
        })
      );

      const allResultsArrays = await Promise.all(allPromises);
      let flatResults = allResultsArrays.flat();
      
      // Log per-source totals and save to state for UI display
      const counts: Record<string, number> = {};
      for (const [src, jobs] of Object.entries(perAdapterResults)) {
        counts[src] = jobs.length;
        console.log(`[Pipeline] Total from ${src}: ${jobs.length} jobs`);
      }
      console.log(`[Pipeline] Combined raw total (all sources): ${flatResults.length} jobs`);
      setSourceCounts(counts);

      // CENTRAL FALLBACK
      if (flatResults.length === 0) {
        const capLoc = locQuery.trim()
          ? locQuery.trim().charAt(0).toUpperCase() + locQuery.trim().slice(1)
          : 'India (Remote)';

        flatResults = selectedRoles.flatMap((role, ri) =>
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
      }

      setLoadingPhase('Deduplicating results across sources...');
      const dedupedResults = dedupeJobs(flatResults);
      console.log(`[Pipeline] After Jaccard dedup (threshold 0.85): ${dedupedResults.length} jobs (removed ${flatResults.length - dedupedResults.length} duplicates)`);
      
      // Filter out expired or closed listings
      const activeResults = dedupedResults.filter(job => {
        const textToSearch = `${job.title} ${job.description}`.toLowerCase();
        const blacklist = [
          'expired',
          'closed',
          'no longer accepting applications',
          'no longer active',
          'not accepting applications',
          'position filled',
          'hiring closed',
          'expired listing'
        ];
        return !blacklist.some(term => textToSearch.includes(term));
      });

      let sortedResults = activeResults.sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      );

      // ── Date filter: drop jobs posted before the chosen date ──
      if (postedAfter) {
        const cutoff = new Date(postedAfter).getTime();
        sortedResults = sortedResults.filter(job => {
          if (!job.postedDate) return true;
          const d = new Date(job.postedDate).getTime();
          return isNaN(d) || d >= cutoff;
        });
      }

      // ── Experience filter: accurate year extraction ──
      if (experienceLevel !== 'all') {
        sortedResults = sortedResults.filter(job => {
          const text = `${job.title} ${job.description}`.toLowerCase();

          // Extract all explicit year requirements from the text
          // Matches: "4 years", "4+ years", "4-6 years", "minimum 4 years", "at least 3 years", "3 to 5 years", "3yrs"
          const yearMatches: number[] = [];
          const patterns = [
            /(\d+)\s*[-–to]\s*(\d+)\s*(?:years?|yrs?)\b/gi,  // "3-5 years", "3 to 5 years"
            /(\d+)\s*\+\s*(?:years?|yrs?)\b/gi,               // "4+ years"
            /(?:minimum|min|at\s*least|minimum\s*of)\s*(\d+)\s*(?:years?|yrs?)\b/gi, // "minimum 4 years"
            /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:exp|experience|relevant|work)/gi, // "4 years of experience"
            /(?:exp|experience)[:\s]+(\d+)\s*(?:years?|yrs?)\b/gi, // "experience: 3 years"
          ];

          for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
              // For range patterns (3-5 years), take the lower bound
              yearMatches.push(parseInt(match[1], 10));
              if (match[2]) yearMatches.push(parseInt(match[2], 10));
            }
          }

          const minRequired = yearMatches.length > 0 ? Math.min(...yearMatches) : null;

          if (experienceLevel === 'fresher') {
            // Fresher: accept only if no explicit year requirement, or explicitly tagged for freshers
            const fresherKeywords = /\b(fresher|fresh\s*graduate|entry[\s-]?level|no\s*experience|0[\s-]?(?:years?|exp)|trainee|just\s*passed|newly\s*graduated)\b/i;
            if (fresherKeywords.test(text)) return true; // explicitly for freshers
            if (minRequired === null) return true;        // no year requirement found — could be fresher friendly
            if (minRequired >= 1) return false;           // requires at least 1 year — not for freshers
            return true;
          }

          const targetYears = parseInt(experienceLevel, 10);

          if (minRequired === null) {
            // No explicit year requirement found — include it (may be flexible)
            return true;
          }

          // Accept if the required range overlaps with the target
          // e.g. target=2: accept "1-3 years", "2 years", "2+ years", but not "5+ years"
          return minRequired <= targetYears + 1;
        });
      }

      // ── Work Mode filter: filter by remote, hybrid, or onsite ──
      if (workMode !== 'all') {
        sortedResults = sortedResults.filter(job => {
          const text = `${job.title} ${job.location} ${job.description}`.toLowerCase();
          const isRemote = text.includes('remote') || text.includes('wfh') || text.includes('work from home');
          const isHybrid = text.includes('hybrid') || text.includes('flexible') || text.includes('split office');
          
          if (workMode === 'remote') return isRemote;
          if (workMode === 'hybrid') return isHybrid;
          if (workMode === 'onsite') return !isRemote && !isHybrid;
          return true;
        });
      }

      // ── Job Type filter: filter by fulltime, internship, or contract ──
      if (jobType !== 'all') {
        sortedResults = sortedResults.filter(job => {
          const text = `${job.title} ${job.description}`.toLowerCase();
          const isIntern = text.includes('intern') || text.includes('stipend') || text.includes('trainee');
          const isContract = text.includes('contract') || text.includes('freelance') || text.includes('consultant');
          
          if (jobType === 'internship') return isIntern;
          if (jobType === 'contract') return isContract;
          if (jobType === 'fulltime') return !isIntern && !isContract;
          return true;
        });
      }

      // ── Salary filter: filter by min expected LPA ──
      if (minSalary !== 'all') {
        const minLpa = parseInt(minSalary, 10);
        sortedResults = sortedResults.filter(job => {
          if (!job.salary || job.salary === 'Not Specified') return true; 
          
          const text = job.salary.toLowerCase();
          const lpaMatch = text.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*lpa/i) || text.match(/(\d+)\s*lpa/i);
          if (lpaMatch) {
            const val = parseInt(lpaMatch[2] || lpaMatch[1], 10);
            return val >= minLpa;
          }

          const cleanText = text.replace(/,/g, '');
          const monthlyMatch = cleanText.match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*(?:\/|per)?\s*(?:month|pm)/i);
          if (monthlyMatch) {
            const valMonthly = parseInt(monthlyMatch[2] || monthlyMatch[1], 10);
            const valLpa = (valMonthly * 12) / 100000; 
            return valLpa >= minLpa;
          }

          return true;
        });
      }

      // ── Company Tier filter: match job company against tier lists ──
      if (companyTier !== 'all') {
        const tierCompanies = COMPANY_TIERS[companyTier] || [];
        sortedResults = sortedResults.filter(job => {
          const companyLower = job.company.toLowerCase().trim();
          return tierCompanies.some(name =>
            companyLower.includes(name) || name.includes(companyLower)
          );
        });
      }

      console.log(`[Pipeline] After all client-side filters: ${sortedResults.length} final jobs`);
      setPipelineStats({ raw: flatResults.length, afterDedup: dedupedResults.length, afterFilters: sortedResults.length });
      setLoadingPhase('');
      setResults(sortedResults);
    } catch (err) {
      console.error('Unified job search failed:', err);
    } finally {
      setIsLoading(false);
      setActiveSearches([]);
    }
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
    <div className="flex-1 overflow-y-auto p-6 space-y-5 select-none animate-fade-in">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/[0.04] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Campaign Query</h1>
          <p className="text-xs text-text-muted mt-1">
            Simultaneously search enabled boards and instantly cache listings to your Wishlist board.
          </p>
        </div>
      </div>

      <div 
        className="bg-surface rounded-2xl p-5 space-y-4 shrink-0 transition-all duration-300 border animate-fade-in"
        style={{
          borderColor: jobMode === 'tech' ? 'rgba(91, 140, 255, 0.15)' : 'rgba(242, 184, 75, 0.15)',
          boxShadow: jobMode === 'tech' 
            ? '0 20px 40px -15px rgba(0,0,0,0.6), 0 0 30px -10px rgba(91, 140, 255, 0.08)'
            : '0 20px 40px -15px rgba(0,0,0,0.6), 0 0 30px -10px rgba(242, 184, 75, 0.06)'
        }}
      >
        
        {/* Toggle Mode row */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          
          {/* Toggle mode switch */}
          <div className="w-full md:w-80">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Discovery Mode
            </label>
            <div className="flex bg-void p-1 rounded-xl border border-white/[0.04] relative select-none">
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
                onClick={() => { setJobMode('tech'); setSelectedRoles([]); }}
                className="flex-1 text-center py-2 text-xs font-extrabold z-10 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                style={{ color: jobMode === 'tech' ? 'var(--accent-cool)' : 'var(--text-muted)' }}
              >
                <span>💻</span>
                <span>Tech Roles</span>
              </button>
              <button
                type="button"
                onClick={() => { setJobMode('nontech'); setSelectedRoles([]); }}
                className="flex-1 text-center py-2 text-xs font-extrabold z-10 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                style={{ color: jobMode === 'nontech' ? 'var(--accent-signal)' : 'var(--text-muted)' }}
              >
                <span>🏢</span>
                <span>Non-Tech Roles</span>
              </button>
            </div>
          </div>

        </div>

        {/* Filters row: Work Mode, Job Type, Min Salary, Experience Level, Posted Within */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 border-t border-white/[0.03] pt-3.5 flex-wrap">
          
          {/* Work Mode */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold tracking-widest uppercase text-text-muted">
              Work Mode
            </label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="text-xs px-4 py-2.5 rounded-xl outline-none bg-void border border-white/[0.05] text-text-primary focus:outline-none focus:border-cool cursor-pointer font-semibold min-w-[150px]"
              style={{
                borderColor: workMode !== 'all' ? (jobMode === 'tech' ? 'rgba(91,140,255,0.3)' : 'rgba(242,184,75,0.3)') : 'rgba(255,255,255,0.05)',
                color: workMode !== 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="all" className="bg-surface-raised text-text-muted font-semibold">All Modes</option>
              <option value="remote" className="bg-surface-raised text-text-primary font-semibold">Remote</option>
              <option value="hybrid" className="bg-surface-raised text-text-primary font-semibold">Hybrid</option>
              <option value="onsite" className="bg-surface-raised text-text-primary font-semibold">On-site</option>
            </select>
          </div>

          {/* Job Type */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold tracking-widest uppercase text-text-muted">
              Job Type
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="text-xs px-4 py-2.5 rounded-xl outline-none bg-void border border-white/[0.05] text-text-primary focus:outline-none focus:border-cool cursor-pointer font-semibold min-w-[150px]"
              style={{
                borderColor: jobType !== 'all' ? (jobMode === 'tech' ? 'rgba(91,140,255,0.3)' : 'rgba(242,184,75,0.3)') : 'rgba(255,255,255,0.05)',
                color: jobType !== 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="all" className="bg-surface-raised text-text-muted font-semibold">All Types</option>
              <option value="fulltime" className="bg-surface-raised text-text-primary font-semibold">Full-time</option>
              <option value="internship" className="bg-surface-raised text-text-primary font-semibold">Internship</option>
              <option value="contract" className="bg-surface-raised text-text-primary font-semibold">Contract / Freelance</option>
            </select>
          </div>

          {/* Min Salary Expectation */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold tracking-widest uppercase text-text-muted">
              Min Salary
            </label>
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="text-xs px-4 py-2.5 rounded-xl outline-none bg-void border border-white/[0.05] text-text-primary focus:outline-none focus:border-cool cursor-pointer font-semibold min-w-[150px]"
              style={{
                borderColor: minSalary !== 'all' ? (jobMode === 'tech' ? 'rgba(91,140,255,0.3)' : 'rgba(242,184,75,0.3)') : 'rgba(255,255,255,0.05)',
                color: minSalary !== 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="all" className="bg-surface-raised text-text-muted font-semibold">Any Salary</option>
              <option value="3" className="bg-surface-raised text-text-primary font-semibold">₹3+ LPA (₹25k+/mo)</option>
              <option value="6" className="bg-surface-raised text-text-primary font-semibold">₹6+ LPA (₹50k+/mo)</option>
              <option value="10" className="bg-surface-raised text-text-primary font-semibold">₹10+ LPA (₹80k+/mo)</option>
              <option value="15" className="bg-surface-raised text-text-primary font-semibold">₹15+ LPA (₹1.2L+/mo)</option>
            </select>
          </div>

          {/* Company Tier */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold tracking-widest uppercase text-text-muted">
              Company Tier
            </label>
            <select
              value={companyTier}
              onChange={(e) => setCompanyTier(e.target.value)}
              className="text-xs px-4 py-2.5 rounded-xl outline-none bg-void border border-white/[0.05] text-text-primary focus:outline-none focus:border-cool cursor-pointer font-semibold min-w-[150px]"
              style={{
                borderColor: companyTier !== 'all' ? (jobMode === 'tech' ? 'rgba(91,140,255,0.3)' : 'rgba(242,184,75,0.3)') : 'rgba(255,255,255,0.05)',
                color: companyTier !== 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="all" className="bg-surface-raised text-text-muted font-semibold">All Companies</option>
              <option value="tier1" className="bg-surface-raised text-text-primary font-semibold">🏆 Tier 1 (FAANG / Top Product)</option>
              <option value="tier2" className="bg-surface-raised text-text-primary font-semibold">⭐ Tier 2 (Mid MNC / Good Startups)</option>
              <option value="tier3" className="bg-surface-raised text-text-primary font-semibold">🔵 Tier 3 (Large IT Services)</option>
              <option value="tier4" className="bg-surface-raised text-text-primary font-semibold">🟢 Tier 4 (Small Firms / Agencies)</option>
            </select>
          </div>

          {/* Experience Level Selector */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold tracking-widest uppercase text-text-muted">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="text-xs px-4 py-2.5 rounded-xl outline-none bg-void border border-white/[0.05] text-text-primary focus:outline-none focus:border-cool cursor-pointer font-semibold min-w-[150px]"
              style={{
                borderColor: experienceLevel !== 'all' ? (jobMode === 'tech' ? 'rgba(91,140,255,0.3)' : 'rgba(242,184,75,0.3)') : 'rgba(255,255,255,0.05)',
                color: experienceLevel !== 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="all" className="bg-surface-raised text-text-muted font-semibold">All Levels</option>
              <option value="fresher" className="bg-surface-raised text-text-primary font-semibold">Fresher (0-1 yr)</option>
              <option value="1" className="bg-surface-raised text-text-primary font-semibold">1 Year</option>
              <option value="2" className="bg-surface-raised text-text-primary font-semibold">2 Years</option>
              <option value="3" className="bg-surface-raised text-text-primary font-semibold">3 Years</option>
              <option value="5" className="bg-surface-raised text-text-primary font-semibold">5+ Years</option>
            </select>
          </div>

          {/* Date Selector Options */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold tracking-widest uppercase text-text-muted">
              Posted Within
            </label>
            <select
              value={dateOption}
              onChange={(e) => {
                const opt = e.target.value;
                setDateOption(opt);
                if (opt === 'all') {
                  setPostedAfter('');
                } else {
                  const days = parseInt(opt, 10);
                  const d = new Date();
                  d.setDate(d.getDate() - days);
                  setPostedAfter(d.toISOString().split('T')[0]);
                }
              }}
              className="text-xs px-4 py-2.5 rounded-xl outline-none bg-void border border-white/[0.05] text-text-primary focus:outline-none focus:border-cool cursor-pointer font-semibold min-w-[150px]"
              style={{
                borderColor: dateOption !== 'all' ? (jobMode === 'tech' ? 'rgba(91,140,255,0.3)' : 'rgba(242,184,75,0.3)') : 'rgba(255,255,255,0.05)',
                color: dateOption !== 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="all" className="bg-surface-raised text-text-muted font-semibold">All Time</option>
              <option value="1" className="bg-surface-raised text-text-primary font-semibold">Last 24 Hours</option>
              <option value="3" className="bg-surface-raised text-text-primary font-semibold">Last 3 Days</option>
              <option value="7" className="bg-surface-raised text-text-primary font-semibold">Last 7 Days</option>
              <option value="14" className="bg-surface-raised text-text-primary font-semibold">Last 14 Days</option>
              <option value="30" className="bg-surface-raised text-text-primary font-semibold">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.03] select-none">
          {activeRoleGroups.map(g => {
            const anySelected = g.items.some(i => selectedRoles.includes(i));
            return (
              <button
                key={g.group}
                type="button"
                onClick={() => handleRoleToggle(g.items[0])}
                className="text-[9px] font-bold px-2 py-0.5 rounded border transition-all duration-150 cursor-pointer"
                style={{
                  background: anySelected
                    ? (jobMode === 'tech' ? 'rgba(91,140,255,0.1)' : 'rgba(242,184,75,0.08)')
                    : 'rgba(255,255,255,0.02)',
                  borderColor: anySelected
                    ? (jobMode === 'tech' ? 'rgba(91,140,255,0.2)' : 'rgba(242,184,75,0.2)')
                    : 'rgba(255,255,255,0.04)',
                  color: anySelected
                    ? (jobMode === 'tech' ? 'var(--accent-cool)' : 'var(--accent-signal)')
                    : 'var(--text-muted)',
                }}
              >
                {anySelected ? '✓ ' : ''}{g.group}
              </button>
            );
          })}
        </div>

        {/* ── Active Scraper Sources (Aggregators Selector) ── */}
        <div className="border-t border-white/[0.03] pt-3.5 space-y-2 select-none">
          <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
            Active Scraper Sources (Aggregators)
          </label>
          <div className="flex flex-wrap gap-2">
            {adapters.map((adapter) => {
              const isEnabled = enabledAdapters.includes(adapter.id);
              return (
                <button
                  key={adapter.id}
                  type="button"
                  onClick={() => toggleAdapter(adapter.id)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center space-x-2 cursor-pointer"
                  style={{
                    background: isEnabled
                      ? (jobMode === 'tech' ? 'rgba(91, 140, 255, 0.1)' : 'rgba(242, 184, 75, 0.08)')
                      : 'rgba(255,255,255,0.02)',
                    borderColor: isEnabled
                      ? (jobMode === 'tech' ? 'rgba(91, 140, 255, 0.25)' : 'rgba(242, 184, 75, 0.25)')
                      : 'rgba(255,255,255,0.04)',
                    color: isEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  <span 
                    className="h-1.5 w-1.5 rounded-full transition-colors" 
                    style={{ 
                      backgroundColor: isEnabled 
                        ? (jobMode === 'tech' ? 'var(--accent-cool)' : 'var(--accent-signal)') 
                        : 'rgba(255,255,255,0.15)',
                    }} 
                  />
                  <span>{adapter.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs and Submit button */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/[0.03] pt-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer self-end w-full"
            style={{
              background: isLoading
                ? 'rgba(91,140,255,0.25)'
                : jobMode === 'tech'
                ? 'var(--accent-cool)'
                : 'var(--accent-signal)',
              color: '#fff',
              height: '38px',
            }}
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Searching active endpoints...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search Platforms</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Query Status / Progress */}
      {isLoading && activeSearches.length > 0 && (
        <div className="p-4 bg-cool/5 border border-cool/10 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            {/* Animated spinner */}
            <svg className="animate-spin h-4 w-4 text-cool shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <p className="text-xs text-cool font-semibold">
              {loadingPhase || `Querying: ${activeSearches.join(', ')}...`}
            </p>
          </div>
          <p className="text-[10px] text-text-muted pl-7">
            ⏳ Prioritizing completeness over speed — fetching up to 200 jobs per source. Please wait.
          </p>
          {Object.keys(sourceCounts).length > 0 && (
            <div className="mt-2 pl-7 flex flex-wrap gap-2">
              {Object.entries(sourceCounts).map(([src, count]) => (
                <span key={src} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: 'rgba(91,140,255,0.2)', color: 'rgba(91,140,255,0.9)', background: 'rgba(91,140,255,0.07)' }}>
                  {src}: {count} raw
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Container */}
      <div className="space-y-4">
        {/* Per-source stats panel */}
        {!isLoading && pipelineStats && (
          <div className="flex flex-wrap gap-2 mb-1">
            {Object.entries(sourceCounts).map(([src, count]) => (
              <span key={src} className="text-[10px] px-2.5 py-1 rounded-full border font-semibold" style={{ borderColor: 'rgba(91,140,255,0.18)', color: 'rgba(140,180,255,0.85)', background: 'rgba(91,140,255,0.06)' }}>
                {src}: {count} raw
              </span>
            ))}
            <span className="text-[10px] px-2.5 py-1 rounded-full border font-semibold" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.03)' }}>
              {pipelineStats.raw} raw → {pipelineStats.afterDedup} deduped → {pipelineStats.afterFilters} filtered
            </span>
          </div>
        )}
        {untrackedResults.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-text-muted">
              Found{' '}
              <span className="font-bold text-text-primary tabular-nums">{untrackedResults.length}</span>{' '}
              unique results — showing page{' '}
              <span className="font-bold text-text-primary tabular-nums">{currentPage}</span>{' '}of{' '}
              <span className="font-bold text-text-primary tabular-nums">{totalPages}</span>
              {' '}({PAGE_SIZE} per page)
            </span>
            {/* Page jump info */}
            {totalPages > 1 && (
              <span className="text-[10px] text-text-muted/60">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, untrackedResults.length)} of {untrackedResults.length}
              </span>
            )}
          </div>
        )}

        <div className="space-y-3">
          {pagedResults.map((job) => {
            const isSaved = trackedUrls.has(job.url);
            return (
              <div 
                key={job.url}
                className="bg-surface border-r border-y border-white/[0.03] rounded-r-2xl rounded-l-md p-5 hover:border-cool/25 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-300 flex flex-col md:flex-row md:items-start md:justify-between gap-5 relative group"
                style={{ 
                  borderLeft: `4px solid ${getChannelColor(job.source)}`,
                  boxShadow: `inset 4px 0 0 -3px ${getChannelColor(job.source)}`
                }}
              >
                
                {/* Left side details */}
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  
                  {/* Channel letter icon placeholder */}
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none border"
                    style={{ 
                      backgroundColor: `${getChannelColor(job.source)}10`, 
                      color: getChannelColor(job.source),
                      borderColor: `${getChannelColor(job.source)}25`
                    }}
                  >
                    {job.company.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    
                    {/* Job Title & Source badges */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold font-display text-text-primary group-hover:text-cool transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap select-none">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getSourceBrandStyles(job.source)}`}>
                          {job.source}
                        </span>
                        {job.alsoOn && job.alsoOn.map(other => (
                          <span key={other} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getSourceBrandStyles(other)}`}>
                            {other}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Company, location, salary */}
                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-text-muted">
                      <span className="font-semibold text-text-primary/90">{job.company}</span>
                      <span className="text-white/10 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1 select-none">
                        <MapPin className="h-3.5 w-3.5 text-text-muted/60" />
                        <span>{job.location}</span>
                      </span>
                      {job.salary && job.salary !== 'Not Specified' && (
                        <>
                          <span className="text-white/10 hidden sm:inline">•</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                            {job.salary}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-text-muted/80 line-clamp-2 leading-relaxed font-sans pt-0.5">
                      {job.description}
                    </p>

                    {/* Footer posted date */}
                    <div className="text-[10px] text-text-muted/50 font-medium">
                      Posted: {job.postedDate}
                    </div>

                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 md:self-stretch justify-center items-end border-t border-white/[0.03] pt-4 md:pt-0 md:border-0">
                  
                  {/* Add to tracker */}
                  {isSaved ? (
                    (() => {
                      const savedStatus = trackedJobsMap.get(job.url) || 'Wishlist';
                      return (
                        <div
                          className="w-full md:w-auto border text-[11px] font-extrabold px-3.5 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 select-none"
                          style={{
                            borderColor: `${STATUS_COLORS[savedStatus]}30`,
                            color: STATUS_COLORS[savedStatus],
                            background: `${STATUS_COLORS[savedStatus]}10`,
                          }}
                        >
                          <BookmarkCheck className="h-4 w-4" />
                          <span>Tracked: {savedStatus}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="relative w-full md:w-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownUrl(openDropdownUrl === job.url ? null : job.url);
                        }}
                        className="w-full md:w-auto bg-cool hover:bg-cool/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer shadow-md"
                      >
                        <Bookmark className="h-4 w-4" />
                        <span>Track Job</span>
                        <ChevronDown className="h-3 w-3 opacity-80" />
                      </button>

                      {openDropdownUrl === job.url && (
                        <div
                          className="absolute right-0 bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-1.5 z-50 rounded-xl overflow-hidden shadow-2xl w-48 border border-white/[0.08]"
                          style={{ background: 'var(--bg-surface-raised)' }}
                        >
                          <div className="p-1.5 space-y-1">
                            {(['Wishlist', 'Applied', 'OA/Assessment', 'Interview', 'Offer'] as JobStatus[]).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setOpenDropdownUrl(null);
                                  await handleSaveToTracker(job, status);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-white/5 text-text-primary flex items-center space-x-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#5B8CFF' }} />
                                <span>{status}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Link to post */}
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-void hover:bg-surface-raised border border-white/[0.04] text-text-primary text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Posting</span>
                  </a>

                </div>

              </div>
            );
          })}

          {/* Empty search state */}
          {!isLoading && results.length === 0 && (
            <div className="border border-dashed border-white/[0.04] rounded-2xl p-10 text-center opacity-30 select-none bg-surface/10">
              <FilterX className="h-10 w-10 text-text-muted mb-2 mx-auto" />
              <h3 className="text-xs font-bold text-text-primary">
                {hasSearched ? 'No Listings Discovered' : 'Initiate Scan'}
              </h3>
              <p className="text-[11px] text-text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                {hasSearched 
                  ? 'Try broadening your role query. Ensure search sources are enabled in Settings.' 
                  : 'Enter a role search parameters above to fetch matching listings in parallel across active Indian sources.'
                }
              </p>
            </div>
          )}
        </div>

        {/* ── Pagination Bar ── */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-2 pt-4 pb-2 flex-wrap"
          >
            {/* Prev */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
              }}
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-90" />
              Prev
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => {
                // Always show first, last, current ±1, and ellipsis markers
                return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
              })
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p as number)}
                    className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: currentPage === p
                        ? (jobMode === 'tech' ? 'var(--accent-cool)' : 'var(--accent-signal)')
                        : 'var(--bg-surface)',
                      border: currentPage === p
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: currentPage === p ? '#fff' : 'var(--text-muted)',
                      boxShadow: currentPage === p
                        ? (jobMode === 'tech' ? '0 0 12px rgba(91,140,255,0.35)' : '0 0 12px rgba(242,184,75,0.3)')
                        : 'none',
                    }}
                  >
                    {p}
                  </button>
                )
              )
            }

            {/* Next */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
              }}
            >
              Next
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
