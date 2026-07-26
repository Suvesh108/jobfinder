import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { useUIStore } from '../store/useUIStore';
import { JobModal } from './JobModal';
import { exportToCSV } from '../utils/helpers';
import { 
  Plus, 
  Download, 
  Upload, 
  Search, 
  X, 
  AlertCircle,
  Calendar,
  MapPin,
  Briefcase,
  ExternalLink,
  Edit2,
  Trash2,
  Tag,
  Check,
  Globe,
  TrendingUp,
  KanbanSquare
} from 'lucide-react';

const COLUMNS: JobStatus[] = [
  'Wishlist',
  'Applied',
  'OA/Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

const STATUS_THEMES: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Wishlist: { bg: 'rgba(136, 146, 166, 0.12)', text: '#8892A6', border: 'rgba(136, 146, 166, 0.3)', accent: '#8892A6' },
  Applied: { bg: 'rgba(91, 140, 255, 0.12)', text: '#5B8CFF', border: 'rgba(91, 140, 255, 0.3)', accent: '#5B8CFF' },
  'OA/Assessment': { bg: 'rgba(192, 132, 252, 0.12)', text: '#C084FC', border: 'rgba(192, 132, 252, 0.3)', accent: '#C084FC' },
  Interview: { bg: 'rgba(251, 146, 60, 0.12)', text: '#FB923C', border: 'rgba(251, 146, 60, 0.3)', accent: '#FB923C' },
  Offer: { bg: 'rgba(74, 222, 128, 0.12)', text: '#4ADE80', border: 'rgba(74, 222, 128, 0.3)', accent: '#4ADE80' },
  Rejected: { bg: 'rgba(242, 107, 107, 0.12)', text: '#F26B6B', border: 'rgba(242, 107, 107, 0.3)', accent: '#F26B6B' },
  Withdrawn: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)', accent: '#94A3B8' },
};

