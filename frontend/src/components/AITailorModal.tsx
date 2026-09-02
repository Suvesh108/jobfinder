import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Copy, Check, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { getUserProfile, type UserProfile } from '../db/schema';
import { generateTailoredApplication, type AITailorResult } from '../utils/aiService';

interface AITailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    company: string;
    role: string;
    location?: string;
    description?: string;
  };
}

export const AITailorModal: React.FC<AITailorModalProps> = ({ isOpen, onClose, job }) => {
  const [, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'cover_letter' | 'resume_bullets' | 'gap_analysis'>('cover_letter');
  const [tailorResult, setTailorResult] = useState<AITailorResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      getUserProfile().then(userProfile => {
        setProfile(userProfile);
        const result = generateTailoredApplication(userProfile, job);
        setTailorResult(result);
        setEditedCoverLetter(result.tailoredCoverLetter);
        setIsGenerating(false);
      });
    }
  }, [isOpen, job]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div 
        className="card w-full max-w-4xl rounded-2xl overflow-hidden max-h-[92vh] flex flex-col border shadow-2xl"
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
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold font-display text-text-primary">
                  AI Application Tailor
                </h2>
                {tailorResult && (
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: tailorResult.matchScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: tailorResult.matchScore >= 80 ? 'var(--status-success)' : 'var(--status-warning)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {tailorResult.matchScore}% ATS Match
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                Tailored for <span className="text-text-primary font-semibold">{job.role}</span> at <span className="text-text-primary font-semibold">{job.company}</span>
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

        {/* Sub Navigation Bar */}
        <div className="px-6 py-2 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('cover_letter')}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
              style={{
                background: activeTab === 'cover_letter' ? 'var(--sidebar-item-active)' : 'transparent',
                color: activeTab === 'cover_letter' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              📄 Tailored Cover Letter
            </button>
            <button
              onClick={() => setActiveTab('resume_bullets')}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
              style={{
                background: activeTab === 'resume_bullets' ? 'var(--sidebar-item-active)' : 'transparent',
                color: activeTab === 'resume_bullets' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              🎯 Targeted Resume Bullets
            </button>
            <button
              onClick={() => setActiveTab('gap_analysis')}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
              style={{
                background: activeTab === 'gap_analysis' ? 'var(--sidebar-item-active)' : 'transparent',
                color: activeTab === 'gap_analysis' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              🔍 ATS Keyword &amp; Gap Analysis
            </button>
          </div>

          {activeTab === 'cover_letter' && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleCopy(editedCoverLetter)}
                className="btn-secondary text-[11px] px-3 py-1 rounded-lg flex items-center space-x-1"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownload(`cover_letter_${job.company.toLowerCase().replace(/\s+/g, '_')}.md`, editedCoverLetter)}
                className="btn-primary text-[11px] px-3 py-1 rounded-lg flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Export .MD</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Sparkles className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-text-muted">Analyzing job requirements and drafting tailored application...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: COVER LETTER */}
              {activeTab === 'cover_letter' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>Editable live draft formatted with your candidate credentials:</span>
                    <span>{editedCoverLetter.split(/\s+/).length} words</span>
                  </div>
                  <textarea
                    rows={16}
                    value={editedCoverLetter}
                    onChange={(e) => setEditedCoverLetter(e.target.value)}
                    className="w-full border rounded-xl p-4 text-xs text-text-primary font-mono leading-relaxed focus:outline-none focus:border-primary transition-colors"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              )}

              {/* TAB 2: RESUME BULLETS */}
              {activeTab === 'resume_bullets' && tailorResult && (
                <div className="space-y-4">
                  <p className="text-xs text-text-muted">
                    Add these high-impact bullet points to your resume under relevant project or work experience:
                  </p>
                  <div className="space-y-3">
                    {tailorResult.tailoredResumeBullets.map((bullet, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl border flex items-start justify-between space-x-3 group"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-start space-x-2.5">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs text-text-primary leading-relaxed">{bullet}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(bullet)}
                          className="text-text-muted hover:text-text-primary p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                          title="Copy bullet"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GAP ANALYSIS */}
              {activeTab === 'gap_analysis' && tailorResult && (
                <div className="space-y-5">
                  {/* Score overview */}
                  <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary font-display">Target Fit Assessment</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">{tailorResult.strengthsSummary}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-display text-primary">{tailorResult.matchScore}%</span>
                      <span className="block text-[9px] text-text-muted font-bold uppercase">Estimated Match</span>
                    </div>
                  </div>

                  {/* Matched skills */}
                  <div>
                    <h5 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span>Directly Matched Skills ({tailorResult.matchedSkills.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.matchedSkills.map(skill => (
                        <span 
                          key={skill}
                          className="text-xs font-semibold px-3 py-1 rounded-lg flex items-center space-x-1"
                          style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
                        >
                          <span>✓</span>
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing/Gap skills */}
                  <div>
                    <h5 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-warning" />
                      <span>Recommended Missing Keywords / Skills ({tailorResult.missingSkills.length})</span>
                    </h5>
                    <p className="text-[11px] text-text-muted mb-2">Consider highlighting any related experience or bridge answers in your interview prep:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.missingSkills.map(skill => (
                        <span 
                          key={skill}
                          className="text-xs font-semibold px-3 py-1 rounded-lg"
                          style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--status-warning)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
                        >
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] text-text-muted">
            Generated using candidate profile data. Customize your profile in Settings.
          </span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5 py-1.5 rounded-xl font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
