import React, { useState, useEffect, useRef } from 'react';
import { db, getUserProfile, type UserProfile, type JobApplication } from '../db/schema';
import { chatWithAICopilot, type ChatMessage } from '../utils/aiService';
import { useUIStore } from '../store/useUIStore';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Briefcase, 
  Maximize2, 
  Minimize2, 
  FileDown,
  Settings,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export const AIChatCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Data Context
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trackedJobs, setTrackedJobs] = useState<JobApplication[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | 'none'>('none');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const isAIConnected = Boolean(profile?.aiApiKey) || (profile?.aiProvider === 'custom' && Boolean(profile?.aiBaseUrl));

  const loadContext = async () => {
    const p = await getUserProfile();
    setProfile(p);
    const jobs = await db.jobs.toArray();
    setTrackedJobs(jobs);
    if (jobs.length > 0 && selectedJobId === 'none') {
      setSelectedJobId(jobs[0].id || 'none');
    }
  };

  useEffect(() => {
    loadContext();
  }, [isOpen]);

  useEffect(() => {
    getUserProfile().then((p) => {
      setProfile(p);
      const connected = Boolean(p.aiApiKey) || (p.aiProvider === 'custom' && Boolean(p.aiBaseUrl));
      
      if (messages.length === 0) {
        if (!connected) {
          setMessages([
            {
              id: 'welcome_no_key',
              sender: 'assistant',
              text: `Hello ${p.name || 'there'}! 👋 I am your **AI Resume Copilot** 🤖.

⚠️ **AI API Key Required**: No active AI provider is connected yet. 

To enable automated resume tailoring, metric-driven bullet generation, and job description keyword analysis, please add an API key in Settings (Google Gemini, OpenRouter, NVIDIA NIM, Groq, or OpenAI are supported).`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          setMessages([
            {
              id: 'welcome_connected',
              sender: 'assistant',
              text: `Hello ${p.name || 'there'}! 👋 I'm your **AI Resume Copilot** (Connected to ${p.aiProvider?.toUpperCase() || 'AI'}).

💡 **Pro-Tip**: You can **drag and drop any job from the Tracker** directly into this chat to auto-tailor your resume!

Ask me to **tailor your resume**, **generate ATS bullets**, or **check missing skills**!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const selectedJob = trackedJobs.find(j => j.id === selectedJobId) || null;

  const handleGoToSettings = () => {
    setActiveTab('settings');
    setIsOpen(false);
  };

  const handleSendMessage = async (textToSend?: string, jobOverride?: JobApplication | null) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const currentProf = profile || await getUserProfile();
      const targetJob = jobOverride !== undefined ? jobOverride : selectedJob;
      const res = await chatWithAICopilot(query, messages, currentProf, targetJob);

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: 'Encountered an issue connecting to your AI provider. Please verify your API key in Settings.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const droppedJob: JobApplication = JSON.parse(dataStr);
      if (!droppedJob || !droppedJob.company) return;

      if (!isOpen) setIsOpen(true);
      setSelectedJobId(droppedJob.id || 'none');

      await handleSendMessage(
        `Please tailor my ATS resume for ${droppedJob.role} at ${droppedJob.company}. Analyze requirements and optimize summary and bullets.`,
        droppedJob
      );
    } catch (err) {
      console.error('Failed to parse dropped application:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ─── Floating Chat Circle Trigger (Bottom Right) ─── */}
      <div 
        className="fixed z-[940] bottom-20 right-4 sm:bottom-6 sm:right-6"
        style={{
          
          left: 'auto',
          zIndex: 990
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`group relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer ${
              isDragOver ? 'scale-125 ring-4 ring-cyan-400 animate-bounce' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
              boxShadow: isDragOver ? '0 0 30px rgba(6, 182, 212, 0.8)' : '0 8px 25px rgba(6, 182, 212, 0.45)',
            }}
            title="Open AI Resume Copilot (Drop Jobs Here)"
          >
            {/* Pulsing ring */}
            <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-40 animate-ping pointer-events-none" />
            
            <Sparkles className="h-6 w-6 text-white drop-shadow-md transition-transform group-hover:rotate-12" />

            {/* Hover Tooltip */}
            <span 
              className="absolute right-16 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border"
              style={{ background: 'var(--bg-surface-raised)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
            >
              {isDragOver ? '📥 Drop to Tailor Resume!' : '✨ AI Resume Copilot'}
            </span>
          </button>
        ) : null}
      </div>

      {/* ─── Glassmorphic Chat Copilot Window (Bottom Right) ─── */}
      {isOpen && (
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-fade-in transition-all duration-200 ${
            isExpanded ? 'w-[580px] h-[720px] max-w-[94vw] max-h-[90vh]' : 'w-[calc(100vw-32px)] sm:w-[420px] h-[75vh] sm:h-[560px] max-w-full max-h-[85vh] bottom-20 sm:bottom-6 right-4 sm:right-6'
          } ${isDragOver ? 'ring-2 ring-cyan-400' : ''}`}
          style={{
            
            left: 'auto',
            zIndex: 999,
            background: 'var(--bg-surface)',
            borderColor: isDragOver ? '#06B6D4' : 'var(--border-subtle)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
          }}
        >
          {/* Drag Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in border-2 border-dashed border-cyan-400 rounded-2xl m-2 pointer-events-none">
              <FileDown className="h-12 w-12 text-cyan-400 animate-bounce mb-3" />
              <h4 className="text-sm font-bold text-white font-display">Drop Application Here</h4>
              <p className="text-xs text-cyan-200 mt-1">AI Copilot will automatically analyze and tailor your resume for this role!</p>
            </div>
          )}

          {/* Header */}
          <div 
            className="p-3.5 px-4 flex items-center justify-between border-b shrink-0 select-none"
            style={{ 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
              borderColor: 'var(--border-subtle)' 
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-text-primary font-display">AI Resume Copilot</h3>
                  {isAIConnected ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <CheckCircle2 size={10} />
                      <span className="capitalize">{profile?.aiProvider || 'Connected'}</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                      <AlertTriangle size={10} />
                      <span>No API Key</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted">Tailoring from Candidate Profile</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                title="Close Copilot"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Context Selector Bar: Active Tracker Application */}
          <div className="p-2 px-3 border-b flex items-center justify-between gap-2 shrink-0 bg-surface-raised" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center space-x-1.5 text-[11px] text-text-muted truncate">
              <Briefcase size={12} className="text-cyan-400 shrink-0" />
              <span className="shrink-0 font-semibold text-text-secondary">Target:</span>
            </div>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value === 'none' ? 'none' : Number(e.target.value))}
              className="border rounded-lg px-2 py-1 text-[11px] font-semibold text-text-primary focus:outline-none flex-1 truncate cursor-pointer"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
            >
              <option value="none">General / All Tracker Applications</option>
              {trackedJobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.company} — {job.role} ({job.status})
                </option>
              ))}
            </select>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--bg-canvas)' }}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-start space-x-2.5 animate-fade-in ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
                      isUser ? 'bg-cyan-500 text-white' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {isUser ? <User size={12} /> : <Bot size={12} />}
                  </div>

                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isUser 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'border rounded-tl-none text-text-primary'
                    }`}
                    style={{
                      background: isUser ? 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)' : 'var(--bg-surface)',
                      borderColor: isUser ? 'transparent' : 'var(--border-subtle)'
                    }}
                  >
                    <div className="whitespace-pre-wrap font-sans space-y-2">
                      {msg.text}
                    </div>

                    <span className={`text-[9px] block text-right mt-1 opacity-60 ${isUser ? 'text-white' : 'text-text-muted'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Prompt to connect Settings if no API key is set */}
            {!isAIConnected && (
              <div 
                className="p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fade-in"
                style={{ 
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span className="text-xs font-semibold text-text-primary">Connect AI in Settings to unlock Copilot</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoToSettings}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center space-x-1.5 font-bold cursor-pointer whitespace-nowrap"
                >
                  <Settings size={12} />
                  <span>Open Settings</span>
                </button>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center space-x-2 p-3 rounded-xl border w-max bg-surface animate-pulse" style={{ borderColor: 'var(--border-subtle)' }}>
                <Sparkles size={14} className="text-cyan-400 animate-spin" />
                <span className="text-xs text-text-muted">AI is tailoring resume...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="p-2 border-t flex flex-wrap gap-1.5 shrink-0 bg-surface" style={{ borderColor: 'var(--border-subtle)' }}>
            {!isAIConnected ? (
              <button
                type="button"
                onClick={handleGoToSettings}
                className="text-[10px] px-2.5 py-1 rounded-lg border font-bold text-amber-400 border-amber-500/40 hover:bg-amber-500/10 flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Settings size={11} />
                <span>⚙️ Connect AI API in Settings</span>
              </button>
            ) : (
              [
                { label: '🎯 Tailor Resume for Job', query: 'Tailor my resume specifically for this selected job posting and optimize summary and skills.' },
                { label: '✨ Enhance Bullets', query: 'Rewrite my experience and project bullets with strong action verbs and quantifiable metrics.' },
                { label: '📊 ATS Keyword Check', query: 'Analyze the skill gaps between my profile and the selected job description.' },
                { label: '📄 View ATS Resume', action: () => setActiveTab('profile') }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => chip.action ? chip.action() : handleSendMessage(chip.query)}
                  className="text-[10px] px-2.5 py-1 rounded-lg border font-semibold text-text-muted hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer whitespace-nowrap"
                  style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                >
                  {chip.label}
                </button>
              ))
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t shrink-0 bg-surface" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="relative flex items-center">
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAIConnected ? "Ask Copilot or drag & drop any job card..." : "Connect API key in Settings to chat with AI..."}
                className="w-full border rounded-xl pl-3 pr-10 py-2.5 text-xs text-text-primary focus:outline-none resize-none"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 p-1.5 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer"
                title="Send Message"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
