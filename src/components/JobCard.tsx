import React from 'react';
import type { JobApplication } from '../db/schema';
import { formatDate, checkNeedsFollowUp } from '../utils/helpers';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink
} from 'lucide-react';

interface JobCardProps {
  job: JobApplication;
  onEditClick: (job: JobApplication) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Wishlist': return '#8892A6';
    case 'Applied': return '#5B8CFF';
    case 'OA/Assessment': return '#C084FC';
    case 'Interview': return '#FB923C';
    case 'Offer': return '#4ADE80';
    case 'Rejected': return '#F26B6B';
    case 'Withdrawn': return '#94A3B8';
    default: return '#8892A6';
  }
};

export const JobCard: React.FC<JobCardProps> = ({ job, onEditClick }) => {
  const needsFollowUp = checkNeedsFollowUp(job, job.reminderDays || 14);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', job.id?.toString() || '');
    e.dataTransfer.effectAllowed = 'move';
    const cardEl = e.currentTarget as HTMLElement;
    cardEl.classList.add('opacity-30');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const cardEl = e.currentTarget as HTMLElement;
    cardEl.classList.remove('opacity-30');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEditClick(job)}
      className="bg-surface border border-white/[0.04] rounded-xl p-4 cursor-grab active:cursor-grabbing select-none relative flex flex-col justify-between space-y-3 shadow-sm group transition-all duration-150 ease-out hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/50 hover:border-white/[0.08]"
    >
      {/* Left-edge status indicator bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors duration-150" 
        style={{ backgroundColor: getStatusColor(job.status) }}
      />

      {/* Follow-up overdue: small amber dot with pulse */}
      {needsFollowUp && (
        <div className="absolute top-3.5 right-3.5 flex items-center" title="Follow-up overdue">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75 journey-rail-pulse"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
          </span>
        </div>
      )}

      {/* Role & Company info */}
      <div className="pl-1">
        <div className="pr-6">
          <h4 className="text-xs font-bold text-text-primary group-hover:text-cool transition-colors line-clamp-1">
            {job.role}
          </h4>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-text-muted mt-1">
          <Building className="h-3 w-3" />
          <span className="font-semibold text-text-muted/95 line-clamp-1">{job.company}</span>
        </div>
      </div>

      {/* Location & Salary details */}
      <div className="space-y-1.5 text-[10px] text-text-muted pl-1">
        <div className="flex items-center space-x-1.5">
          <MapPin className="h-3 w-3" />
          <span>{job.location}</span>
        </div>
        {job.salary && job.salary !== 'Not Specified' && (
          <div className="flex items-center space-x-1.5 text-text-primary font-medium">
            <DollarSign className="h-3 w-3 text-success/90" />
            <span className="text-success">{job.salary}</span>
          </div>
        )}
      </div>

      {/* Tag pills */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-1">
          {job.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-2 py-0.5 rounded font-bold bg-white/5 text-text-muted border border-white/[0.04]"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 2 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-void text-text-muted">
              +{job.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Date Applied & Channel indicators */}
      <div className="border-t border-white/[0.04] pt-2.5 flex items-center justify-between text-[9px] pl-1">
        <div className="flex items-center space-x-1 text-text-muted">
          <Calendar className="h-2.5 w-2.5" />
          <span>Applied: {formatDate(job.dateApplied)}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {job.sourceSite && (
            <span className="px-1.5 py-0.5 rounded bg-void text-[8px] font-bold text-text-muted border border-white/[0.04]">
              {job.sourceSite}
            </span>
          )}
          {job.link && (
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-text-muted hover:text-text-primary p-0.5 rounded hover:bg-surface-raised"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
