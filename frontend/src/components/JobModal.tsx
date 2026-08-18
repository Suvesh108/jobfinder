import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, type JobApplication, type JobStatus } from '../db/schema';
import { parseJobUrl } from '../utils/helpers';
import { useUIStore } from '../store/useUIStore';
import { X, Globe, Plus, Trash2, Calendar, DollarSign, MapPin, Link2, Tag, User, Clock } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit?: JobApplication;
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

const COMMON_TAGS = ['referral', 'cold apply', 'high priority', 'wfh', 'remote', 'product-based', 'service-based'];

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
      setStatus(AVAILABLE_STATUSES.includes(jobToEdit.status) ? jobToEdit.status : 'Wishlist');
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 flex items-center justify-center p-4 backdrop-blur-md">
      <div 
        className="fluent-card w-full max-w-3xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col border shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-raised)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
        }}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-md font-bold font-display text-text-primary flex items-center space-x-2">
            <span>{jobToEdit ? 'Edit Campaign Card' : 'Initiate Job Tracking'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            style={{ background: 'var(--bg-surface)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Add from URL section */}
          {!jobToEdit && (
            <div className="p-4 bg-cool/5 rounded-xl border border-cool/10 space-y-3">
              <label className="text-[10px] font-bold text-cool uppercase tracking-wider flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Import from Live Posting Link</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Paste Naukri, Indeed, Apna, Internshala, or Wellfound link..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-void border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
                />
                <button
                  type="button"
                  onClick={handleParseUrl}
                  disabled={isParsing}
                  className="bg-cool hover:bg-cool/90 disabled:bg-cool/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-2 cursor-pointer shrink-0"
                >
                  {isParsing ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Extract Data</span>
                  )}
                </button>
              </div>
              {parseMessage && (
                <p className={`text-[10px] font-medium ${parseMessage.type === 'success' ? 'text-success' : 'text-danger'}`}>
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
                  <User className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zepto, Groww, TCS"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-void border border-white/[0.05] rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Job Title / Role *</label>
                <div className="relative">
                  <Plus className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. React Developer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-void border border-white/[0.05] rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
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
                    className="w-full bg-void border border-white/[0.05] rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
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
                    className="w-full bg-void border border-white/[0.05] rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
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
                    className="w-full bg-void border border-white/[0.05] rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Current Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className="w-full bg-void border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
                >
                  {AVAILABLE_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Source Site */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Source Site / Platform</label>
                <input
                  type="text"
                  placeholder="e.g. LinkedIn, Naukri, Direct Apply"
                  value={sourceSite}
                  onChange={(e) => setSourceSite(e.target.value)}
                  className="w-full bg-void border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
                />
              </div>

              {/* Job Posting Link */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Posting URL / Link</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="url"
                    placeholder="Paste full URL..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-void border border-white/[0.05] rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
                  />
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="p-3 bg-void/50 rounded-xl border border-white/[0.04] space-y-2">
                <span className="text-[10px] font-bold text-text-muted block uppercase tracking-wider mb-1">Contact Person (Optional)</span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-void border border-white/[0.05] rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cool"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      placeholder="Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-void border border-white/[0.05] rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cool"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-void border border-white/[0.05] rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cool"
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
                    className="w-20 bg-void border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-cool"
                  />
                  <span className="text-xs text-text-muted">Days without status updates</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Tags &amp; Labels</span>
              </label>
              
              <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-void border border-white/[0.05] rounded-xl">
                {tags.map(t => (
                  <span 
                    key={t}
                    className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-text-primary border border-white/[0.05]"
                  >
                    <span>{t}</span>
                    <button 
                      type="button" 
                      onClick={() => removeTag(t)}
                      className="text-text-muted hover:text-text-primary font-bold ml-1 cursor-pointer"
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
                  placeholder="Type a tag and press Add"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTagInput))}
                  className="flex-1 bg-void border border-white/[0.05] rounded-xl px-4 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cool"
                />
                <button
                  type="button"
                  onClick={() => addTag(newTagInput)}
                  className="bg-surface hover:bg-surface-raised border border-white/[0.06] text-text-primary text-xs font-semibold px-4 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Add Tag
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <span className="text-[9px] text-text-muted uppercase font-bold self-center mr-1">Suggestions:</span>
                {COMMON_TAGS.filter(ct => !tags.includes(ct)).map(ct => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => addTag(ct)}
                    className="text-[9px] px-2 py-0.5 bg-surface-raised hover:bg-void border border-white/[0.04] text-text-muted hover:text-text-primary rounded-md transition-colors cursor-pointer"
                  >
                    + {ct}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Notes &amp; Tasks</label>
              <textarea
                rows={3}
                placeholder="Details, next steps, syllabus, HR contacts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-void border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-cool transition-colors"
              />
            </div>
          </form>

          {/* Status Timeline History Log */}
          {jobToEdit && (
            <div className="border-t border-white/[0.06] pt-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-display mb-4 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-cool" />
                <span>Campaign History Log</span>
              </h4>
              <div className="relative border-l border-white/[0.06] ml-2 pl-4 py-1 space-y-4">
                {jobToEdit.statusHistory && jobToEdit.statusHistory.length > 0 ? (
                  jobToEdit.statusHistory.filter(h => Boolean(h && h.status)).map((h, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot with color coding matching status color */}
                      <span 
                        className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#131826] transition-all duration-300"
                        style={{ backgroundColor: getStatusColor(h.status) }}
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
                  <p className="text-xs text-text-muted italic">No status events registered.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-surface-raised/40 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            {jobToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-danger hover:bg-danger/10 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Card</span>
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-void hover:bg-surface-raised border border-white/[0.04] text-text-primary text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-cool hover:bg-cool/90 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              {jobToEdit ? 'Save Changes' : 'Create Card'}
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
