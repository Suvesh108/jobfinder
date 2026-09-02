import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';
import { getUserProfile, type JobApplication } from '../db/schema';
import { generateInterviewPrep, type InterviewPrepResult } from '../utils/aiService';

interface InterviewPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobApplication | { company: string; role: string; description?: string };
}

export const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({ isOpen, onClose, job }) => {
  const [activeTab, setActiveTab] = useState<'behavioral' | 'technical' | 'questions_to_ask' | 'simulator'>('behavioral');
  const [prepData, setPrepData] = useState<InterviewPrepResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Simulator State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [practiceNotes, setPracticeNotes] = useState('');

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      getUserProfile().then(profile => {
        const result = generateInterviewPrep(profile, job);
        setPrepData(result);
        setIsGenerating(false);
      });
    }
  }, [isOpen, job]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const allQuestions = [
    ...(prepData?.behavioralSTAR.map(b => ({ title: 'Behavioral', q: b.question, guide: `STAR Strategy: Situation -> Task -> Action -> Result. ${b.tip}` })) || []),
    ...(prepData?.technicalQuestions.map(t => ({ title: 'Technical', q: t.question, guide: `Key Concept: ${t.keyConcept}` })) || [])
  ];

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
              style={{ background: 'rgba(251, 146, 60, 0.15)', color: 'var(--status-interview)', border: '1px solid rgba(251, 146, 60, 0.3)' }}
            >
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-text-primary">
                AI Interview Strategy &amp; STAR Simulator
              </h2>
              <p className="text-[11px] text-text-muted">
                Roleplay preparation for <span className="text-text-primary font-semibold">{job.role}</span> at <span className="text-text-primary font-semibold">{job.company}</span>
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

        {/* Sub Nav */}
        <div className="px-6 py-2 border-b flex space-x-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('behavioral')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
            style={{
              background: activeTab === 'behavioral' ? 'var(--sidebar-item-active)' : 'transparent',
              color: activeTab === 'behavioral' ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
          >
            ⭐ STAR Behavioral Blueprints
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
            style={{
              background: activeTab === 'technical' ? 'var(--sidebar-item-active)' : 'transparent',
              color: activeTab === 'technical' ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
          >
            ⚡ Technical &amp; Architecture
          </button>
          <button
            onClick={() => setActiveTab('questions_to_ask')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
            style={{
              background: activeTab === 'questions_to_ask' ? 'var(--sidebar-item-active)' : 'transparent',
              color: activeTab === 'questions_to_ask' ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
          >
            💡 Questions to Ask Interviewer
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
            style={{
              background: activeTab === 'simulator' ? 'var(--sidebar-item-active)' : 'transparent',
              color: activeTab === 'simulator' ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
          >
            ⏱️ Mock Practice Simulator
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isGenerating || !prepData ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Target className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-text-muted">Building customized STAR answers &amp; company briefing...</p>
            </div>
          ) : (
            <>
              {/* Company Brief Card */}
              <div className="p-4 rounded-xl border space-y-1.5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Company &amp; Role Intel</span>
                <p className="text-xs text-text-primary leading-relaxed">{prepData.companyBrief}</p>
              </div>

              {/* TAB 1: BEHAVIORAL STAR */}
              {activeTab === 'behavioral' && (
                <div className="space-y-4">
                  {prepData.behavioralSTAR.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border space-y-3"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <h4 className="text-xs font-bold text-text-primary flex items-start space-x-2">
                        <span className="text-primary font-mono">Q{idx + 1}.</span>
                        <span>{item.question}</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                          <span className="text-[9px] font-bold text-text-muted uppercase block">Situation:</span>
                          <span className="text-text-primary">{item.situation}</span>
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                          <span className="text-[9px] font-bold text-text-muted uppercase block">Task:</span>
                          <span className="text-text-primary">{item.task}</span>
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                          <span className="text-[9px] font-bold text-text-muted uppercase block">Action:</span>
                          <span className="text-text-primary">{item.action}</span>
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                          <span className="text-[9px] font-bold text-text-muted uppercase block">Result:</span>
                          <span className="text-text-primary font-semibold text-success">{item.result}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-text-muted italic border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                        💡 <span className="font-semibold text-text-primary">Pro Tip:</span> {item.tip}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: TECHNICAL */}
              {activeTab === 'technical' && (
                <div className="space-y-4">
                  {prepData.technicalQuestions.map((tech, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border space-y-2.5"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <h4 className="text-xs font-bold text-text-primary flex items-start space-x-2">
                        <span className="text-primary font-mono">#{idx + 1}</span>
                        <span>{tech.question}</span>
                      </h4>
                      <div className="text-xs space-y-1.5 p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                        <div className="text-text-muted text-[11px]">
                          <span className="font-bold text-text-primary">Key Focus:</span> {tech.keyConcept}
                        </div>
                        <div className="text-text-primary text-[11px]">
                          <span className="font-bold">Suggested Approach:</span> {tech.suggestedApproach}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: QUESTIONS TO ASK */}
              {activeTab === 'questions_to_ask' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-muted">
                    Stand out by asking high-leverage strategic questions during the Q&amp;A section of the interview:
                  </p>
                  {prepData.questionsForInterviewer.map((q, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl border flex items-center space-x-3"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <span className="text-xs font-bold font-mono text-primary px-2 py-0.5 rounded-md" style={{ background: 'var(--sidebar-item-active)' }}>
                        0{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-text-primary">{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: SIMULATOR */}
              {activeTab === 'simulator' && allQuestions.length > 0 && (
                <div className="space-y-4">
                  {/* Timer Bar */}
                  <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-mono font-black text-text-primary">{formatTimer(timerSeconds)}</span>
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
                      </button>
                      <button
                        onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                        className="btn-secondary text-xs px-2.5 py-1.5 rounded-lg"
                        title="Reset"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-muted font-semibold">
                        Question {currentQuestionIdx + 1} of {allQuestions.length}
                      </span>
                      <button
                        disabled={currentQuestionIdx === allQuestions.length - 1}
                        onClick={() => {
                          setCurrentQuestionIdx(i => Math.min(allQuestions.length - 1, i + 1));
                          setTimerSeconds(0);
                        }}
                        className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active Question Card */}
                  <div className="p-5 rounded-xl border space-y-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-glow)' }}>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {allQuestions[currentQuestionIdx].title} Question
                    </span>
                    <h3 className="text-sm font-bold text-text-primary leading-snug">
                      "{allQuestions[currentQuestionIdx].q}"
                    </h3>
                    <p className="text-xs text-text-muted italic border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      {allQuestions[currentQuestionIdx].guide}
                    </p>
                  </div>

                  {/* Practice scratchpad */}
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                      Practice Outline &amp; Talking Points:
                    </label>
                    <textarea
                      rows={4}
                      value={practiceNotes}
                      onChange={(e) => setPracticeNotes(e.target.value)}
                      placeholder="Jot down your key metrics, STAR points, and framework steps before answering out loud..."
                      className="w-full border rounded-xl p-3 text-xs text-text-primary focus:outline-none"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] text-text-muted">
            Designed to help you deliver clear, concise, and metrics-driven answers.
          </span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5 py-1.5 rounded-xl font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
