import React from 'react';
import type { JobApplication } from '../db/schema';
import { formatDate, checkNeedsFollowUp } from '../utils/helpers';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  GripVertical,
  Clock,
  Sparkles,
  Target,
  FileText,
  Mail
} from 'lucide-react';

interface JobCardProps {
  job: JobApplication;
  onEditClick: (job: JobApplication) => void;
  onAITailorClick?: (job: JobApplication) => void;
  onPrepClick?: (job: JobApplication) => void;
  onResumeClick?: (job: JobApplication) => void;
  onEmailClick?: (job: JobApplication) => void;
}

const getMonogramGradient = (status: string): string => {
  switch (status) {
    case 'Offer': return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    case 'Interview': return 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)';
    case 'OA/Assessment': return 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)';
    case 'Applied': return 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)';
    case 'Wishlist': return 'linear-gradient(135deg, #64748B 0%, #334155 100%)';
    case 'Rejected': return 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)';
    case 'Withdrawn': return 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
    default: return 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)';
  }
};

const getSourceBadgeStyle = (source?: string) => {
  if (!source) return { bg: 'var(--bg-surface-raised)', text: 'var(--text-muted)' };
  const s = source.toLowerCase();
  if (s.includes('linkedin')) return { bg: 'rgba(10, 102, 194, 0.15)', text: '#0A66C2' };
  if (s.includes('indeed')) return { bg: 'rgba(33, 100, 243, 0.15)', text: '#38BDF8' };
  if (s.includes('naukri')) return { bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C' };
  if (s.includes('glassdoor')) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
  if (s.includes('ziprecruiter') || s.includes('zip_recruiter')) return { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1' };
  return { bg: 'var(--bg-surface-raised)', text: 'var(--accent-cool)' };
};

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onEditClick,
  onAITailorClick,
  onPrepClick,
  onResumeClick,
  onEmailClick 
}) => {
  const needsFollowUp = checkNeedsFollowUp(job, job.reminderDays || 14);
  const sourceStyle = getSourceBadgeStyle(job.sourceSite);
  const isDraggingRef = React.useRef(false);

  const handleDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData('text/plain', job.id?.toString() || '');
    e.dataTransfer.effectAllowed = 'move';
    const cardEl = e.currentTarget as HTMLElement;
    cardEl.classList.add('opacity-40', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const cardEl = e.currentTarget as HTMLElement;
    cardEl.classList.remove('opacity-40', 'scale-95');
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleCardClick = () => {
    if (isDraggingRef.current) return;
    onEditClick(job);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className="card p-4 cursor-grab active:cursor-grabbing select-none relative flex flex-col justify-between space-y-3.5 group overflow-hidden shrink-0 transition-all duration-200 hover:border-indigo-500/40"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Top row: Avatar + Role + Drag handle */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Company Avatar Emblem */}
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none text-white shadow-xs"
            style={{ 
              background: getMonogramGradient(job.status), color: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            {(job.company && job.company.length > 0) ? job.company.charAt(0).toUpperCase() : 'J'}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1 font-display">
              {job.role}
            </h4>
            <div className="flex items-center space-x-1 text-[11px] text-text-muted mt-0.5">
              <Building2 className="h-3 w-3 shrink-0 opacity-70" />
              <span className="font-semibold text-text-secondary line-clamp-1">{job.company}</span>
            </div>
          </div>
        </div>

        {/* Drag handle icon */}
        <div className="text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0 pt-0.5">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      {/* Follow up alert banner if overdue */}
      {needsFollowUp && (
        <div 
          className="flex items-center justify-between px-2.5 py-1 rounded-lg text-[9px] font-bold border"
          style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-signal)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
        >
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Follow-up recommended</span>
          </div>
          {onEmailClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEmailClick(job);
              }}
              className="text-primary hover:underline flex items-center space-x-0.5 cursor-pointer font-bold"
            >
              <span>Draft</span>
            </button>
          )}
        </div>
      )}

      {/* Location & Salary details */}
      <div className="space-y-1.5 text-[11px] text-text-muted">
        <div className="flex items-center space-x-1.5">
          <MapPin className="h-3 w-3 shrink-0 text-text-muted" />
          <span className="line-clamp-1">{job.location}</span>
        </div>
        {job.salary && job.salary !== 'Not Specified' && (
          <div className="flex items-center space-x-1.5 font-bold" style={{ color: 'var(--status-success)' }}>
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>{job.salary}</span>
          </div>
        )}
      </div>

      {/* Tag pills */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-2 py-0.5 rounded-md font-semibold border"
              style={{
                background: 'var(--bg-surface-raised)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 2 && (
            <span 
              className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
              style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-muted)' }}
            >
              +{job.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Quick AI Action Bar (Enlarged & High-Legibility) */}
      <div className="flex items-center justify-between pt-1.5 border-t border-dashed" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-1.5">
          {onAITailorClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAITailorClick(job);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              title="AI Tailor Cover Letter"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tailor</span>
            </button>
          )}

          {onPrepClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrepClick(job);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
              style={{ background: 'rgba(251, 146, 60, 0.15)', color: 'var(--status-interview)', border: '1px solid rgba(251, 146, 60, 0.3)' }}
              title="AI Interview Strategy & STAR Prep"
            >
              <Target className="h-3.5 w-3.5" />
              <span>Prep</span>
            </button>
          )}

          {onResumeClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResumeClick(job);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
              style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.3)' }}
              title="Generate Role-Tailored ATS Resume (LaTeX)"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Resume</span>
            </button>
          )}

          {onEmailClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEmailClick(job);
              }}
              className="p-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary transition-all cursor-pointer hover:bg-surface-raised border"
              style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
              title="Draft Follow-up Email"
            >
              <Mail className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center space-x-1 text-text-muted text-[10px] font-medium">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(job.dateApplied)}</span>
        </div>
      </div>

      {/* Channel indicator & Link */}
      <div className="border-t pt-2 flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>
        {job.sourceSite && (
          <span 
            className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide border"
            style={{
              background: sourceStyle.bg,
              color: sourceStyle.text,
              borderColor: 'var(--border-subtle)',
            }}
          >
            {job.sourceSite}
          </span>
        )}
        {job.link && (
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md transition-colors hover:bg-surface-raised"
            style={{ color: 'var(--text-muted)' }}
            title="Open Original Job Listing"
          >
            <ExternalLink className="h-3 w-3 hover:scale-110 transition-transform" />
          </a>
        )}
      </div>
    </div>
  );
};


