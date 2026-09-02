import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Copy, Check, Send } from 'lucide-react';
import { getUserProfile, type JobApplication } from '../db/schema';
import { generateEmailDraft, type EmailDraftResult } from '../utils/aiService';

interface EmailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobApplication;
  initialType?: 'followup' | 'thank_you' | 'inquiry' | 'withdrawal';
}

export const EmailGeneratorModal: React.FC<EmailGeneratorModalProps> = ({ 
  isOpen, 
  onClose, 
  job,
  initialType = 'followup' 
}) => {
  const [emailType, setEmailType] = useState<'followup' | 'thank_you' | 'inquiry' | 'withdrawal'>(initialType);
  const [, setDraft] = useState<EmailDraftResult | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState(job.contactEmail || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUserProfile().then(profile => {
        const d = generateEmailDraft(emailType, profile, job);
        setDraft(d);
        setSubject(d.subject);
        setBody(d.body);
        if (job.contactEmail) setRecipient(job.contactEmail);
      });
    }
  }, [isOpen, emailType, job]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailClient = () => {
    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div 
        className="card w-full max-w-2xl rounded-2xl overflow-hidden max-h-[92vh] flex flex-col border shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-xl"
              style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cool)', border: '1px solid rgba(56, 189, 248, 0.3)' }}
            >
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-text-primary">
                Smart Email Composer
              </h2>
              <p className="text-[11px] text-text-muted">
                Draft professional correspondence for <span className="text-text-primary font-semibold">{job.company}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            style={{ background: 'var(--bg-surface-raised)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Email Type Selector */}
        <div className="px-6 py-2 border-b flex space-x-2 overflow-x-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {[
            { id: 'followup', label: '⏳ Status Follow-up' },
            { id: 'thank_you', label: '🤝 Post-Interview Thank You' },
            { id: 'inquiry', label: '📩 Application Inquiry' },
            { id: 'withdrawal', label: '🛑 Respectful Withdrawal' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setEmailType(t.id as any)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer"
              style={{
                background: emailType === t.id ? 'var(--sidebar-item-active)' : 'transparent',
                color: emailType === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Recipient */}
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Recipient Email:</label>
            <input
              type="email"
              placeholder="e.g. recruiter@company.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary font-semibold focus:outline-none"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Email Body:</label>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border rounded-xl p-4 text-xs text-text-primary leading-relaxed focus:outline-none font-sans"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={handleCopy}
            className="btn-secondary text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 font-semibold"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleOpenMailClient}
              className="btn-primary text-xs px-5 py-2 rounded-xl flex items-center space-x-1.5 font-bold"
            >
              <Send className="h-4 w-4" />
              <span>Open in Email App</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
