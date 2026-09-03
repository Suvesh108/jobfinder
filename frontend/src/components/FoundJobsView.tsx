
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { useDiscoveredJobsStore } from '../store/useDiscoveredJobsStore';
import { type JobListing } from '../adapters';
import { AITailorModal } from './AITailorModal';
import { verifyJobUrlsBatch, getCachedLiveness, type VerificationStatus } from '../utils/livenessService';
import { classifyExperience } from '../utils/experienceClassifier';
import {  
  Search, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles,
  Layers,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Globe,
  ChevronDown,
  Check
} from 'lucide-react';

const normalizeSource = (src?: string): string => {
  if (!src) return 'Unknown';
  if (src.toLowerCase() === 'naukri.com' || src.toLowerCase() === 'naukri') return 'Naukri';
  return src;
};

const PAGE_SIZE = 12;

const formatRelativeDate = (dateStr?: string): { text: string; isToday: boolean } => {
  if (!dateStr) return { text: 'Recent', isToday: false };
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { text: 'Today', isToday: true };
  if (diffDays === 1) return { text: 'Yesterday', isToday: false };
  if (diffDays < 7) return { text: `${diffDays}d ago`, isToday: false };
  return { text: dateStr, isToday: false };
};

const isFresherFriendly = (job: JobListing): boolean => {
  const text = `${job.title} ${job.description || ''}`.toLowerCase();
  return text.includes('fresher') || text.includes('entry level') || text.includes('graduate') || text.includes('0-1') || text.includes('intern');
};

