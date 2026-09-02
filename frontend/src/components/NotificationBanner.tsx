import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useDiscoveredJobsStore } from '../store/useDiscoveredJobsStore';
import { Search, CheckCircle2, ArrowRight, X, Bell } from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const isSearching = useDiscoveredJobsStore(state => state.isSearching);
  const searchProgress = useDiscoveredJobsStore(state => state.searchProgress);
  const foundJobs = useDiscoveredJobsStore(state => state.foundJobs);
  const lastSearchQuery = useDiscoveredJobsStore(state => state.lastSearchQuery);

  const [showCompleteNotification, setShowCompleteNotification] = useState(false);
  const [appUpdateNotification, setAppUpdateNotification] = useState<{ tag: string; url: string } | null>(null);

  // When search completes (progress reaches 100 or isSearching switches from true to false with results)
  useEffect(() => {
    if (!isSearching && foundJobs.length > 0 && searchProgress === 100) {
      setShowCompleteNotification(true);
      const timer = setTimeout(() => {
        setShowCompleteNotification(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isSearching, searchProgress, foundJobs.length]);

  // Check for app update in background once on load
  useEffect(() => {
    fetch('https://api.github.com/repos/Suvesh108/jobfinder/releases/latest')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.tag_name && data.tag_name.toLowerCase() !== 'v1.1.4' && data.tag_name.toLowerCase() !== 'v1.1.3') {
          setAppUpdateNotification({
            tag: data.tag_name,
            url: data.html_url || 'https://github.com/Suvesh108/jobfinder/releases'
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4 pointer-events-none flex flex-col items-center gap-2">
      {/* ── 1. ACTIVE SEARCHING PERCENTAGE NOTIFICATION ── */}
      {isSearching && (
        <div 
          className="pointer-events-auto w-full p-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-bounce-in flex flex-col gap-2"
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            borderColor: 'rgba(6, 182, 212, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.2)'
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Search size={14} className="animate-spin" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-text-primary block truncate">
                  Scanning Job Portals... <strong className="text-cyan-400 tabular-nums">{searchProgress}%</strong>
                </span>
                <span className="text-[10px] text-text-muted block truncate">
                  {foundJobs.length} positions discovered across LinkedIn, Naukri, Indeed
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('found_jobs')}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>View Found</span>
              <ArrowRight size={11} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${searchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── 2. SEARCH COMPLETE 100% NOTIFICATION ── */}
      {showCompleteNotification && !isSearching && (
        <div 
          className="pointer-events-auto w-full p-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-bounce-in flex items-center justify-between gap-3"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(16, 185, 129, 0.45)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.2)'
          }}
        >
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-text-primary block truncate">
                Scan 100% Complete!
              </span>
              <span className="text-[10px] text-text-muted block truncate">
                {foundJobs.length} jobs discovered for "{lastSearchQuery || 'Tech Roles'}"
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('found_jobs');
                setShowCompleteNotification(false);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 transition-all cursor-pointer flex items-center space-x-1 shadow-md"
            >
              <span>Open Found Jobs</span>
              <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={() => setShowCompleteNotification(false)}
              className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. IN-APP UPDATE NOTIFICATION ── */}
      {appUpdateNotification && (
        <div 
          className="pointer-events-auto w-full p-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-bounce-in flex items-center justify-between gap-3"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(56, 189, 248, 0.45)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
              <Bell size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-text-primary block truncate">
                New Update Available ({appUpdateNotification.tag})
              </span>
              <span className="text-[10px] text-text-muted block truncate">
                A new version of JobFinder is available on GitHub.
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                setAppUpdateNotification(null);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-500 text-black font-extrabold hover:bg-sky-400 transition-all flex items-center space-x-1 shadow-md cursor-pointer"
            >
              <span>Update Internally</span>
              <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={() => setAppUpdateNotification(null)}
              className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