export const TrackerView: React.FC = () => {
  const { filters, setFilters, resetFilters, defaultReminderDays } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | undefined>(undefined);
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<JobApplication | null>(null);
  const [dateOption, setDateOption] = useState('all');

  // Fetch all jobs from Dexie
  const jobs = useLiveQuery(() => db.jobs.toArray()) || [];

  // Extract unique tags and sources for filters
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    jobs.forEach(job => job.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [jobs]);

  const uniqueSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    jobs.forEach(job => {
      if (job.sourceSite) sourcesSet.add(job.sourceSite);
    });
    return Array.from(sourcesSet);
  }, [jobs]);

  // Derived stats for the summary header bar
  const stats = useMemo(() => {
    const totalApplied = jobs.filter(j => j.status !== 'Wishlist' && j.status !== 'Withdrawn' && j.status !== 'Rejected').length;
    const interviews = jobs.filter(j => j.status === 'Interview').length;
    const offers = jobs.filter(j => j.status === 'Offer').length;
    const wishlist = jobs.filter(j => j.status === 'Wishlist').length;
    const conversionRate = totalApplied > 0 ? Math.round((interviews + offers) / totalApplied * 100) : 0;
    return { totalApplied, interviews, offers, wishlist, conversionRate };
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    const cutoffDate = (() => {
      if (dateOption === 'all') return null;
      const days = parseInt(dateOption, 10);
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    })();

    return jobs.filter(job => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const compMatch = job.company.toLowerCase().includes(query);
        const roleMatch = job.role.toLowerCase().includes(query);
        if (!compMatch && !roleMatch) return false;
      }
      if (filters.source !== 'all' && job.sourceSite !== filters.source) {
        return false;
      }
      if (filters.tag !== 'all' && !job.tags?.includes(filters.tag)) {
        return false;
      }
      if (cutoffDate && job.dateApplied < cutoffDate) {
        return false;
      }
      return true;
    });
  }, [jobs, filters, dateOption]);

  const handleAddClick = () => {
    setSelectedJob(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleExportJSON = () => {
    if (jobs.length === 0) {
      alert('No application data to export.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `jobfinder_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) {
      alert('No application data to export.');
      return;
    }
    const csvContent = exportToCSV(jobs);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `jobfinder_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = async (event) => {
      try {
        const importedJobs = JSON.parse(event.target?.result as string);
        if (!Array.isArray(importedJobs)) {
          alert('Invalid backup file. Must be a JSON array of applications.');
          return;
        }

        if (window.confirm(`Are you sure you want to import ${importedJobs.length} applications? This will merge with your current entries.`)) {
          for (const item of importedJobs) {
            await db.jobs.put(item);
          }
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Failed to parse backup file. Please ensure it is a valid JSON.');
      }
    };
    fileReader.readAsText(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const isFiltered = filters.search || filters.source !== 'all' || filters.tag !== 'all' || dateOption !== 'all';

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-title-group">
            <span
              className="page-eyebrow"
              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <KanbanSquare size={11} />
              Pipeline Tracker
            </span>
            <h1 className="page-title">Applications</h1>
            <p className="page-subtitle">Track every application — from wishlist to offer — in one place.</p>
          </div>
          <div className="page-actions">
            <button onClick={handleAddClick} className="btn-primary">
              <Plus size={15} />
              <span>Add Application</span>
            </button>
            <button onClick={handleExportCSV} className="btn-secondary" title="Export CSV">
              <Download size={14} style={{ color: 'var(--accent-emerald)' }} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={handleExportJSON} className="btn-secondary" title="Backup JSON">
              <Download size={14} style={{ color: 'var(--accent-cool)' }} />
              <span className="hidden sm:inline">Backup</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" title="Import JSON">
              <Upload size={14} style={{ color: 'var(--accent-purple)' }} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}><Briefcase size={16} /></div>
            <div className="stat-text"><span className="stat-value">{stats.totalApplied}</span><span className="stat-label">Active Apps</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}><Calendar size={16} /></div>
            <div className="stat-text"><span className="stat-value">{stats.interviews}</span><span className="stat-label">Interviews</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'linear-gradient(135deg,#22C55E,#15803D)' }}><Check size={16} /></div>
            <div className="stat-text"><span className="stat-value">{stats.offers}</span><span className="stat-label">Offers</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}><Tag size={16} /></div>
            <div className="stat-text"><span className="stat-value">{stats.wishlist}</span><span className="stat-label">Wishlist</span></div>
          </div>
          <div className="stat-card" style={{ gridColumn: 'span 1' }}>
            <div className="stat-icon-wrap" style={{ background: 'linear-gradient(135deg,#A855F7,#7C3AED)' }}><TrendingUp size={16} /></div>
            <div className="stat-text"><span className="stat-value">{stats.conversionRate}%</span><span className="stat-label">Int. Rate</span></div>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="filters-bar">
        <div className="filter-input-wrap">
          <Search size={13} className="filter-input-icon" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="filter-input"
          />
        </div>

        <select
          value={filters.source}
          onChange={(e) => setFilters({ source: e.target.value })}
          className="filter-select"
        >
          <option value="all">All Channels</option>
          {uniqueSources.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.tag}
          onChange={(e) => setFilters({ tag: e.target.value })}
          className="filter-select"
        >
          <option value="all">All Tags</option>
          {uniqueTags.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={dateOption}
          onChange={(e) => setDateOption(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Time</option>
          <option value="1">Last 24 Hours</option>
          <option value="3">Last 3 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
        {/* spacer */}
        <div style={{ flex: 1 }} />

        {isFiltered && (
          <button
            onClick={() => { resetFilters(); setDateOption('all'); }}
            className="filter-reset-btn"
          >
            <X size={12} />
            <span>{filteredJobs.length}/{jobs.length} matched · Reset</span>
          </button>
        )}
      </div>

      {/* ── HIGH-DENSITY TABLE LIST VIEW ── */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center select-none" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-raised)' }}>
            <AlertCircle className="h-8 w-8 text-text-muted/40 mb-3" />
            <p className="text-xs font-semibold text-text-primary">No applications matched your filter query.</p>
            <p className="text-[10px] text-text-muted mt-1">Try modifying your text filters or date range.</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const theme = STATUS_THEMES[job.status] || STATUS_THEMES['Wishlist'];
            const isStale = ['Offer', 'Rejected', 'Withdrawn'].includes(job.status) 
              ? false 
              : (() => {
                  const lastChange = new Date(job.lastStatusChange || job.dateApplied).getTime();
                  const diffDays = Math.floor((Date.now() - lastChange) / (1000 * 60 * 60 * 24));
                  return diffDays >= defaultReminderDays;
                })();
            
            return (
              <div
                key={job.id}
                className="fluent-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative group"
                style={{ 
                  borderLeft: `4px solid ${theme.accent}`,
                }}
              >
                {/* Left Details */}
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none border text-white shadow-xs"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.accent} 0%, #1D4ED8 100%)`,
                      borderColor: theme.border
                    }}
                  >
                    {(job.company && job.company.length > 0) ? job.company.charAt(0).toUpperCase() : 'J'}
                  </div>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 
                        onClick={() => handleEditClick(job)}
                        className="text-sm font-bold text-text-primary hover:text-cool cursor-pointer transition-colors font-display"
                      >
                        {job.role}
                      </h4>
                      <span 
                        className="text-[10px] font-extrabold border px-2 py-0.5 rounded-lg select-none"
                        style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                      >
                        {job.company}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1 select-none">
                        <MapPin className="h-3.5 w-3.5 text-text-muted" />
                        <span>{job.location}</span>
                      </span>
                      <span className="hidden sm:inline opacity-30">•</span>
                      <span className="flex items-center gap-1 select-none">
                        <Globe className="h-3.5 w-3.5 text-text-muted" />
                        <span>{job.sourceSite}</span>
                      </span>
                      {job.salary && job.salary !== 'Not Specified' && (
                        <>
                          <span className="hidden sm:inline opacity-30">•</span>
                          <span className="font-semibold text-success">{job.salary}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 select-none">
                      {isStale && (
                        <span 
                          className="text-[9px] font-extrabold px-2 py-0.5 rounded-lg border animate-pulse flex items-center space-x-1"
                          style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-signal)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        >
                          <AlertCircle className="h-2.5 w-2.5" />
                          <span>Follow Up Required</span>
                        </span>
                      )}
                      {job.tags && job.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center space-x-1"
                          style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                        >
                          <Tag className="h-2 w-2" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Selector & Actions */}
                <div className="shrink-0 flex flex-row items-center gap-5 justify-between md:justify-end border-t md:border-0 pt-4 md:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider select-none text-text-muted">Pipeline Stage</label>
                    <select
                      value={job.status}
                      onChange={async (e) => {
                        const targetStatus = e.target.value as JobStatus;
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
                      className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none font-extrabold cursor-pointer transition-all duration-200 select-none shadow-xs"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        borderColor: theme.border
                      }}
                    >
                      {COLUMNS.map((st) => (
                        <option key={st} value={st} style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-primary)' }}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5 text-right hidden lg:flex select-none">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Date Tracked</span>
                    <span className="text-xs font-semibold text-text-primary flex items-center space-x-1 justify-end">
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      <span className="tabular-nums">{job.dateApplied}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2 border-l pl-4 self-stretch" style={{ borderColor: 'var(--border-subtle)' }}>
                    {job.link && (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-surface-raised rounded-xl text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        title="Open job description link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEditClick(job)}
                      className="p-2 hover:bg-surface-raised rounded-xl text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      title="Edit Application"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmJob(job)}
                      className="p-2 hover:bg-danger/10 rounded-xl text-text-muted hover:text-danger transition-colors cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <JobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        jobToEdit={selectedJob} 
      />

      {/* Custom delete confirmation dialog overlay */}
      {deleteConfirmJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
          <div className="fluent-card rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-danger/10 text-danger rounded-xl shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text-primary font-display">Permanently Delete Application?</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Are you sure you want to remove the tracking pipeline entry for <span className="font-semibold text-text-primary">{deleteConfirmJob.role}</span> at <span className="font-semibold text-text-primary">{deleteConfirmJob.company}</span>? This action cannot be reversed.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmJob(null)}
                className="px-4 py-2.5 border text-text-primary font-semibold text-xs rounded-xl transition-all cursor-pointer"
                style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmJob.id) {
                    await db.jobs.delete(deleteConfirmJob.id);
                  }
                  setDeleteConfirmJob(null);
                }}
                className="px-4 py-2.5 bg-danger hover:bg-danger/90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
