import React from 'react';
import { db, type JobApplication } from '../db/schema';
import { useUIStore, type AppTheme } from '../store/useUIStore';
import { adapters } from '../adapters';
import { ConfirmModal } from './ConfirmModal';
import { 
  Clock, 
  Database, 
  Sliders, 
  Trash2, 
  Check, 
  RefreshCw,
  Info,
  Activity,
  Globe,
  Sun,
  Moon,
  Monitor,
  Palette
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    defaultReminderDays, 
    setDefaultReminderDays, 
    enabledAdapters, 
    toggleAdapter,
    theme,
    setTheme
  } = useUIStore();

  const [activeSubTab, setActiveSubTab] = React.useState<'scrapers' | 'preferences' | 'database'>('scrapers');
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [dbSuccessMessage, setDbSuccessMessage] = React.useState<string | null>(null);
  
  const [apifyToken, setApifyToken] = React.useState(
    localStorage.getItem('karmtrack_apify_token') || ''
  );
  const [tokenSaveSuccess, setTokenSaveSuccess] = React.useState(false);

  const [jobspyStatus, setJobspyStatus] = React.useState<'checking' | 'running' | 'offline'>('checking');
  const [linkedinStatus, setLinkedinStatus] = React.useState<'checking' | 'running' | 'offline'>('checking');

  React.useEffect(() => {
    const pythonUrl = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    const linkedinUrl = (import.meta.env.VITE_LINKEDIN_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://127.0.0.1:8001';

    fetch(`${pythonUrl}/health`)
      .then(res => res.ok ? setJobspyStatus('running') : setJobspyStatus('offline'))
      .catch(() => setJobspyStatus('offline'));

    fetch(`${linkedinUrl}/health`)
      .then(res => res.ok ? setLinkedinStatus('running') : setLinkedinStatus('offline'))
      .catch(() => setLinkedinStatus('offline'));
  }, []);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setApifyToken(val);
    localStorage.setItem('karmtrack_apify_token', val);
    setTokenSaveSuccess(true);
    setTimeout(() => setTokenSaveSuccess(false), 2000);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10);
    if (!isNaN(days) && days > 0) {
      setDefaultReminderDays(days);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const [confirmConfig, setConfirmConfig] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
    variant: 'danger',
  });

  const handleClearDB = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear Entire Database?',
      message: 'WARNING: This will permanently delete all your job applications and history logs! Are you sure?',
      variant: 'danger',
      action: async () => {
        await db.jobs.clear();
        setDbSuccessMessage('Database cleared successfully!');
        setTimeout(() => setDbSuccessMessage(null), 3000);
      },
    });
  };

  const handleSeedMockData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Load Mock Application Entries?',
      message: 'This will replace current entries with 7 realistic Indian job application entries in your tracker. Proceed?',
      variant: 'info',
      action: async () => {
        await db.jobs.clear();
        
        const today = new Date();
        const formatOffsetDate = (daysOffset: number) => {
          const d = new Date(today.getTime() - daysOffset * 24 * 60 * 60 * 1000);
          return d.toISOString().split('T')[0];
        };

        const mockApplications: JobApplication[] = [
          {
            company: 'Zepto',
            role: 'React JS Developer',
            location: 'Bengaluru, Karnataka',
            salary: '₹12,00,000 - ₹18,00,000 / year',
            sourceSite: 'Instahyre',
            dateApplied: formatOffsetDate(18),
            lastStatusChange: formatOffsetDate(5),
            status: 'Interview',
            statusHistory: [
              { status: 'Wishlist', date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Applied', date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'OA/Assessment', date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Interview', date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://www.instahyre.com/job-zepto-react-dev-mock-1',
            notes: 'Zepto interview. Round 1 technical is done. Focused on Javascript event loop, React architecture, hooks optimization.',
            tags: ['high priority', 'product-based'],
            contactName: 'Ananya Sharma',
            contactEmail: 'ananya@zepto.co',
          },
          {
            company: 'Groww',
            role: 'Frontend Engineer - Web',
            location: 'Bengaluru, Karnataka',
            salary: '₹14,00,000 - ₹20,00,000 / year',
            sourceSite: 'Instahyre',
            dateApplied: formatOffsetDate(20),
            lastStatusChange: formatOffsetDate(2),
            status: 'Offer',
            statusHistory: [
              { status: 'Applied', date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Interview', date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Offer', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://www.instahyre.com/job-groww-frontend-mock-2',
            notes: 'Got the offer! HR shared details: 16 LPA fixed + equity. Super happy!',
            tags: ['high priority', 'product-based', 'referral'],
          },
          {
            company: 'Tata Consultancy Services (TCS)',
            role: 'React Frontend Developer',
            location: 'Bengaluru, Karnataka',
            salary: '₹6,00,000 - ₹9,50,000 a year',
            sourceSite: 'Indeed India',
            dateApplied: formatOffsetDate(16),
            lastStatusChange: formatOffsetDate(16),
            status: 'Applied',
            statusHistory: [
              { status: 'Applied', date: new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://in.indeed.com/viewjob?jk=indeed_mock_1',
            notes: 'Cold apply. Need to find a referral on LinkedIn to speed up review.',
            tags: ['cold apply', 'service-based'],
          },
          {
            company: 'HCL Technologies',
            role: 'Software Engineer - Frontend (React/TypeScript)',
            location: 'Noida, Uttar Pradesh',
            salary: '6 - 10 LPA',
            sourceSite: 'Naukri.com',
            dateApplied: formatOffsetDate(8),
            lastStatusChange: formatOffsetDate(3),
            status: 'OA/Assessment',
            statusHistory: [
              { status: 'Applied', date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'OA/Assessment', date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://www.naukri.com/job-listings-frontend-hcl-mock-2',
            notes: 'OA test link received. HackerRank format.',
            tags: ['service-based'],
          },
          {
            company: 'Wipro Limited',
            role: 'React.js Developer - HTML/CSS/Javascript',
            location: 'Bengaluru, Karnataka',
            salary: '7 - 12 LPA',
            sourceSite: 'Naukri.com',
            dateApplied: formatOffsetDate(2),
            lastStatusChange: formatOffsetDate(2),
            status: 'Wishlist',
            statusHistory: [
              { status: 'Wishlist', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://www.naukri.com/job-listings-react-js-developer-wipro-mock-1',
            notes: 'Preparing custom resume highlighting React and Tailwind projects.',
            tags: ['cold apply'],
          },
          {
            company: 'Adobe',
            role: 'Software Developer (Frontend)',
            location: 'Noida, Uttar Pradesh',
            salary: '₹14,00,000 - ₹22,00,000 a year',
            sourceSite: 'Glassdoor',
            dateApplied: formatOffsetDate(22),
            lastStatusChange: formatOffsetDate(6),
            status: 'Rejected',
            statusHistory: [
              { status: 'Applied', date: new Date(today.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Interview', date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Rejected', date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://www.glassdoor.co.in/job-listing/adobe-frontend-mock-2',
            notes: 'Rejected after hiring manager round. Practice more system design.',
            tags: ['product-based'],
          },
          {
            company: 'SwiftTech Solutions',
            role: 'Junior Frontend Developer (React)',
            location: 'Mumbai, Maharashtra',
            salary: '₹25,000 - ₹35,000 / month',
            sourceSite: 'Apna',
            dateApplied: formatOffsetDate(10),
            lastStatusChange: formatOffsetDate(4),
            status: 'Withdrawn',
            statusHistory: [
              { status: 'Applied', date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'Withdrawn', date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            link: 'https://apna.co/job/swifttech-junior-frontend-mock-1',
            notes: 'Withdrew application since salary was below expectations.',
            tags: ['cold apply'],
          }
        ];

        for (const job of mockApplications) {
          await db.jobs.add(job);
        }
        setDbSuccessMessage('Successfully seeded mock data!');
        setTimeout(() => setDbSuccessMessage(null), 4000);
      },
    });
  };

  return (
    <>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-title-group">
            <span
              className="page-eyebrow"
              style={{ background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(100,116,139,0.2)' }}
            >
              <Sliders size={11} />
              Configuration
            </span>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure scrapers, preferences, and local database operations.</p>
          </div>
        </div>
      </div>

      {/* ── Settings Content Area (Non-scrolling Page Layout) ── */}
      <div className="page-content" style={{ overflow: 'hidden' }}>

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1 min-h-0 h-full overflow-hidden">
        
        {/* Left tabs selector */}
        <div className="w-full md:w-64 fluent-card rounded-2xl p-2 shrink-0 space-y-1">
          <button
            onClick={() => setActiveSubTab('scrapers')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer"
            style={{
              background: activeSubTab === 'scrapers' ? 'var(--bg-surface-raised)' : 'transparent',
              color: activeSubTab === 'scrapers' ? 'var(--accent-cool)' : 'var(--text-muted)',
              borderLeft: activeSubTab === 'scrapers' ? '3px solid var(--accent-cool)' : '3px solid transparent',
            }}
          >
            <Globe className="h-4 w-4" />
            <span>Scrapers & Channels</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('preferences')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer"
            style={{
              background: activeSubTab === 'preferences' ? 'var(--bg-surface-raised)' : 'transparent',
              color: activeSubTab === 'preferences' ? 'var(--accent-cool)' : 'var(--text-muted)',
              borderLeft: activeSubTab === 'preferences' ? '3px solid var(--accent-cool)' : '3px solid transparent',
            }}
          >
            <Clock className="h-4 w-4" />
            <span>Theme & Preferences</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('database')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer"
            style={{
              background: activeSubTab === 'database' ? 'var(--bg-surface-raised)' : 'transparent',
              color: activeSubTab === 'database' ? 'var(--accent-cool)' : 'var(--text-muted)',
              borderLeft: activeSubTab === 'database' ? '3px solid var(--accent-cool)' : '3px solid transparent',
            }}
          >
            <Database className="h-4 w-4" />
            <span>Database Operations</span>
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 w-full fluent-card rounded-2xl p-6 min-h-0 h-full overflow-y-auto">
          
          {/* TAB 1: SCRAPERS */}
          {activeSubTab === 'scrapers' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-cool" />
                  <span>Local Scraper Services</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Real-time status of your scraping backends running on your machine.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3 shadow-xs" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Naukri & Indeed Engine</span>
                    <span className="font-mono text-[9px] text-text-muted">SRV-01</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${jobspyStatus === 'running' ? 'bg-success animate-pulse' : jobspyStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-danger'}`} />
                    <span className="text-xs font-bold capitalize text-text-primary">{jobspyStatus === 'running' ? 'Active' : jobspyStatus === 'checking' ? 'Checking...' : 'Offline'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-text-muted font-mono pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span>Port 8000</span>
                    <span>FastAPI + JobSpy</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3 shadow-xs" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">LinkedIn & Internshala Engine</span>
                    <span className="font-mono text-[9px] text-text-muted">SRV-02</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${linkedinStatus === 'running' ? 'bg-success animate-pulse' : linkedinStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-danger'}`} />
                    <span className="text-xs font-bold capitalize text-text-primary">{linkedinStatus === 'running' ? 'Active' : linkedinStatus === 'checking' ? 'Checking...' : 'Offline'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-text-muted font-mono pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span>Port 8001</span>
                    <span>Express + Puppeteer</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5 space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                    <Sliders className="h-4 w-4 text-cool" />
                    <span>Search Platforms (Adapters)</span>
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Toggle active platforms scanned during search operations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adapters.map((adapter) => {
                    const isEnabled = enabledAdapters.includes(adapter.id);
                    return (
                      <div 
                        key={adapter.id}
                        onClick={() => toggleAdapter(adapter.id)}
                        className="p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 select-none"
                        style={{
                          background: isEnabled ? 'var(--bg-surface-raised)' : 'transparent',
                          borderColor: isEnabled ? 'var(--accent-cool)' : 'var(--border-subtle)',
                        }}
                      >
                        <span className="text-xs font-bold text-text-primary">{adapter.name}</span>
                        <div className="w-9 h-5 rounded-full relative shrink-0 transition-colors duration-300 ease-in-out cursor-pointer" style={{ background: isEnabled ? 'var(--accent-cool)' : 'var(--border-highlight)' }}>
                          <span 
                            className="absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-xs"
                            style={{
                              transform: isEnabled ? 'translateX(20px)' : 'translateX(4px)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-5 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <label className="text-xs font-bold text-text-primary flex items-center space-x-2">
                  <span>LinkedIn Session Cookie (LI_AT)</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="password"
                    placeholder="Enter li_at cookie string..."
                    value={apifyToken}
                    onChange={handleTokenChange}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border-subtle)' }}
                  />
                  {tokenSaveSuccess && (
                    <span className="text-xs text-success flex items-center space-x-1 shrink-0">
                      <Check className="h-4 w-4" />
                      <span>Saved</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Cookie is stored locally in your browser. Used to authenticate Puppeteer requests if LinkedIn triggers bot-detection blocks.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PREFERENCES & THEME */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              {/* Theme Settings */}
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-cool" />
                  <span>Appearance & Theme</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Select your preferred background theme style (Google, Apple & Microsoft design blend).</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light Theme', icon: Sun, desc: 'Clean porcelain canvas' },
                  { id: 'dark', label: 'Dark Theme', icon: Moon, desc: 'Deep obsidian slate' },
                  { id: 'system', label: 'System Theme', icon: Monitor, desc: 'Sync with device' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTheme(item.id as AppTheme)}
                      className="p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all duration-200"
                      style={{
                        background: isSelected ? 'var(--bg-surface-raised)' : 'transparent',
                        borderColor: isSelected ? 'var(--accent-cool)' : 'var(--border-subtle)',
                        boxShadow: isSelected ? '0 4px 14px rgba(59, 130, 246, 0.15)' : 'none',
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: isSelected ? 'var(--accent-cool)' : 'var(--text-muted)' }} />
                      <span className="text-xs font-bold text-text-primary">{item.label}</span>
                      <span className="text-[9px] text-text-muted">{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Follow up reminder days */}
              <div className="border-t pt-5 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-cool" />
                    <span>Stale Follow-Up Days</span>
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Determine how long an application sits inactive before flagging it for follow-up.</p>
                </div>

                <div className="space-y-3 p-4 rounded-xl border" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                  <label className="text-[10px] font-bold text-text-muted block uppercase tracking-wider">
                    Stale Limit (Days):
                  </label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="number"
                      min="1"
                      value={defaultReminderDays}
                      onChange={handleDaysChange}
                      className="w-24 border rounded-xl px-4 py-2 text-xs text-text-primary font-bold focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border-subtle)' }}
                    />
                    {saveSuccess && (
                      <span className="text-xs text-success flex items-center space-x-1 animate-fade-in">
                        <Check className="h-4 w-4" />
                        <span>Changes saved</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted">
                    Inactive tracker entries older than this value will show a "Follow Up Required" notice.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE */}
          {activeSubTab === 'database' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Database className="h-4 w-4 text-cool" />
                  <span>Local Database Management</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Manage the client-side IndexedDB database. All data is saved locally on your machine.</p>
              </div>

              {dbSuccessMessage && (
                <div className="p-3 border text-cool text-xs rounded-xl flex items-center space-x-2" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <Info className="h-4 w-4" />
                  <span>{dbSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-4 p-4 rounded-xl border" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSeedMockData}
                    className="text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                    style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Seed Mock Pipeline</span>
                  </button>

                  <button
                    onClick={handleClearDB}
                    className="border hover:bg-danger/10 text-danger font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                    style={{ background: 'var(--bg-surface)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Reset Database</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Seeding mock data loads 7 sample Indian applications (Tata, Wipro, Groww, Zepto, Adobe) for demonstration. Resetting database deletes everything permanently.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
      </div>{/* end page-content */}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText="Proceed"
        cancelText="Cancel"
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
