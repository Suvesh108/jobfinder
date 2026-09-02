import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { JobStatus } from '../db/schema';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  color?: string;
}

interface CustomDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  align?: 'left' | 'right';
}

export function CustomDropdown<T = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
  size = 'md',
  icon,
  align = 'left',
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs rounded-lg',
    md: 'px-3 py-1.5 text-xs rounded-xl',
    lg: 'px-4 py-2.5 text-sm rounded-xl',
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border flex items-center justify-between space-x-2 transition-all cursor-pointer font-medium select-none ${sizeClasses} ${
          isOpen ? 'ring-1 ring-primary border-primary' : 'hover:border-slate-500/50'
        } ${buttonClassName}`}
        style={{
          background: 'var(--bg-input)',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center space-x-2 truncate">
          {icon && <span className="text-text-muted shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute z-[9999] mt-1.5 min-w-[180px] w-full max-h-60 overflow-y-auto rounded-xl border shadow-2xl p-1.5 space-y-0.5 animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{
            background: 'var(--bg-surface-raised)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.45)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between space-x-2 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
                style={{
                  background: isSelected ? 'var(--sidebar-item-active)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <div className="flex items-center space-x-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  {opt.color && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Status Pipeline Custom Dropdown ──────────────────────────────────────────
const STATUS_THEMES: Record<JobStatus, { bg: string; text: string; border: string; accent: string }> = {
  Wishlist:        { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.25)', accent: '#94A3B8' },
  Applied:         { bg: 'rgba(56, 189, 248, 0.12)',  text: '#38BDF8', border: 'rgba(56, 189, 248, 0.25)',  accent: '#38BDF8' },
  'OA/Assessment': { bg: 'rgba(168, 85, 247, 0.12)',  text: '#C084FC', border: 'rgba(168, 85, 247, 0.25)',  accent: '#A855F7' },
  Interview:       { bg: 'rgba(251, 146, 60, 0.12)',  text: '#FB923C', border: 'rgba(251, 146, 60, 0.25)',  accent: '#FB923C' },
  Offer:           { bg: 'rgba(52, 211, 153, 0.12)',  text: '#34D399', border: 'rgba(52, 211, 153, 0.25)',  accent: '#10B981' },
  Rejected:        { bg: 'rgba(248, 113, 113, 0.12)', text: '#F87171', border: 'rgba(248, 113, 113, 0.25)', accent: '#EF4444' },
  Withdrawn:       { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B', border: 'rgba(100, 116, 139, 0.25)', accent: '#64748B' },
};

const ALL_STAGES: JobStatus[] = [
  'Wishlist',
  'Applied',
  'OA/Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

interface StatusSelectDropdownProps {
  status: JobStatus;
  onChange: (status: JobStatus) => void;
  className?: string;
}

export const StatusSelectDropdown: React.FC<StatusSelectDropdownProps> = ({
  status,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTheme = STATUS_THEMES[status] || STATUS_THEMES.Wishlist;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        style={{
          background: currentTheme.bg,
          color: currentTheme.text,
          borderColor: isOpen ? currentTheme.accent : currentTheme.border,
        }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.accent }} />
        <span>{status}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 opacity-75 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Status Menu */}
      {isOpen && (
        <div
          className="absolute z-[9999] mt-1.5 right-0 min-w-[160px] rounded-xl border shadow-2xl p-1.5 space-y-1 animate-fade-in"
          style={{
            background: 'var(--bg-surface-raised)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.5)',
          }}
        >
          {ALL_STAGES.map((st) => {
            const stTheme = STATUS_THEMES[st];
            const isSelected = st === status;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  onChange(st);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between space-x-2 transition-all cursor-pointer ${
                  isSelected ? 'shadow-xs' : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
                style={{
                  background: isSelected ? stTheme.bg : 'transparent',
                  color: stTheme.text,
                  border: isSelected ? `1px solid ${stTheme.border}` : '1px solid transparent',
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stTheme.accent }} />
                  <span>{st}</span>
                </div>
                {isSelected && <Check size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