export const FoundJobsView: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const foundJobs = useDiscoveredJobsStore(state => state.foundJobs);
  const clearFoundJobs = useDiscoveredJobsStore(state => state.clearFoundJobs);
  const lastSearchQuery = useDiscoveredJobsStore(state => state.lastSearchQuery);
  const lastSearchLocation = useDiscoveredJobsStore(state => state.lastSearchLocation);

  // Filters within found jobs
  const [filterQuery, setFilterQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [fresherOnly, setFresherOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Portal Dropdown State
  const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portalDropdownRef.current && !portalDropdownRef.current.contains(event.target as Node)) {
        setIsPortalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Liveness Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [livenessMap, setLivenessMap] = useState<Map<string, VerificationStatus>>(new Map());

  // Modals
  const [tailorJobTarget, setTailorJobTarget] = useState<{ company: string; role: string; location?: string; description?: string } | null>(null);

  // Existing tracker jobs to show saved state
  const trackerJobs = useLiveQuery(() => db.jobs.toArray()) || [];
  const trackerLookup = useMemo(() => {
    const map = new Map<string, JobApplication>();
    for (const j of trackerJobs) {
      map.set(`${j.company.toLowerCase()}__${j.role.toLowerCase()}`, j);
    }
    return map;
  }, [trackerJobs]);

  // Sources present in found jobs
  const availableSources = useMemo(() => {
    const counts = new Map<string, number>();
    foundJobs.forEach(j => {
      const s = normalizeSource(j.source);
      counts.set(s, (counts.get(s) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [foundJobs]);

  // Automatic & Manual URL liveness check
  const handleVerifyAllLinks = async () => {
    if (foundJobs.length === 0) return;
    setIsVerifying(true);
    try {
      const map = await verifyJobUrlsBatch(foundJobs);
      setLivenessMap(new Map(map));
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (foundJobs.length > 0) {
      handleVerifyAllLinks();
    }
  }, [foundJobs.length]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return foundJobs.filter((job) => {
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesLoc = (job.location || '').toLowerCase().includes(q);
        const matchesDesc = (job.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesLoc && !matchesDesc) return false;
      }

      if (filterSource !== 'all' && normalizeSource(job.source) !== filterSource) return false;
      if (fresherOnly && !isFresherFriendly(job)) return false;

      if (activeOnly) {
        const live = livenessMap.get(job.url) || getCachedLiveness(job.url, job.source);
        if (live && !live.isActive) return false;
      }

      return true;
    });
  }, [foundJobs, filterQuery, filterSource, fresherOnly, activeOnly, livenessMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, currentPage]);

  const handleSaveToTracker = async (job: JobListing, status: JobStatus = 'Wishlist') => {
    const key = `${job.company.toLowerCase()}__${job.title.toLowerCase()}`;
    const existing = trackerLookup.get(key);

    if (existing && existing.id) {
      await db.jobs.update(existing.id, { status, lastStatusChange: new Date().toISOString().split('T')[0] });
    } else {
      await db.jobs.add({
        company: job.company,
        role: job.title,
        location: job.location || 'Remote / India',
        salary: job.salary,
        sourceSite: job.source || 'Scraped',
        dateApplied: new Date().toISOString().split('T')[0],
        lastStatusChange: new Date().toISOString().split('T')[0],
        status,
        statusHistory: [{ status, date: new Date().toISOString() }],
        link: job.url || '',
        notes: job.description || '',
        tags: [job.source].filter(Boolean) as string[],
      });
    }
  };

  const getSourceBadgeStyle = (src?: string) => {
    const s = (src || '').toLowerCase();
    if (s.startsWith('ats:') || s.includes('greenhouse') || s.includes('lever') || s.includes('ashby')) {
      return { bg: 'rgba(6, 182, 212, 0.18)', text: '#22D3EE', border: 'rgba(6, 182, 212, 0.35)' };
    }
    switch (s) {
      case 'linkedin': return { bg: 'rgba(10, 102, 194, 0.18)', text: '#38BDF8', border: 'rgba(10, 102, 194, 0.35)' };
      case 'indeed': return { bg: 'rgba(0, 58, 140, 0.18)', text: '#60A5FA', border: 'rgba(0, 58, 140, 0.35)' };
      case 'naukri': return { bg: 'rgba(255, 117, 85, 0.18)', text: '#FB923C', border: 'rgba(255, 117, 85, 0.35)' };
      case 'glassdoor': return { bg: 'rgba(12, 170, 65, 0.18)', text: '#4ADE80', border: 'rgba(12, 170, 65, 0.35)' };
      case 'zip_recruiter':
      case 'ziprecruiter': return { bg: 'rgba(92, 45, 145, 0.18)', text: '#C084FC', border: 'rgba(92, 45, 145, 0.35)' };
      default: return { bg: 'var(--bg-surface-raised)', text: 'var(--text-secondary)', border: 'var(--border-subtle)' };
    }
  };

  return (
    <div className="page-content w-full max-w-full px-3 sm:px-8 py-3 sm:py-6 pb-24 sm:pb-10 overflow-y-auto overflow-x-hidden flex flex-col gap-4">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black font-display text-text-primary">
                Found Jobs
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {foundJobs.length} Discovered
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {lastSearchQuery ? `Scanned results for "${lastSearchQuery}" ${lastSearchLocation ? `in ${lastSearchLocation}` : ''}` : 'Live aggregator results across LinkedIn, Naukri, Indeed, Glassdoor & ZipRecruiter'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {foundJobs.length > 0 && (
            <button
              type="button"
              onClick={clearFoundJobs}
              className="text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 text-text-muted hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
              style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
              title="Clear current search results"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5 font-bold cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar & Expiry Controls ── */}
      {foundJobs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {/* Quick Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => { setFilterQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Filter by title, company or skill..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border outline-none bg-surface text-text-primary focus:border-cyan-500/50"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Custom Styled Portal Filter Dropdown */}
            <div className="relative shrink-0" ref={portalDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPortalDropdownOpen(!isPortalDropdownOpen)}
                className="text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-2 bg-surface text-text-primary hover:border-cyan-500/50 transition-all cursor-pointer shadow-xs select-none"
                style={{ 
                  borderColor: isPortalDropdownOpen ? 'var(--status-info)' : 'var(--border-subtle)',
                  background: 'var(--bg-surface-raised)'
                }}
              >
                <Globe size={13} className="text-cyan-400 shrink-0" />
                <span className="font-semibold">
                  {filterSource === 'all' ? `All Portals (${foundJobs.length})` : filterSource}
                </span>
                <ChevronDown 
                  size={13} 
                  className={`text-text-muted transition-transform duration-200 shrink-0 ${isPortalDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} 
                />
              </button>

              {isPortalDropdownOpen && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border shadow-2xl p-1.5 z-50 animate-fade-in backdrop-blur-xl space-y-1"
                  style={{ 
                    background: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Option: All Portals */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSource('all');
                      setIsPortalDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-xs px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-all cursor-pointer ${
                      filterSource === 'all'
                        ? 'bg-cyan-500/15 text-cyan-400 font-bold'
                        : 'text-text-primary hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe size={13} className={filterSource === 'all' ? 'text-cyan-400' : 'text-text-muted'} />
                      <span>All Portals</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-surface border" style={{ borderColor: 'var(--border-subtle)' }}>
                        {foundJobs.length}
                      </span>
                      {filterSource === 'all' && <Check size={13} className="text-cyan-400" />}
                    </div>
                  </button>

                  <div className="border-t my-1 opacity-60" style={{ borderColor: 'var(--border-subtle)' }} />

                  {/* Portal List (with Naukri.com unified into Naukri) */}
                  <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                    {availableSources.map(s => {
                      const isSelected = filterSource === s.name;
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => {
                            setFilterSource(s.name);
                            setIsPortalDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-xs px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
                              : 'text-text-primary hover:bg-surface-raised'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span className="truncate">{s.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-surface border" style={{ borderColor: 'var(--border-subtle)' }}>
                              {s.count}
                            </span>
                            {isSelected && <Check size={13} className="text-cyan-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Filter Toggle */}
            <button
              type="button"
              onClick={() => { setFresherOnly(!fresherOnly); setCurrentPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 font-bold transition-all cursor-pointer shrink-0 ${
                fresherOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              style={{ background: fresherOnly ? undefined : 'var(--bg-surface-raised)', borderColor: fresherOnly ? undefined : 'var(--border-subtle)' }}
            >
              <span>🌱 Freshers (0-1 Yrs)</span>
            </button>

            {/* Verified Active Only Filter Toggle */}
            <button
              type="button"
              onClick={() => { setActiveOnly(!activeOnly); setCurrentPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 font-bold transition-all cursor-pointer shrink-0 ${
                activeOnly
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              style={{ background: activeOnly ? undefined : 'var(--bg-surface-raised)', borderColor: activeOnly ? undefined : 'var(--border-subtle)' }}
              title="Hide closed or expired jobs"
            >
              <ShieldCheck size={13} />
              <span>Verified Active Only</span>
            </button>

            {/* 1-Tap Link Verifier Button */}
            <button
              type="button"
              onClick={handleVerifyAllLinks}
              disabled={isVerifying}
              className="text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 font-semibold text-text-muted hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer shrink-0"
              style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
              title="Ping and scan destination URLs for live/closed status"
            >
              <RefreshCw size={12} className={isVerifying ? 'animate-spin text-cyan-400' : ''} />
              <span>{isVerifying ? 'Verifying...' : 'Check Links'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Job Cards Grid ── */}
      {foundJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border my-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
            <Layers size={32} />
          </div>
          <h2 className="text-base font-bold text-text-primary">No Jobs Found Yet</h2>
          <p className="text-xs text-text-muted max-w-md mt-1 mb-4">
            Start a job scan in the Search tab to stream live postings directly from LinkedIn, Naukri, Indeed, Glassdoor, Greenhouse & Lever into this tab.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className="btn-primary text-xs px-4 py-2 font-bold flex items-center space-x-2 cursor-pointer"
          >
            <Search size={14} />
            <span>Go to Search Tab</span>
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs text-text-muted">No jobs match your selected filters.</p>
          <button
            type="button"
            onClick={() => { setFilterQuery(''); setFilterSource('all'); setFresherOnly(false); setActiveOnly(false); }}
            className="text-xs text-cyan-400 hover:underline mt-2 font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedJobs.map((job, idx) => {
              const badgeStyle = getSourceBadgeStyle(job.source);
              const key = `${job.company.toLowerCase()}__${job.title.toLowerCase()}`;
              const trackerJob = trackerLookup.get(key);
              const isSaved = Boolean(trackerJob);
              const liveness = livenessMap.get(job.url) || getCachedLiveness(job.url, job.source);
              const isExpired = liveness && !liveness.isActive;

              return (
                <div
                  key={`${job.url || job.title}-${idx}`}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:border-cyan-500/40 relative group ${
                    isExpired ? 'opacity-65 border-rose-500/30' : ''
                  }`}
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                  <div>
                    {/* Top: Source Badge, Fresher Tag, Liveness & Timestamp */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0"
                          style={{ background: badgeStyle.bg, color: badgeStyle.text, borderColor: badgeStyle.border }}
                        >
                          {job.source}
                        </span>

                        {(() => {
                          const exp = classifyExperience(job);
                          return (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0"
                              style={{ background: exp.badgeBg, color: exp.badgeText, borderColor: exp.badgeBorder }}
                            >
                              {exp.label}
                            </span>
                          );
                        })()}

                        {liveness?.isATS ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0 flex items-center space-x-0.5">
                            <ShieldCheck size={10} />
                            <span>100% Live ATS</span>
                          </span>
                        ) : isExpired ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 flex items-center space-x-0.5">
                            <ShieldAlert size={10} />
                            <span>Expired / Closed</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center space-x-0.5">
                            <ShieldCheck size={10} />
                            <span>🟢 Active</span>
                          </span>
                        )}
                      </div>

                      {(() => {
                        const rel = formatRelativeDate(job.postedDate);
                        return (
                          <span className={`text-[10px] font-semibold truncate ${rel.isToday ? 'text-emerald-400' : 'text-text-muted'}`}>
                            {rel.isToday ? '🟢 Today' : rel.text}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Role Title */}
                    <h3 className="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {job.title}
                    </h3>

                    {/* Company & Location */}
                    <div className="flex flex-col gap-1 mt-1.5">
                      <div className="flex items-center space-x-1 text-xs font-semibold text-text-secondary">
                        <Briefcase size={12} className="text-cyan-400 shrink-0" />
                        <span className="truncate">{job.company}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] text-text-muted">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{job.location || 'India'}</span>
                      </div>
                    </div>

                    {/* Salary */}
                    {job.salary && job.salary !== 'Not Specified' && (
                      <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block border border-emerald-500/20">
                        {job.salary}
                      </div>
                    )}

                    {/* Description Snippet */}
                    {job.description && (
                      <p className="text-[11px] text-text-muted line-clamp-2 mt-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    {/* Track Status / Bookmark */}
                    <button
                      type="button"
                      onClick={() => handleSaveToTracker(job, isSaved ? 'Rejected' : 'Wishlist')}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 font-semibold transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'text-text-muted hover:text-text-primary border-subtle'
                      }`}
                      style={{ background: isSaved ? undefined : 'var(--bg-surface-raised)' }}
                    >
                      {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                      <span>{isSaved ? trackerJob?.status || 'Tracked' : 'Track'}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      {/* AI Tailor Resume */}
                      <button
                        type="button"
                        onClick={() => setTailorJobTarget({ company: job.company, role: job.title, location: job.location, description: job.description })}
                        className="text-xs p-1.5 rounded-xl border text-purple-400 hover:bg-purple-500/15 border-purple-500/30 transition-all cursor-pointer"
                        title="Tailor Resume with AI"
                      >
                        <Sparkles size={13} />
                      </button>

                      {/* Direct Apply Link */}
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-xs px-3 py-1.5 flex items-center space-x-1 font-bold cursor-pointer"
                        >
                          <span>Apply</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-text-muted font-bold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* AI Resume Tailor Modal */}
      {tailorJobTarget && (
        <AITailorModal
          isOpen={Boolean(tailorJobTarget)}
          job={tailorJobTarget}
          onClose={() => setTailorJobTarget(null)}
        />
      )}
    </div>
  );
};
