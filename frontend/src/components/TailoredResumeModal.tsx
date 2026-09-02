import React, { useState, useEffect } from 'react';
import { getUserProfile, type JobApplication, type UserProfile } from '../db/schema';
import { ResumePreview } from './ResumePreview';
import { generateAITailoredResume } from '../utils/aiService';
import { 
  X, 
  Sparkles, 
  FileText, 
  RotateCcw,
  Zap
} from 'lucide-react';

interface TailoredResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobApplication | null;
}

export const TailoredResumeModal: React.FC<TailoredResumeModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const [baseProfile, setBaseProfile] = useState<UserProfile | null>(null);
  const [tailoredProfile, setTailoredProfile] = useState<UserProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [matchScore, setMatchScore] = useState(95);

  const runTailoring = async () => {
    if (!job) return;
    setIsGenerating(true);
    const p = await getUserProfile();
    setBaseProfile(p);

    const result = await generateAITailoredResume(p, job);
    setTailoredProfile(result.tailoredProfile);
    setMatchScore(result.matchScore);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isOpen && job) {
      runTailoring();
    }
  }, [isOpen, job]);

  if (!isOpen || !job || !tailoredProfile) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto select-none">
      <div 
        className="card w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh] shadow-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 flex items-center justify-between border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4' }}>
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-text-primary font-display">
                  AI Tailored ATS Resume
                </h3>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                >
                  <Sparkles size={10} />
                  <span>{matchScore}% ATS Match</span>
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 flex items-center space-x-1.5">
                <span>Customized from Candidate Profile for</span>
                <span className="font-semibold text-text-primary">{job.role}</span>
                <span>at</span>
                <span className="font-semibold text-text-primary">{job.company}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={runTailoring}
              disabled={isGenerating}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1"
              title="Regenerate tailoring with AI"
            >
              <Zap size={12} className={isGenerating ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={() => {
                if (baseProfile) setTailoredProfile({ ...baseProfile });
              }}
              className="btn-secondary text-xs px-3 py-1.5 hidden sm:flex items-center space-x-1"
              title="Reset to default candidate profile"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-raised transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Resume Paper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: 'var(--bg-canvas)' }}>
          {isGenerating ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="h-8 w-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-semibold text-text-primary">Optimizing ATS Keywords &amp; Resume Sections for {job.company}...</p>
              <p className="text-[11px] text-text-muted">Pulling all verified details from your Candidate Profile</p>
            </div>
          ) : (
            <ResumePreview profile={tailoredProfile} onRecreate={runTailoring} isRecreating={isGenerating} />
          )}
        </div>
      </div>
    </div>
  );
};
