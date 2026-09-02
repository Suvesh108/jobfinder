import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { parseJobUrl } from '../utils/helpers';
import { useUIStore } from '../store/useUIStore';
import { X, Globe, Plus, Trash2, Calendar, DollarSign, MapPin, Link2, Tag, Clock, Building2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { StatusSelectDropdown } from './CustomDropdown';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit?: Partial<JobApplication>;
}

const AVAILABLE_STATUSES: JobStatus[] = [
  'Wishlist',
  'Applied',
  'OA/Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

const COMMON_TAGS = ['referral', 'cold apply', 'high priority', 'remote', 'hybrid', 'product-based', 'service-based'];

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Wishlist': return '#64748B';
    case 'Applied': return '#6366F1';
    case 'OA/Assessment': return '#A855F7';
    case 'Interview': return '#FB923C';
    case 'Offer': return '#10B981';
    case 'Rejected': return '#EF4444';
    case 'Withdrawn': return '#64748B';
    default: return '#6366F1';
  }
};

const sanitizeDate = (dateStr?: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    // fallback
  }
  return new Date().toISOString().split('T')[0];
};

const formatTimelineDate = (dateVal?: string): string => {
  if (!dateVal) return 'Date not specified';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Date not specified';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Date not specified';
  }
};

export const JobModal: React.FC<JobModalProps> = ({ isOpen, onClose, jobToEdit }) => {
  const defaultReminderDays = useUIStore(state => state.defaultReminderDays);
  
  // URL Input for parsing
  const [urlInput, setUrlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form Fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [sourceSite, setSourceSite] = useState('');
  const [link, setLink] = useState('');
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<JobStatus>('Wishlist');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Optional Contacts
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [reminderDays, setReminderDays] = useState<number>(defaultReminderDays);

  useEffect(() => {
    if (jobToEdit) {
      setCompany(jobToEdit.company || '');
      setRole(jobToEdit.role || '');
      setLocation(jobToEdit.location || '');
      setSalary(jobToEdit.salary || '');
      setSourceSite(jobToEdit.sourceSite || '');
      setLink(jobToEdit.link || '');
      setDateApplied(sanitizeDate(jobToEdit.dateApplied));
      setStatus(jobToEdit.status && AVAILABLE_STATUSES.includes(jobToEdit.status) ? jobToEdit.status : 'Wishlist');
      setNotes(jobToEdit.notes || '');
      setTags(Array.isArray(jobToEdit.tags) ? jobToEdit.tags.filter(Boolean) : []);
      setContactName(jobToEdit.contactName || '');
      setContactEmail(jobToEdit.contactEmail || '');
      setContactPhone(jobToEdit.contactPhone || '');
      setReminderDays(jobToEdit.reminderDays || defaultReminderDays);
      setUrlInput(jobToEdit.link || '');
      setParseMessage(null);
    } else {
      setCompany('');
      setRole('');
      setLocation('');
      setSalary('');
      setSourceSite('');
      setLink('');
      setDateApplied(new Date().toISOString().split('T')[0]);
      setStatus('Wishlist');
      setNotes('');
      setTags([]);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setReminderDays(defaultReminderDays);
      setUrlInput('');
      setParseMessage(null);
    }
  }, [jobToEdit, isOpen, defaultReminderDays]);

  if (!isOpen) return null;

  const handleParseUrl = () => {
    if (!urlInput.trim()) {
      setParseMessage({ type: 'error', text: 'Please paste a valid URL first' });
      return;
    }

    setIsParsing(true);
    setParseMessage(null);

    setTimeout(() => {
      try {
        const parsed = parseJobUrl(urlInput.trim());
        setCompany(parsed.company);
        setRole(parsed.role);
        setSourceSite(parsed.sourceSite);
        setLink(parsed.link);
        
        setParseMessage({ 
          type: 'success', 
          text: `Auto-filled details from ${parsed.sourceSite}! Please review.` 
        });
      } catch (err) {
        setParseMessage({ type: 'error', text: 'Failed to extract info. Manual input remains available.' });
      } finally {
        setIsParsing(false);
      }
    }, 600);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company.trim() || !role.trim()) {
      alert('Company and Role are required!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const jobData: Omit<JobApplication, 'id'> & { id?: number } = {
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || 'Remote',
      salary: salary.trim() || 'Not Specified',
      sourceSite: sourceSite.trim() || 'Direct Apply',
      dateApplied,
      lastStatusChange: todayStr,
      status,
      statusHistory: [],
      link: link.trim(),
      notes: notes.trim(),
      tags,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      reminderDays: Number(reminderDays) || defaultReminderDays,
    };

    if (jobToEdit) {
      const history = [...(jobToEdit.statusHistory || [])];
      
      if (jobToEdit.status !== status) {
        history.push({
          status: status,
          date: new Date().toISOString()
        });
        jobData.lastStatusChange = todayStr;
      }
      jobData.statusHistory = history;
      jobData.id = jobToEdit.id;

      await db.jobs.put(jobData as JobApplication);
    } else {
      jobData.statusHistory = [
        {
          status: status,
          date: new Date().toISOString()
        }
      ];
      await db.jobs.add(jobData as JobApplication);
    }

    onClose();
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (jobToEdit && jobToEdit.id) {
      await db.jobs.delete(jobToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div 
        className="card w-full max-w-3xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col border shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-bold font-display text-text-primary flex items-center space-x-2">
            <span>{jobToEdit ? 'Edit Application Details' : 'Add New Application'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            style={{ background: 'var(--bg-surface-raised)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Add from URL section */}
          {!jobToEdit && (
            <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-glow)' }}>
              <label className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Import from Live Job Link</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Paste Naukri, Indeed, LinkedIn, Internshala, or Glassdoor URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                />
                <button
                  type="button"
                  onClick={handleParseUrl}
                  disabled={isParsing}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {isParsing ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Extract Info</span>
                  )}
                </button>
              </div>
              {parseMessage && (
                <p className={`text-[11px] font-semibold ${parseMessage.type === 'success' ? 'text-success' : 'text-danger'}`}>
                  {parseMessage.text}
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column */}
            <div className="space-y-4">
              {/* Company */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Company *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zepto, Groww, TCS"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Job Role / Title *</label>
                <div className="relative">
                  <Plus className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. React Developer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Salary / CTC</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="e.g. 12 LPA"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Date Applied */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Date Applied</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="date"
                    value={dateApplied}
                    onChange={(e) => setDateApplied(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Pipeline Stage</label>
                <StatusSelectDropdown
                  status={status}
                  onChange={(newStatus: JobStatus) => setStatus(newStatus)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Source Site */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Source Site / Channel</label>
                <input
                  type="text"
                  placeholder="e.g. LinkedIn, Naukri, Direct Apply"
                  value={sourceSite}
                  onChange={(e) => setSourceSite(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              {/* Job Posting Link */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Posting URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="url"
                    placeholder="Paste original link..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="p-3 rounded-xl border space-y-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] font-bold text-text-muted block uppercase tracking-wider mb-1">Contact Person (Optional)</span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name / Recruiter"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      placeholder="Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Reminder Threshold */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                  Reminder threshold
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="w-20 border rounded-xl px-3 py-2 text-xs text-text-primary font-bold focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                  <span className="text-xs text-text-muted">Days without status updates</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Tags &amp; Categories</span>
              </label>
              
              <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 border rounded-xl" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}>
                {tags.map(t => (
                  <span 
                    key={t}
                    className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold"
                    style={{ background: 'var(--sidebar-item-active)', color: 'var(--accent-primary)', border: '1px solid var(--border-glow)' }}
                  >
                    <span>{t}</span>
                    <button 
                      type="button" 
                      onClick={() => removeTag(t)}
                      className="text-text-muted hover:text-danger font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-text-muted/50 select-none self-center pl-1">No tags added yet</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a tag and press Add..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTagInput))}
                  className="flex-1 border rounded-xl px-4 py-1.5 text-xs text-text-primary focus:outline-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                />
                <button
                  type="button"
                  onClick={() => addTag(newTagInput)}
                  className="btn-secondary text-xs px-4 py-1.5 rounded-xl font-semibold"
                >
                  Add Tag
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <span className="text-[9px] text-text-muted uppercase font-bold self-center mr-1">Quick Tags:</span>
                {COMMON_TAGS.filter(ct => !tags.includes(ct)).map(ct => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => addTag(ct)}
                    className="text-[10px] px-2 py-0.5 border rounded-md transition-colors cursor-pointer"
                    style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    + {ct}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Notes &amp; Next Steps</label>
              <textarea
                rows={3}
                placeholder="Interview rounds, prep notes, salary expectations, HR contacts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
          </form>

          {/* Status Timeline History Log */}
          {jobToEdit && (
            <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-display mb-4 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Application History Timeline</span>
              </h4>
              <div className="relative border-l ml-2 pl-4 py-1 space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
                {jobToEdit.statusHistory && jobToEdit.statusHistory.length > 0 ? (
                  jobToEdit.statusHistory.filter(h => Boolean(h && h.status)).map((h, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot with color coding matching status color */}
                      <span 
                        className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full transition-all duration-300"
                        style={{ backgroundColor: getStatusColor(h.status), boxShadow: '0 0 0 4px var(--bg-card)' }}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-medium text-text-primary">
                          Moved to <span className="font-bold" style={{ color: getStatusColor(h.status) }}>{h.status}</span>
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {formatTimelineDate(h.date)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted italic">No status changes recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div>
            {jobToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-secondary text-xs px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5"
                style={{ color: 'var(--status-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-5 py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary text-xs px-6 py-2 rounded-xl font-bold"
            >
              {jobToEdit ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Application?"
        message={`Are you sure you want to delete "${jobToEdit?.role || 'this role'} at ${jobToEdit?.company || 'this company'}"? This action cannot be undone.`}
        confirmText="Delete Application"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>,
    document.body
  );
};

