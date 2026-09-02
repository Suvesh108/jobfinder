import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { useDiscoveredJobsStore } from '../store/useDiscoveredJobsStore';
import { type JobListing } from '../adapters';
import { AITailorModal } from './AITailorModal';
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
  Trash2
} from 'lucide-react';

const PAGE_SIZE = 12;

export const FoundJobsView: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const { foundJobs, clearFoundJobs, lastSearchQuery, lastSearchLocation, isSearching, searchProgress } = useDiscoveredJobsStore();

  // Filters within found jobs
  const [filterQuery, setFilterQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [tailorJobTarget, setTailorJobTarget] = useState<{ company: string; role: string; location?: string; description?: string } | null>(null);
  const [selectedJobModal, setSelectedJobModal] = useState<JobListing | null>(null);

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
    const set = new Set<string>();
    foundJobs.forEach(j => { if (j.source) set.add(j.source); });
    return Array.from(set);
  }, [foundJobs]);

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

      if (filterSource !== 'all' && job.source !== filterSource) return false;

      return true;
    });
  }, [foundJobs, filterQuery, filterSource]);

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
    switch ((src || '').toLowerCase()) {
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
            <Search size={13} />
            <span>Search New Jobs</span>
          </button>
        </div>
      </div>

      {/* ── Live Searching Indicator ── */}
      {isSearching && (
        <div className="p-3.5 rounded-xl border flex flex-col gap-2 animate-fade-in" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Scraping job boards in real-time...</span>
            </span>
            <span>{Math.round(searchProgress)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300" style={{ width: `${searchProgress}%` }} />
          </div>
        </div>
      )}

      {/* ── Filters Bar within Found Jobs ── */}
      {foundJobs.length > 0 && (
        <div className="p-3 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Filter by title, company, skills..."
                value={filterQuery}
                onChange={(e) => { setFilterQuery(e.target.value); setCurrentPage(1); }}
                className="w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary focus:outline-none"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              />
            </div>

            {availableSources.length > 0 && (
              <select
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
                className="border rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:outline-none bg-surface-raised shrink-0 cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <option value="all">All Sources</option>
                {availableSources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-xs text-text-muted">
            <span>Showing {filteredJobs.length} of {foundJobs.length}</span>
            {(filterQuery || filterSource !== 'all') && (
              <button
                onClick={() => { setFilterQuery(''); setFilterSource('all'); setCurrentPage(1); }}
                className="text-cyan-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {foundJobs.length === 0 && !isSearching && (
        <div className="card p-12 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Briefcase size={36} />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-text-primary font-display">No jobs discovered yet</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Launch a search query in <strong>Search Job</strong> to discover live openings across LinkedIn, Naukri, Indeed, Glassdoor, and ZipRecruiter!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className="btn-primary text-xs px-5 py-2.5 font-bold flex items-center space-x-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
          >
            <Search size={14} />
            <span>Go to Search Job</span>
          </button>
        </div>
      )}

      {/* ── Job Cards Grid ── */}
      {paginatedJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedJobs.map((job, idx) => {
            const key = `${job.company.toLowerCase()}__${job.title.toLowerCase()}`;
            const trackerRecord = trackerLookup.get(key);
            const badgeStyle = getSourceBadgeStyle(job.source);

            return (
              <div
                key={`${job.source}_${job.company}_${idx}`}
                className="card p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:border-cyan-500/40 hover:-translate-y-0.5 group"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-2.5">
                  {/* Top: Source Badge & Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0"
                      style={{ background: badgeStyle.bg, color: badgeStyle.text, borderColor: badgeStyle.border }}
                    >
                      {job.source}
                    </span>
                    <span className="text-[10px] text-text-muted truncate">
                      {job.postedDate || 'Recent'}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 
                      onClick={() => setSelectedJobModal(job)}
                      className="text-sm font-bold font-display text-text-primary hover:text-cyan-400 transition-colors cursor-pointer line-clamp-1"
                      title={job.title}
                    >
                      {job.title}
                    </h3>
                    <p className="text-xs font-semibold text-text-secondary mt-0.5 line-clamp-1">{job.company}</p>
                  </div>

                  {/* Location & Salary */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </span>
                    {job.salary && job.salary !== 'Not Specified' && (
                      <span className="font-bold text-emerald-400 text-[11px] truncate">
                        {job.salary}
                      </span>
                    )}
                  </div>

                  {/* Snippet */}
                  {job.description && (
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 mt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  {/* AI Tailor Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTailorJobTarget({
                        company: job.company,
                        role: job.title,
                        location: job.location,
                        description: job.description
                      });
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 font-semibold transition-all cursor-pointer hover:scale-105"
                    style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                    title="Tailor ATS resume for this role with AI"
                  >
                    <Sparkles size={12} />
                    <span>AI Tailor</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {/* Quick Bookmark / Save to Tracker */}
                    <button
                      type="button"
                      onClick={() => handleSaveToTracker(job, 'Wishlist')}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 transition-all cursor-pointer ${
                        trackerRecord
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                          : 'bg-surface-raised text-text-secondary hover:text-text-primary border-subtle'
                      }`}
                      title={trackerRecord ? 'Saved in Tracker' : 'Save to Tracker (Wishlist)'}
                    >
                      {trackerRecord ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                      <span>{trackerRecord ? 'Saved' : 'Save'}</span>
                    </button>

                    {/* Direct External Link */}
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl border text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0"
                        style={{ borderColor: 'var(--border-subtle)' }}
                        title="Open Original Job Listing"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>

          <span className="text-xs font-bold text-text-muted">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── AI Tailor Modal ── */}
      {tailorJobTarget && (
        <AITailorModal
          isOpen={true}
          job={tailorJobTarget}
          onClose={() => setTailorJobTarget(null)}
        />
      )}

      {/* ── Selected Job Details Modal ── */}
      {selectedJobModal && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedJobModal(null)}
        >
          <div 
            className="card w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display">{selectedJobModal.title}</h3>
                <p className="text-xs text-text-secondary">{selectedJobModal.company} • {selectedJobModal.location}</p>
              </div>
              <button onClick={() => setSelectedJobModal(null)} className="text-text-muted hover:text-text-primary text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-text-secondary leading-relaxed">
              {selectedJobModal.salary && (
                <div className="p-2.5 rounded-xl border bg-surface-raised flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-text-muted">Offered Compensation:</span>
                  <span className="font-bold text-emerald-400">{selectedJobModal.salary}</span>
                </div>
              )}
              <div>
                <h4 className="font-bold text-text-primary mb-1">Job Description &amp; Highlights:</h4>
                <p className="whitespace-pre-line text-text-muted">{selectedJobModal.description || 'No detailed snippet available from provider.'}</p>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => { handleSaveToTracker(selectedJobModal, 'Wishlist'); setSelectedJobModal(null); }}
                className="btn-secondary text-xs px-3.5 py-1.5 cursor-pointer"
              >
                Save to Tracker
              </button>
              {selectedJobModal.url && (
                <a
                  href={selectedJobModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs px-4 py-1.5 flex items-center space-x-1.5"
                >
                  <span>Open Job Application</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
