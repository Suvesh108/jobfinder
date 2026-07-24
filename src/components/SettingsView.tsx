import React from 'react';
import { db, type JobApplication } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { adapters } from '../adapters';
import { 
  Clock, 
  Database, 
  Sliders, 
  Trash2, 
  Check, 
  RefreshCw,
  Info,
  Activity,
  Globe
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    defaultReminderDays, 
    setDefaultReminderDays, 
    enabledAdapters, 
    toggleAdapter 
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
    fetch('http://127.0.0.1:8000/health')
      .then(res => res.ok ? setJobspyStatus('running') : setJobspyStatus('offline'))
      .catch(() => setJobspyStatus('offline'));

    fetch('http://127.0.0.1:8001/health')
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

  const handleClearDB = async () => {
    if (window.confirm('WARNING: This will permanently delete all your job applications and history logs! Are you sure?')) {
      await db.jobs.clear();
      setDbSuccessMessage('Database cleared successfully!');
      setTimeout(() => setDbSuccessMessage(null), 3000);
    }
  };

  const handleSeedMockData = async () => {
    if (window.confirm('This will load 7 realistic Indian job application entries into your tracker. Proceed?')) {
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
          salary: '₹12,0,000 - ₹18,00,000 / year',
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
          notes: 'Zepto interview. Round 1 technical is done. Focused on Javascript event loop, React architecture, hooks optimization. Round 2 scheduled next week.',
          tags: ['high priority', 'product-based'],
          contactName: 'Ananya Sharma',
          contactEmail: 'ananya@zepto.co',
        },
        {
          company: 'Groww',
          role: 'Frontend Engineer - Web',
          location: 'Bengaluru, Karnataka',
          salary: '₹14,0,000 - ₹20,00,000 / year',
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
          notes: 'Got the offer! HR shared details: 16 LPA fixed + equity. Need to submit documents by Friday. Super happy!',
          tags: ['high priority', 'product-based', 'referral'],
        },
        {
          company: 'Tata Consultancy Services (TCS)',
          role: 'React Frontend Developer',
          location: 'Bengaluru, Karnataka',
          salary: '₹6,0,000 - ₹9,50,000 a year',
          sourceSite: 'Indeed India',
          dateApplied: formatOffsetDate(16),
          lastStatusChange: formatOffsetDate(16),
          status: 'Applied',
          statusHistory: [
            { status: 'Applied', date: new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString() },
          ],
          link: 'https://in.indeed.com/viewjob?jk=indeed_mock_1',
          notes: 'Cold apply. Need to find a referral on LinkedIn to speed up review. Sitting in applied status for more than 2 weeks.',
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
          notes: 'OA test link received. HackerRank format. 3 coding questions (array manipulation, React toggle components, API integration). Must complete within 4 days.',
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
          notes: 'Interesting role. Check if they allow remote. Preparing custom resume highlighting React and Tailwind projects.',
          tags: ['cold apply'],
        },
        {
          company: 'Adobe',
          role: 'Software Developer (Frontend)',
          location: 'Noida, Uttar Pradesh',
          salary: '₹14,0,000 - ₹22,00,000 a year (Est.)',
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
          notes: 'Rejected after hiring manager round. Feedback: Strong technical skills, but looking for more years of experience in system design. Keep practicing system design questions.',
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
          notes: 'Withdrew application since salary was below expectations and required physical office presence 6 days a week.',
          tags: ['cold apply'],
        }
      ];

      for (const job of mockApplications) {
        await db.jobs.add(job);
      }
      setDbSuccessMessage('Successfully seeded mock data!');
      setTimeout(() => setDbSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none max-w-[1200px] mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/[0.04] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">System Settings</h1>
          <p className="text-xs text-text-muted mt-1">Configure scrapers, preferences, and client database.</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left tabs selector */}
        <div className="w-full md:w-60 bg-surface border border-white/[0.06] rounded-2xl p-2 shrink-0 space-y-1">
          <button
            onClick={() => setActiveSubTab('scrapers')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer ${activeSubTab === 'scrapers' ? 'bg-cool/10 text-cool border border-cool/15' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
          >
            <Globe className="h-4 w-4" />
            <span>Scrapers & Channels</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer ${activeSubTab === 'preferences' ? 'bg-cool/10 text-cool border border-cool/15' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
          >
            <Clock className="h-4 w-4" />
            <span>Campaign Preferences</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('database')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer ${activeSubTab === 'database' ? 'bg-cool/10 text-cool border border-cool/15' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
          >
            <Database className="h-4 w-4" />
            <span>Database Operations</span>
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 w-full bg-surface border border-white/[0.06] rounded-2xl p-6 min-h-[350px]">
          
          {/* TAB 1: SCRAPERS */}
          {activeSubTab === 'scrapers' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-cool" />
                  <span>Local Scraper Services</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Real-time status of your scraping backends running on your computer.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-void/60 rounded-xl border border-white/[0.04] flex flex-col justify-between space-y-3 shadow-inner hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Naukri & Indeed Engine</span>
                    <span className="font-mono text-[9px] text-text-muted/40">SRV-01</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${jobspyStatus === 'running' ? 'bg-success animate-pulse shadow-[0_0_8px_#10B981]' : jobspyStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-danger shadow-[0_0_8px_#EF4444]'}`} />
                    <span className="text-xs font-bold capitalize">{jobspyStatus === 'running' ? 'Active' : jobspyStatus === 'checking' ? 'Checking...' : 'Offline'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-text-muted/60 font-mono pt-1 border-t border-white/[0.02]">
                    <span>Port 8000</span>
                    <span>FastAPI + JobSpy</span>
                  </div>
                </div>

                <div className="p-4 bg-void/60 rounded-xl border border-white/[0.04] flex flex-col justify-between space-y-3 shadow-inner hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">LinkedIn & Internshala Engine</span>
                    <span className="font-mono text-[9px] text-text-muted/40">SRV-02</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${linkedinStatus === 'running' ? 'bg-success animate-pulse shadow-[0_0_8px_#10B981]' : linkedinStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-danger shadow-[0_0_8px_#EF4444]'}`} />
                    <span className="text-xs font-bold capitalize">{linkedinStatus === 'running' ? 'Active' : linkedinStatus === 'checking' ? 'Checking...' : 'Offline'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-text-muted/60 font-mono pt-1 border-t border-white/[0.02]">
                    <span>Port 8001</span>
                    <span>Express + Puppeteer</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] pt-5 space-y-4">
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
                        className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 select-none ${isEnabled ? 'bg-cool/5 border-cool/25 text-text-primary shadow-sm hover:border-cool/40' : 'bg-void/40 border-white/[0.04] text-text-muted hover:border-white/[0.08]'}`}
                      >
                        <span className="text-xs font-bold">{adapter.name}</span>
                        <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors duration-300 ease-in-out cursor-pointer ${isEnabled ? 'bg-cool shadow-[0_0_10px_rgba(91,140,255,0.35)]' : 'bg-white/10'}`}>
                          <span 
                            className="absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300"
                            style={{
                              transform: isEnabled ? 'translateX(20px)' : 'translateX(4px)',
                              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' /* Spring curve */
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/[0.04] pt-5 space-y-3">
                <label className="text-xs font-bold text-text-primary flex items-center space-x-2">
                  <span>LinkedIn Session Cookie (LI_AT)</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="password"
                    placeholder="Enter li_at cookie string..."
                    value={apifyToken}
                    onChange={handleTokenChange}
                    className="flex-1 bg-void border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-cool"
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

          {/* TAB 2: PREFERENCES */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-cool" />
                  <span>Stale Follow-Up Days</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Determine how long an application sits inactive before flagging it for follow-up.</p>
              </div>

              <div className="space-y-3 bg-void/25 border border-white/[0.04] p-4 rounded-xl">
                <label className="text-[10px] font-bold text-text-muted block uppercase tracking-wider">
                  Stale Limit (Days):
                </label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="number"
                    min="1"
                    value={defaultReminderDays}
                    onChange={handleDaysChange}
                    className="w-24 bg-void border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool font-bold"
                  />
                  {saveSuccess && (
                    <span className="text-xs text-success flex items-center space-x-1 animate-fade-in">
                      <Check className="h-4 w-4" />
                      <span>Changes saved</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted">
                  Inactive tracker entries older than this value will show a "Follow Up" notice.
                </p>
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
                <div className="p-3 bg-cool/10 border border-cool/20 text-cool text-xs rounded-xl flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>{dbSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-4 bg-void/25 border border-white/[0.04] p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSeedMockData}
                    className="bg-cool hover:bg-cool/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Seed Mock Pipeline</span>
                  </button>

                  <button
                    onClick={handleClearDB}
                    className="bg-void border border-danger/25 hover:bg-danger/10 text-danger font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Reset Database</span>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted">
                  Seeding mock data loads 7 sample Indian applications (Tata, Wipro, Groww, Zepto) for demonstration. Resetting database deletes everything permanently.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
