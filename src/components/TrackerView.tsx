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
  Globe
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

const STATUS_THEMES: Record<JobStatus, { bg: string; text: string; border: string; accent: string }> = {
  'Wishlist': { bg: 'rgba(136, 146, 166, 0.08)', text: '#8892A6', border: 'rgba(136, 146, 166, 0.15)', accent: '#8892A6' },
  'Applied': { bg: 'rgba(91, 140, 255, 0.08)', text: '#5B8CFF', border: 'rgba(91, 140, 255, 0.15)', accent: '#5B8CFF' },
  'OA/Assessment': { bg: 'rgba(192, 132, 252, 0.08)', text: '#C084FC', border: 'rgba(192, 132, 252, 0.15)', accent: '#C084FC' },
  'Interview': { bg: 'rgba(251, 146, 60, 0.08)', text: '#FB923C', border: 'rgba(251, 146, 60, 0.15)', accent: '#FB923C' },
  'Offer': { bg: 'rgba(74, 222, 128, 0.08)', text: '#4ADE80', border: 'rgba(74, 222, 128, 0.15)', accent: '#4ADE80' },
  'Rejected': { bg: 'rgba(242, 107, 107, 0.08)', text: '#F26B6B', border: 'rgba(242, 107, 107, 0.15)', accent: '#F26B6B' },
  'Withdrawn': { bg: 'rgba(148, 163, 184, 0.08)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.15)', accent: '#94A3B8' },
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
    return { totalApplied, interviews, offers, wishlist };
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
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0 border-b border-white/[0.04] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Campaign Tracker</h1>
          <p className="text-xs text-text-muted mt-1">
            Track and manage your target companies and active pipeline stages.
          </p>
        </div>
        
        {/* Actions bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddClick}
            className="bg-cool hover:bg-cool/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 active:scale-95 cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Application</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export to CSV"
            className="bg-surface hover:bg-surface-raised border border-white/[0.06] text-text-primary font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            title="Backup database to JSON"
            className="bg-surface hover:bg-surface-raised border border-white/[0.06] text-text-primary font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-cool" />
            <span className="hidden sm:inline">Backup JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Restore from JSON Backup"
            className="bg-surface hover:bg-surface-raised border border-white/[0.06] text-text-primary font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import Backup</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Mini Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-surface border border-white/[0.04] p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm hover:border-cool/20 hover:shadow-[0_8px_20px_-8px_rgba(91,140,255,0.15)] transition-all duration-300 group">
          <div className="p-2 bg-cool/10 rounded-xl">
            <Briefcase className="h-5 w-5 text-cool group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase block">Active Pipeline</span>
            <span className="text-xl font-extrabold text-text-primary tabular-nums">{stats.totalApplied}</span>
          </div>
        </div>

        <div className="bg-surface border border-white/[0.04] p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm hover:border-amber-500/20 hover:shadow-[0_8px_20px_-8px_rgba(242,184,75,0.15)] transition-all duration-300 group">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Calendar className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase block">Interviews</span>
            <span className="text-xl font-extrabold text-text-primary tabular-nums">{stats.interviews}</span>
          </div>
        </div>

        <div className="bg-surface border border-white/[0.04] p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm hover:border-green-500/20 hover:shadow-[0_8px_20px_-8px_rgba(74,222,128,0.15)] transition-all duration-300 group">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Check className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase block">Offers</span>
            <span className="text-xl font-extrabold text-text-primary tabular-nums">{stats.offers}</span>
          </div>
        </div>

        <div className="bg-surface border border-white/[0.04] p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm hover:border-slate-500/20 hover:shadow-[0_8px_20px_-8px_rgba(148,163,184,0.15)] transition-all duration-300 group">
          <div className="p-2 bg-slate-500/10 rounded-xl">
            <Tag className="h-5 w-5 text-text-muted group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase block">Wishlist</span>
            <span className="text-xl font-extrabold text-text-primary tabular-nums">{stats.wishlist}</span>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-white/[0.05] rounded-2xl p-4 shrink-0 space-y-3 shadow-inner">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-text-muted" />
            <input 
              type="text"
              placeholder="Search company or role..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full bg-void border border-white/[0.04] rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-cool transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={filters.source}
              onChange={(e) => setFilters({ source: e.target.value })}
              className="w-full bg-void border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors cursor-pointer font-medium"
            >
              <option value="all">All Channels</option>
              {uniqueSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={filters.tag}
              onChange={(e) => setFilters({ tag: e.target.value })}
              className="w-full bg-void border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors cursor-pointer font-medium"
            >
              <option value="all">All Tags</option>
              {uniqueTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={dateOption}
              onChange={(e) => setDateOption(e.target.value)}
              className="w-full bg-void border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors cursor-pointer font-medium"
              style={{
                borderColor: dateOption !== 'all' ? 'rgba(91,140,255,0.3)' : 'rgba(255,255,255,0.04)',
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

        {isFiltered && (
          <div className="flex items-center justify-between text-xs border-t border-white/[0.03] pt-2.5">
            <span className="text-cool font-semibold">
              Filter results: {filteredJobs.length} of {jobs.length} applications matched
            </span>
            <button
              onClick={() => {
                resetFilters();
                setDateOption('all');
              }}
              className="text-danger hover:text-text-primary flex items-center space-x-1 font-bold transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Redesigned Premium Cards List View */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-white/[0.04] rounded-2xl p-12 text-center bg-surface/10 select-none">
            <AlertCircle className="h-7 w-7 text-text-muted/30 mb-3" />
            <p className="text-xs font-semibold text-text-primary/70">No applications matched your filter query.</p>
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
                className="bg-surface border-r border-y border-white/[0.03] rounded-r-2xl rounded-l-md p-5 hover:border-cool/25 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 relative group"
                style={{ 
                  borderLeft: `4px solid ${theme.accent}`,
                  boxShadow: `inset 4px 0 0 -3px ${theme.accent}`
                }}
              >
                {/* Left Details */}
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  {/* Status symbol indicator circle */}
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none border"
                    style={{ 
                      backgroundColor: theme.bg, 
                      color: theme.text,
                      borderColor: theme.border
                    }}
                  >
                    {job.company.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 
                        onClick={() => handleEditClick(job)}
                        className="text-sm font-bold text-text-primary hover:text-cool cursor-pointer transition-colors font-display"
                      >
                        {job.role}
                      </h4>
                      <span className="text-[10px] font-extrabold text-text-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg select-none">
                        {job.company}
                      </span>
                    </div>

                    {/* Geolocation, Channel & Salary */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1 select-none">
                        <MapPin className="h-3.5 w-3.5 text-text-muted/60" />
                        <span>{job.location}</span>
                      </span>
                      <span className="hidden sm:inline text-white/10">•</span>
                      <span className="flex items-center gap-1 select-none">
                        <Globe className="h-3.5 w-3.5 text-text-muted/60" />
                        <span>{job.sourceSite}</span>
                      </span>
                      {job.salary && job.salary !== 'Not Specified' && (
                        <>
                          <span className="hidden sm:inline text-white/10">•</span>
                          <span className="text-success font-semibold">{job.salary}</span>
                        </>
                      )}
                    </div>

                    {/* Tags Chips & Stale Warning */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 select-none">
                      {isStale && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse flex items-center space-x-1">
                          <AlertCircle className="h-2.5 w-2.5" />
                          <span>Follow Up Required</span>
                        </span>
                      )}
                      {job.tags && job.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/[0.03] text-text-muted border border-white/[0.05] flex items-center space-x-1"
                        >
                          <Tag className="h-2 w-2" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Selector & Actions */}
                <div className="shrink-0 flex flex-row items-center gap-5 justify-between md:justify-end border-t border-white/[0.03] pt-4 md:pt-0 md:border-0">
                  {/* Status Dropdown selector */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider select-none">Pipeline Stage</label>
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
                      className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cool font-extrabold cursor-pointer transition-all duration-200 select-none shadow-sm"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        borderColor: theme.border
                      }}
                    >
                      {COLUMNS.map((st) => (
                        <option key={st} value={st} className="bg-surface-raised text-text-primary">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Applied details */}
                  <div className="flex flex-col gap-0.5 text-right hidden lg:flex select-none">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Date Tracked</span>
                    <span className="text-xs font-semibold text-text-primary/80 flex items-center space-x-1 justify-end">
                      <Calendar className="h-3.5 w-3.5 text-text-muted/60" />
                      <span className="tabular-nums">{job.dateApplied}</span>
                    </span>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-1.5 ml-2 border-l border-white/[0.04] pl-4 self-stretch">
                    {/* View external link if available */}
                    {job.link && (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/5 rounded-xl text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        title="Open job description link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEditClick(job)}
                      className="p-2 hover:bg-white/5 rounded-xl text-text-muted hover:text-text-primary transition-colors cursor-pointer"
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

      {/* Premium custom delete confirmation dialog overlay */}
      {deleteConfirmJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-surface-raised border border-white/[0.08] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
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
                className="px-4 py-2.5 bg-void hover:bg-white/5 border border-white/[0.04] text-text-primary font-semibold text-xs rounded-xl transition-all cursor-pointer"
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

    </div>
  );
};
