import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getUserProfile, type JobApplication, type JobStatus } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { JobModal } from './JobModal';
import { AITailorModal } from './AITailorModal';
import { InterviewPrepModal } from './InterviewPrepModal';
import { TailoredResumeModal } from './TailoredResumeModal';
import { EmailGeneratorModal } from './EmailGeneratorModal';
import { CustomDropdown, StatusSelectDropdown } from './CustomDropdown';
import { ConfirmModal } from './ConfirmModal';
import { syncToNotionAPI } from '../utils/notionService';
import { checkNeedsFollowUp } from '../utils/helpers';
import { 
  GripVertical,
  Plus, 
  Search, 
  Share2, 
  Download, 
  Trash2, 
  Sparkles, 
  Target, 
  FileText, 
  Mail, 
  ExternalLink, 
  Edit2, 
  AlertCircle, 
  MapPin, 
  Globe, 
  Tag, 
  TrendingUp, 
  RotateCcw,
  Briefcase
} from 'lucide-react';

const COLUMNS: JobStatus[] = [
  'Wishlist',
  'Applied',
  'OA/Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

const STATUS_THEMES: Record<JobStatus, { bg: string; text: string; border: string; accent: string }> = {
  Wishlist:        { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.25)', accent: '#94A3B8' },
  Applied:         { bg: 'rgba(56, 189, 248, 0.12)',  text: '#38BDF8', border: 'rgba(56, 189, 248, 0.25)',  accent: '#38BDF8' },
  'OA/Assessment': { bg: 'rgba(168, 85, 247, 0.12)',  text: '#C084FC', border: 'rgba(168, 85, 247, 0.25)',  accent: '#A855F7' },
  Interview:       { bg: 'rgba(251, 146, 60, 0.12)',  text: '#FB923C', border: 'rgba(251, 146, 60, 0.25)',  accent: '#FB923C' },
  Offer:           { bg: 'rgba(52, 211, 153, 0.12)',  text: '#34D399', border: 'rgba(52, 211, 153, 0.25)',  accent: '#10B981' },
  Rejected:        { bg: 'rgba(248, 113, 113, 0.12)', text: '#F87171', border: 'rgba(248, 113, 113, 0.25)', accent: '#EF4444' },
  Withdrawn:       { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B', border: 'rgba(100, 116, 139, 0.25)', accent: '#64748B' },
};

export const TrackerView: React.FC = () => {
  const { filters, setFilters, resetFilters, defaultReminderDays } = useUIStore();
  
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [dateOption, setDateOption] = useState<string>('all');
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<JobApplication | null>(null);
  const [isSyncingNotion, setIsSyncingNotion] = useState(false);
  const [notionMessage, setNotionMessage] = useState<string | null>(null);

  // AI Modal States
  const [tailorJob, setTailorJob] = useState<JobApplication | null>(null);
  const [prepJob, setPrepJob] = useState<JobApplication | null>(null);
  const [resumeJob, setResumeJob] = useState<JobApplication | null>(null);
  const [emailJob, setEmailJob] = useState<JobApplication | null>(null);

  // Live Query All Jobs
  const jobs = useLiveQuery(() => db.jobs.toArray()) ?? [];

  // KPI Metrics
  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter(j => ['Applied', 'OA/Assessment', 'Interview', 'Offer'].includes(j.status)).length;
    const interviews = jobs.filter(j => j.status === 'Interview').length;
    const offers = jobs.filter(j => j.status === 'Offer').length;
    const wishlist = jobs.filter(j => j.status === 'Wishlist').length;
    const conversionRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;

    return { total, totalApplied: applied, interviews, offers, wishlist, conversionRate };
  }, [jobs]);

  // Unique Sources for Filter Dropdown
  const sources = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach(j => { if (j.sourceSite) s.add(j.sourceSite); });
    return Array.from(s);
  }, [jobs]);

  // Filtered Jobs List
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 1. Status Filter
      if (activeStatusFilter !== 'all' && job.status !== activeStatusFilter) return false;

      // 2. Text Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchComp = job.company.toLowerCase().includes(query);
        const matchRole = job.role.toLowerCase().includes(query);
        const matchLoc = job.location.toLowerCase().includes(query);
        const matchTag = job.tags && job.tags.some(t => t.toLowerCase().includes(query));
        if (!matchComp && !matchRole && !matchLoc && !matchTag) return false;
      }

      // 3. Source Filter
      if (filters.source && filters.source !== 'all' && job.sourceSite !== filters.source) return false;

      // 4. Tag Filter
      if (filters.tag && filters.tag !== 'all' && (!job.tags || !job.tags.includes(filters.tag))) return false;

      // 5. Date Filter
      if (dateOption !== 'all') {
        const jobDate = new Date(job.dateApplied).getTime();
        const now = Date.now();
        const dayMs = 86400000;
        if (dateOption === '7d' && now - jobDate > 7 * dayMs) return false;
        if (dateOption === '30d' && now - jobDate > 30 * dayMs) return false;
        if (dateOption === '90d' && now - jobDate > 90 * dayMs) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
  }, [jobs, activeStatusFilter, filters, dateOption]);

  const handleAddClick = (status: JobStatus = 'Wishlist') => {
    setSelectedJob({
      company: '',
      role: '',
      location: 'India (Remote)',
      salary: '',
      sourceSite: 'Direct',
      dateApplied: new Date().toISOString().split('T')[0],
      lastStatusChange: new Date().toISOString().split('T')[0],
      status,
      statusHistory: [{ status, date: new Date().toISOString() }],
      link: '',
      notes: '',
      tags: [],
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) return;
    const headers = ['ID', 'Company', 'Role', 'Status', 'Location', 'Salary', 'Source', 'DateApplied', 'Tags', 'Link'];
    const rows = jobs.map(j => [
      j.id || '',
      `"${j.company.replace(/"/g, '""')}"`,
      `"${j.role.replace(/"/g, '""')}"`,
      j.status,
      `"${j.location.replace(/"/g, '""')}"`,
      `"${(j.salary || '').replace(/"/g, '""')}"`,
      j.sourceSite,
      j.dateApplied,
      `"${(j.tags || []).join(', ')}"`,
      `"${j.link || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jobfinder_applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncNotion = async () => {
    if (jobs.length === 0) {
      alert('No jobs in tracker to sync!');
      return;
    }
    setIsSyncingNotion(true);
    const profile = await getUserProfile();
    const res = await syncToNotionAPI(jobs, profile.notionToken || '', profile.notionDatabaseId || '');
    setNotionMessage(res.message);
    setIsSyncingNotion(false);
    setTimeout(() => setNotionMessage(null), 5000);
  };

  const isFiltered = filters.search || filters.source !== 'all' || filters.tag !== 'all' || dateOption !== 'all' || activeStatusFilter !== 'all';

  return (
    <div className="page-content w-full max-w-full px-3 sm:px-8 py-3 sm:py-6 pb-24 sm:pb-10 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-4">
        
        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-3 w-full">
          {/* 1. Active Pipeline */}
          <div className="card p-2 sm:p-3.5 flex flex-col justify-between border min-w-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-text-muted truncate">Pipeline</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-sm sm:text-xl font-black font-display text-cyan-400">{stats.totalApplied}</span>
              <span className="text-[8px] sm:text-[10px] text-text-muted font-medium hidden sm:inline">in progress</span>
            </div>
          </div>

          {/* 2. Interviews */}
          <div className="card p-2 sm:p-3.5 hidden sm:flex flex-col justify-between border min-w-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold truncate" style={{ color: 'var(--status-interview)' }}>Interviews</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-sm sm:text-xl font-black font-display" style={{ color: 'var(--status-interview)' }}>{stats.interviews}</span>
              <span className="text-[8px] sm:text-[10px] text-text-muted font-medium">active</span>
            </div>
          </div>

          {/* 3. Offers */}
          <div className="card p-2 sm:p-3.5 flex flex-col justify-between border min-w-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold truncate" style={{ color: 'var(--status-offer)' }}>Offers</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-sm sm:text-xl font-black font-display text-emerald-400">{stats.offers}</span>
              <span className="text-[8px] sm:text-[10px] text-text-muted font-medium hidden sm:inline">wins</span>
            </div>
          </div>

          {/* 4. Wishlist */}
          <div className="card p-2 sm:p-3.5 hidden sm:flex flex-col justify-between border min-w-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-text-muted truncate">Wishlist</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-sm sm:text-xl font-black font-display text-purple-400">{stats.wishlist}</span>
              <span className="text-[8px] sm:text-[10px] text-text-muted font-medium">leads</span>
            </div>
          </div>

          {/* 5. Rate */}
          <div className="card p-2 sm:p-3.5 flex flex-col justify-between border min-w-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-primary flex items-center space-x-1 truncate">
              <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 shrink-0" />
              <span>Rate</span>
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-sm sm:text-xl font-black font-display text-rose-400">{stats.conversionRate}%</span>
              <span className="text-[8px] sm:text-[10px] text-text-muted font-medium hidden sm:inline">rate</span>
            </div>
          </div>
        </div>

        {/* Notion Sync Notification Toast */}
        {notionMessage && (
          <div className="p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fade-in" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cool)', borderColor: 'rgba(56, 189, 248, 0.25)' }}>
            <div className="flex items-center space-x-2">
              <Share2 className="h-4 w-4 shrink-0" />
              <span>{notionMessage}</span>
            </div>
            <button onClick={() => setNotionMessage(null)} className="text-text-muted hover:text-text-primary cursor-pointer">&times;</button>
          </div>
        )}

        {/* Status Filter Ribbon Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap w-full">
          <button
            onClick={() => setActiveStatusFilter('all')}
            className="text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
            style={{
              background: activeStatusFilter === 'all' ? 'var(--sidebar-item-active)' : 'var(--bg-surface-raised)',
              color: activeStatusFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: activeStatusFilter === 'all' ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)'
            }}
          >
            All Applications ({jobs.length})
          </button>
          {COLUMNS.map((st) => {
            const count = jobs.filter(j => j.status === st).length;
            const theme = STATUS_THEMES[st] || STATUS_THEMES.Wishlist;
            const isActive = activeStatusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className="text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5"
                style={{
                  background: isActive ? theme.bg : 'var(--bg-surface-raised)',
                  color: isActive ? theme.text : 'var(--text-muted)',
                  border: isActive ? `1px solid ${theme.border}` : '1px solid var(--border-subtle)'
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                <span>{st}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Filters, Notion, Export & Add Job */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl border w-full" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0 w-full">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input 
                type="text"
                placeholder="Search company, role..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              />
            </div>

            {/* Dropdown Filters Row */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5">
              <CustomDropdown
                value={filters.source || 'all'}
                onChange={(val) => setFilters({ source: val })}
                options={[
                  { value: 'all', label: 'All Sources' },
                  ...sources.map(s => ({ value: s, label: s }))
                ]}
                size="sm"
              />

              <CustomDropdown
                value={dateOption}
                onChange={(val) => setDateOption(val)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' },
                ]}
                size="sm"
              />

              {isFiltered && (
                <button
                  onClick={() => {
                    resetFilters();
                    setDateOption('all');
                    setActiveStatusFilter('all');
                  }}
                  className="text-xs text-text-muted hover:text-text-primary flex items-center space-x-1 cursor-pointer px-2 py-1 shrink-0 rounded-lg border"
                  style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: 'var(--border-subtle)' }}>
            {/* Notion Sync Button */}
            <button 
              onClick={handleSyncNotion} 
              disabled={isSyncingNotion}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5" 
              title="Sync tracker pipeline into Notion database"
            >
              <Share2 size={13} className={isSyncingNotion ? 'animate-spin text-primary' : ''} />
              <span className="hidden sm:inline">{isSyncingNotion ? 'Syncing...' : 'Notion Sync'}</span>
            </button>

            {/* Export CSV Button */}
            <button 
              onClick={handleExportCSV}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5"
              title="Export tracker applications to CSV"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Add Job Button */}
            <button 
              onClick={() => handleAddClick('Wishlist')} 
              className="btn-primary text-xs px-4 py-1.5 font-bold flex items-center space-x-1.5"
            >
              <Plus size={14} />
              <span>Add Job</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CLEAN APPLICATION LIST SYSTEM
            ══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center justify-center space-y-3" style={{ background: 'var(--bg-card)' }}>
              <div className="p-3.5 rounded-full" style={{ background: 'var(--bg-surface-raised)' }}>
                <Briefcase className="h-8 w-8 text-text-muted" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">No applications found</h3>
                <p className="text-xs text-text-muted mt-1 max-w-sm">
                  {isFiltered ? 'Try clearing your filters to see more applications.' : 'Add your first job to begin tracking your pipeline.'}
                </p>
              </div>
              <button
                onClick={() => handleAddClick('Wishlist')}
                className="btn-primary text-xs px-4 py-2 font-bold flex items-center space-x-1.5 mt-2"
              >
                <Plus size={14} />
                <span>Add Application</span>
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const theme = STATUS_THEMES[job.status] || STATUS_THEMES.Wishlist;
              const isStale = checkNeedsFollowUp(job, job.reminderDays || defaultReminderDays);
              
              return (
                <div
                  key={job.id}
                  className="card p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-200 hover:border-indigo-500/40 group"
                  style={{
                    background: 'var(--bg-card)',
                    borderLeft: `4px solid ${theme.accent}`,
                  }}
                >
                  {/* Left: Avatar + Title, Company, Location, Salary, Tags */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="opacity-0 group-hover:opacity-60 transition-opacity text-text-muted cursor-grab shrink-0 hidden sm:block" title="Drag to AI Copilot">
                      <GripVertical size={16} />
                    </div>
                    <div 
                      className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 select-none text-white shadow-xs"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.accent} 0%, #312E81 100%)`,
                      }}
                    >
                      {(job.company && job.company.length > 0) ? job.company.charAt(0).toUpperCase() : 'J'}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 
                          onClick={() => handleEditClick(job)}
                          className="text-sm font-bold font-display text-text-primary hover:text-primary transition-colors cursor-pointer"
                        >
                          {job.role}
                        </h4>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs font-semibold text-text-secondary">{job.company}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-text-muted" />
                          <span>{job.location}</span>
                        </span>
                        
                        {job.sourceSite && (
                          <>
                            <span className="hidden sm:inline opacity-30">•</span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5 text-text-muted" />
                              <span>{job.sourceSite}</span>
                            </span>
                          </>
                        )}

                        {job.salary && job.salary !== 'Not Specified' && (
                          <>
                            <span className="hidden sm:inline opacity-30">•</span>
                            <span className="font-bold text-emerald-400">{job.salary}</span>
                          </>
                        )}

                        <span className="hidden sm:inline opacity-30">•</span>
                        <span className="text-[11px] text-text-muted">Applied: {job.dateApplied}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {isStale && (
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1"
                            style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-signal)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                          >
                            <AlertCircle className="h-2.5 w-2.5" />
                            <span>Follow-up Recommended</span>
                          </span>
                        )}
                        {job.tags && job.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-md border flex items-center space-x-1"
                            style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                          >
                            <Tag className="h-2 w-2" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick AI Actions, Inline Status Dropdown & Row Actions */}
                  <div className="shrink-0 flex flex-wrap items-center gap-3 justify-between lg:justify-end border-t lg:border-0 pt-3 lg:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    
                    {/* Quick AI Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTailorJob(job)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
                        style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                        title="AI Tailored Cover Letter"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Tailor</span>
                      </button>

                      <button
                        onClick={() => setPrepJob(job)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
                        style={{ background: 'rgba(251, 146, 60, 0.15)', color: 'var(--status-interview)', border: '1px solid rgba(251, 146, 60, 0.3)' }}
                        title="AI Interview Strategy & STAR Prep"
                      >
                        <Target className="h-3.5 w-3.5" />
                        <span>Prep</span>
                      </button>

                      <button
                        onClick={() => setResumeJob(job)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
                        style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                        title="Generate Role-Tailored ATS Resume (LaTeX)"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Resume</span>
                      </button>

                      <button
                        onClick={() => setEmailJob(job)}
                        className="p-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary transition-all cursor-pointer hover:bg-surface-raised border"
                        style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                        title="Draft Follow-up Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Inline Custom Status Dropdown */}
                    <StatusSelectDropdown
                      status={job.status}
                      onChange={async (targetStatus) => {
                        if (job.id) {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const updatedHistory = [...(job.statusHistory || [])];
                          updatedHistory.push({
                            status: targetStatus,
                            date: new Date().toISOString(),
                          });
                          await db.jobs.update(job.id, {
                            status: targetStatus,
                            lastStatusChange: todayStr,
                            statusHistory: updatedHistory,
                          });
                        }
                      }}
                    />

                    {/* Open Link, Edit & Delete */}
                    <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      {job.link && (
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-surface-raised rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                          title="Open original job posting"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEditClick(job)}
                        className="p-2 hover:bg-surface-raised rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        title="Edit Application"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmJob(job)}
                        className="p-2 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors cursor-pointer"
                        title="Delete Application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Detail Modal */}
      <JobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        jobToEdit={selectedJob || undefined} 
      />

      {/* AI Tailor Modal */}
      {tailorJob && (
        <AITailorModal
          isOpen={Boolean(tailorJob)}
          onClose={() => setTailorJob(null)}
          job={tailorJob}
        />
      )}

      {/* AI Interview Prep Modal */}
      {prepJob && (
        <InterviewPrepModal
          isOpen={Boolean(prepJob)}
          onClose={() => setPrepJob(null)}
          job={prepJob}
        />
      )}

      {/* Tailored ATS Resume Modal */}
      {resumeJob && (
        <TailoredResumeModal
          isOpen={Boolean(resumeJob)}
          onClose={() => setResumeJob(null)}
          job={resumeJob}
        />
      )}

      {/* Smart Email Composer Modal */}
      {emailJob && (
        <EmailGeneratorModal
          isOpen={Boolean(emailJob)}
          onClose={() => setEmailJob(null)}
          job={emailJob}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmJob)}
        title="Delete Application"
        message={`Are you sure you want to delete ${deleteConfirmJob?.role} at ${deleteConfirmJob?.company}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={async () => {
          if (deleteConfirmJob?.id) {
            await db.jobs.delete(deleteConfirmJob.id);
          }
          setDeleteConfirmJob(null);
        }}
        onCancel={() => setDeleteConfirmJob(null)}
      />
    </div>
  );
};
