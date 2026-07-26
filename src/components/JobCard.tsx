import React from 'react';
import type { JobApplication } from '../db/schema';
import { formatDate, checkNeedsFollowUp } from '../utils/helpers';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  GripVertical,
  Clock
} from 'lucide-react';

interface JobCardProps {
  job: JobApplication;
  onEditClick: (job: JobApplication) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Wishlist': return '#F59E0B';
    case 'Applied': return '#3B82F6';
    case 'OA/Assessment': return '#8B5CF6';
    case 'Interview': return '#F97316';
    case 'Offer': return '#10B981';
    case 'Rejected': return '#EF4444';
    case 'Withdrawn': return '#64748B';
    default: return '#64748B';
  }
};

const getSourceBadgeStyle = (source?: string) => {
  if (!source) return { bg: 'var(--bg-surface-raised)', text: 'var(--text-muted)' };
  const s = source.toLowerCase();
  if (s.includes('linkedin')) return { bg: 'rgba(10, 102, 194, 0.12)', text: '#0A66C2' };
  if (s.includes('indeed')) return { bg: 'rgba(33, 100, 243, 0.12)', text: '#2164F3' };
  if (s.includes('naukri')) return { bg: 'rgba(255, 117, 85, 0.12)', text: '#FF7555' };
  if (s.includes('glassdoor')) return { bg: 'rgba(12, 128, 64, 0.12)', text: '#0C8040' };
  if (s.includes('internshala')) return { bg: 'rgba(0, 139, 220, 0.12)', text: '#008BDC' };
  return { bg: 'var(--bg-surface-raised)', text: 'var(--accent-cool)' };
};

export const JobCard: React.FC<JobCardProps> = ({ job, onEditClick }) => {
  const needsFollowUp = checkNeedsFollowUp(job, job.reminderDays || 14);
  const statusColor = getStatusColor(job.status);
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
      className="canva-card p-4 cursor-grab active:cursor-grabbing select-none relative flex flex-col justify-between space-y-3.5 shadow-xs group overflow-hidden shrink-0"
    >
      {/* Top row: Avatar + Role + Drag handle */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Company Avatar Emblem */}
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none text-white shadow-xs"
            style={{ 
              background: `linear-gradient(135deg, ${statusColor} 0%, #1D4ED8 100%)`,
            }}
          >
            {(job.company && job.company.length > 0) ? job.company.charAt(0).toUpperCase() : 'J'}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-extrabold text-text-primary group-hover:text-cool transition-colors line-clamp-1 font-display">
              {job.role}
            </h4>
            <div className="flex items-center space-x-1 text-[11px] text-text-muted mt-0.5">
              <Building className="h-3 w-3 shrink-0 opacity-70" />
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
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[9px] font-extrabold border animate-pulse"
          style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-signal)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
        >
          <Clock className="h-3 w-3 shrink-0" />
          <span>Follow Up Recommended</span>
        </div>
      )}

      {/* Location & Salary details */}
      <div className="space-y-1.5 text-[10px] text-text-muted">
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
              className="text-[9px] px-2 py-0.5 rounded-lg font-bold border"
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
              className="text-[9px] px-1.5 py-0.5 rounded-lg font-bold"
              style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-muted)' }}
            >
              +{job.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Date Applied & Channel indicators */}
      <div className="border-t pt-2.5 flex items-center justify-between text-[9px]" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-1 text-text-muted font-medium">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(job.dateApplied)}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {job.sourceSite && (
            <span 
              className="px-2 py-0.5 rounded-md text-[8px] font-extrabold tracking-wide border"
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
    </div>
  );
};
