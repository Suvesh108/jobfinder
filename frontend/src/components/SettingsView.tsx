import React, { useState, useEffect } from 'react';
import { db, getUserProfile, saveUserProfile, type JobApplication, type UserProfile } from '../db/schema';
import { useUIStore, type AppTheme } from '../store/useUIStore';
import { adapters } from '../adapters';
import { ConfirmModal } from './ConfirmModal';
import { 
  AI_PROVIDERS, 
  autoDetectWorkingModel, 
  type AIProviderId 
} from '../utils/aiService';
import { 
  Clock, 
  Database, 
  Sliders, 
  Trash2, 
  Check, 
  RefreshCw, 
  Globe, 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Sparkles, 
  Key, 
  Cpu, 
  Zap, 
  Save, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Wand2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    defaultReminderDays, 
    setDefaultReminderDays, 
    enabledAdapters, 
    toggleAdapter, 
    theme, 
    setTheme 
  } = useUIStore();

  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'scrapers' | 'preferences' | 'database'>('ai');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbSuccessMessage, setDbSuccessMessage] = useState<string | null>(null);
  const [jobspyStatus, setJobspyStatus] = useState<'checking' | 'running' | 'offline'>('checking');

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState<AIProviderId>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<{ success: boolean; message: string; latencyMs: number; model?: string } | null>(null);

  // Database Management State
  const [allJobs, setAllJobs] = useState<JobApplication[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    // Load AI Config
    getUserProfile().then((p: UserProfile) => {
      const prov = (p.aiProvider as AIProviderId) || 'gemini';
      setAiProvider(prov);
      setAiApiKey(p.aiApiKey || '');
      setAiBaseUrl(p.aiBaseUrl || '');
      setAiModel(p.aiModel || '');
    });

    // Check JobSpy Backend
    const pythonUrl = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || 'https://jobfinder-xgb9.onrender.com';
    fetch(`${pythonUrl}/health`)
      .then(res => res.ok ? setJobspyStatus('running') : setJobspyStatus('offline'))
      .catch(() => setJobspyStatus('offline'));

    // Load Database Jobs
    db.jobs.toArray().then(setAllJobs);
  }, []);

  const selectedProviderConfig = AI_PROVIDERS.find(p => p.id === aiProvider) || AI_PROVIDERS[0];

  // Auto-Detect Active Model when user clicks Auto-Detect
  const handleAutoDetectModel = async (keyOverride?: string, provOverride?: AIProviderId) => {
    const key = keyOverride !== undefined ? keyOverride : aiApiKey;
    const prov = provOverride || aiProvider;
    
    setIsDetecting(true);
    setDetectResult(null);

    const result = await autoDetectWorkingModel(prov, key, aiBaseUrl);
    setDetectResult({
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      model: result.workingModel
    });

    if (result.success && result.workingModel) {
      setAiModel(result.workingModel);
      // Auto-save active configuration
      await saveUserProfile({
        aiProvider: prov,
        aiApiKey: key,
        aiBaseUrl,
        aiModel: result.workingModel
      });
    }

    setIsDetecting(false);
  };

  const handleProviderSelect = (prov: AIProviderId) => {
    setAiProvider(prov);
    const cfg = AI_PROVIDERS.find(p => p.id === prov);
    if (cfg) {
      setAiModel(cfg.defaultModel);
      if (prov === 'custom' && !aiBaseUrl) {
        setAiBaseUrl('http://localhost:11434/v1');
      }
    }
    setDetectResult(null);
  };

  const handleSaveAIConfig = async () => {
    await saveUserProfile({
      aiProvider,
      aiApiKey,
      aiBaseUrl,
      aiModel: aiModel || selectedProviderConfig.defaultModel
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10);
    if (!isNaN(days) && days > 0) {
      setDefaultReminderDays(days);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleExportDatabase = async () => {
    setIsExporting(true);
    const jobs = await db.jobs.toArray();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `jobfinder_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExporting(false);
    setDbSuccessMessage('Database exported successfully!');
    setTimeout(() => setDbSuccessMessage(null), 3000);
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedJobs = JSON.parse(event.target?.result as string);
        if (!Array.isArray(importedJobs)) throw new Error('Invalid file format. Expected JSON array of jobs.');

        let newCount = 0;
        let dupCount = 0;
        const currentJobs = await db.jobs.toArray();
        const existingKeys = new Set(currentJobs.map(j => `${j.company.toLowerCase()}__${j.role.toLowerCase()}`));

        for (const j of importedJobs) {
          if (!j.company || !j.role) continue;
          const key = `${String(j.company).toLowerCase()}__${String(j.role).toLowerCase()}`;
          if (existingKeys.has(key)) {
            dupCount++;
          } else {
            // ponytail: whitelist and sanitize schema fields to prevent malicious payload insertion
            const sanitizedJob = {
              company: String(j.company || '').slice(0, 200),
              role: String(j.role || '').slice(0, 200),
              location: String(j.location || '').slice(0, 200),
              salary: j.salary ? String(j.salary).slice(0, 100) : undefined,
              sourceSite: String(j.sourceSite || 'Imported').slice(0, 100),
              dateApplied: String(j.dateApplied || new Date().toISOString().split('T')[0]),
              lastStatusChange: String(j.lastStatusChange || new Date().toISOString().split('T')[0]),
              status: (['Wishlist', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].includes(j.status) ? j.status : 'Wishlist') as any,
              statusHistory: Array.isArray(j.statusHistory) ? j.statusHistory.map((h: any) => ({ status: h.status || 'Wishlist', date: String(h.date || new Date().toISOString()) })) : [],
              link: j.link ? String(j.link).slice(0, 1000) : '',
              notes: String(j.notes || '').slice(0, 10000),
              tags: Array.isArray(j.tags) ? j.tags.map(String).slice(0, 20) : [],
            };
            await db.jobs.add(sanitizedJob as any);
            existingKeys.add(key);
            newCount++;
          }
        }

        const updated = await db.jobs.toArray();
        setAllJobs(updated);
        setDbSuccessMessage(`Import complete: ${newCount} added, ${dupCount} skipped.`);
      } catch (err) {
        alert('Failed to import database file: ' + (err as Error).message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearDatabase = async () => {
    await db.jobs.clear();
    setAllJobs([]);
    setShowClearModal(false);
    setDbSuccessMessage('All application records cleared.');
    setTimeout(() => setDbSuccessMessage(null), 3000);
  };

  return (
    <div className="page-content w-full max-w-full px-3 sm:px-8 py-3 sm:py-6 pb-24 sm:pb-10 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        
        {/* Left Sub-Tabs Selector (Fixed 240px width) */}
        <div className="w-full card p-2 shrink-0 flex md:flex-col overflow-x-auto md:overflow-visible gap-1.5 md:space-y-1.5 shadow-xl border scrollbar-none" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {[
            { id: 'ai', label: 'AI Providers & API Keys', icon: Sparkles, color: 'text-cyan-400' },
            { id: 'scrapers', label: 'JobSpy Scrapers', icon: Sliders, color: 'text-indigo-400' },
            { id: 'preferences', label: 'Preferences & Theme', icon: Palette, color: 'text-purple-400' },
            { id: 'database', label: 'Database & Backups', icon: Database, color: 'text-emerald-400' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`w-auto md:w-full whitespace-nowrap text-left px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border shrink-0 ${
                  isActive 
                    ? 'shadow-xs text-text-primary' 
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/40 border-transparent'
                }`}
                style={{
                  background: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                  borderColor: isActive ? 'var(--border-glow)' : 'transparent'
                }}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`h-4 w-4 ${tab.color}`} />
                  <span>{tab.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-xs" />}
              </button>
            );
          })}
        </div>

        {/* Right Content Area (Guaranteed 100% width with min-w-0 to prevent horizontal expansion) */}
        <div className="w-full min-w-0 card p-6 space-y-6" style={{ background: 'var(--bg-surface)' }}>
          
          {/* TAB 1: AI PROVIDERS & API CONFIGURATION */}
          {activeSubTab === 'ai' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>AI Providers &amp; Auto-Detect Engine</span>
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Connect Gemini, OpenRouter, NVIDIA NIM, Groq, DeepSeek or local models. The system auto-detects active models to tailor your LaTeX resume from Candidate Profile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAIConfig}
                  className="btn-primary text-xs px-4 py-2 flex items-center space-x-1.5 font-bold cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saveSuccess ? 'Saved!' : 'Save Config'}</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <Check className="h-4 w-4" />
                  <span>AI configuration saved successfully! Resume generation will use these live credentials.</span>
                </div>
              )}

              {/* Provider Selection Cards (Rich multi-provider grid) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Choose AI Engine / Free Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {AI_PROVIDERS.map((prov) => {
                    const isSelected = aiProvider === prov.id;
                    return (
                      <div
                        key={prov.id}
                        onClick={() => handleProviderSelect(prov.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected ? 'shadow-md ring-1' : 'hover:border-slate-500/50'
                        }`}
                        style={{
                          background: isSelected ? 'var(--sidebar-item-active)' : 'var(--bg-card)',
                          borderColor: isSelected ? prov.badgeColor : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-text-primary flex items-center space-x-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: prov.badgeColor }} />
                            <span className="truncate">{prov.name}</span>
                          </span>
                          <span 
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0"
                            style={{ background: 'var(--bg-surface-raised)', color: prov.badgeColor }}
                          >
                            {prov.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-tight line-clamp-2">{prov.tagline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Provider Details & Auto-Detect Engine */}
              {aiProvider !== 'offline' && (
                <div className="card p-5 space-y-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                  
                  {/* Header info & Dashboard Key link */}
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedProviderConfig.badgeColor }} />
                      <span className="text-xs font-bold text-text-primary">{selectedProviderConfig.name} Setup</span>
                    </div>

                    {selectedProviderConfig.keyDashboardUrl && (
                      <a
                        href={selectedProviderConfig.keyDashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <span>Get Free API Key</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  {/* API Key input */}
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Key className="h-3 w-3" />
                        <span>API Key</span>
                      </span>
                      {selectedProviderConfig.isFreeTier && (
                        <span className="text-[10px] text-emerald-400 font-normal">✓ Free Tier Eligible</span>
                      )}
                    </label>
                    
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          placeholder={selectedProviderConfig.keyPlaceholder}
                          value={aiApiKey}
                          onChange={(e) => {
                            setAiApiKey(e.target.value);
                            setDetectResult(null);
                          }}
                          className="w-full border rounded-xl pl-4 pr-10 py-2.5 text-xs font-mono text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-2.5 text-text-muted hover:text-text-primary cursor-pointer"
                          title={showApiKey ? 'Hide key' : 'Show key'}
                        >
                          {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* Auto-Detect Working Model Button */}
                      <button
                        type="button"
                        onClick={() => handleAutoDetectModel()}
                        disabled={isDetecting || (!aiApiKey && aiProvider !== 'custom')}
                        className="btn-primary text-xs px-3.5 py-2.5 font-bold flex items-center space-x-1.5 shrink-0 disabled:opacity-40"
                        title="Ping provider and auto-select the best working model"
                      >
                        <Wand2 size={13} className={isDetecting ? 'animate-spin' : ''} />
                        <span>{isDetecting ? 'Detecting...' : 'Auto-Detect Model'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Auto-Detect Result Badge */}
                  {detectResult && (
                    <div 
                      className="p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fade-in"
                      style={{
                        background: detectResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: detectResult.success ? 'var(--status-success)' : 'var(--status-danger)',
                        borderColor: detectResult.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'
                      }}
                    >
                      {detectResult.success ? <Check size={14} className="shrink-0" /> : <Zap size={14} className="shrink-0" />}
                      <div className="flex-1 flex flex-wrap items-center justify-between gap-1">
                        <span>{detectResult.message}</span>
                        <span className="text-[10px] opacity-80">{detectResult.latencyMs}ms latency</span>
                      </div>
                    </div>
                  )}

                  {/* Active Model Identifier & Base URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center space-x-1.5">
                        <Cpu className="h-3 w-3" />
                        <span>Active Model</span>
                      </label>
                      <input
                        type="text"
                        placeholder={selectedProviderConfig.defaultModel}
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full border rounded-xl px-4 py-2 text-xs font-mono text-text-primary focus:outline-none"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedProviderConfig.candidateModels.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setAiModel(m);
                              handleAutoDetectModel(undefined, undefined);
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                              aiModel === m ? 'border-primary text-primary bg-primary/10' : 'text-text-muted hover:text-text-primary'
                            }`}
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {aiProvider === 'custom' && (
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center space-x-1.5">
                          <Globe className="h-3 w-3" />
                          <span>Custom Base URL</span>
                        </label>
                        <input
                          type="url"
                          placeholder="http://localhost:11434/v1"
                          value={aiBaseUrl}
                          onChange={(e) => setAiBaseUrl(e.target.value)}
                          className="w-full border rounded-xl px-4 py-2 text-xs font-mono text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: JOBSPY SCRAPERS */}
          {activeSubTab === 'scrapers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    <span>JobSpy Multi-Channel Scraper Engine</span>
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Toggle and configure job aggregator scrapers across Indian and global job channels.</p>
                </div>
              </div>

              {/* Status Card */}
              <div 
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ 
                  background: jobspyStatus === 'running' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  borderColor: jobspyStatus === 'running' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex items-center justify-center">
                    <span className={`w-3 h-3 rounded-full ${jobspyStatus === 'running' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className={`absolute w-3 h-3 rounded-full animate-ping opacity-75 ${jobspyStatus === 'running' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      {jobspyStatus === 'running' ? 'JobSpy Python FastAPI Backend Connected' : 'JobSpy Backend Offline / Standby'}
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      {jobspyStatus === 'running' ? 'High-speed parallel scraping active across Naukri, Indeed, LinkedIn, Glassdoor, ZipRecruiter.' : 'Automated fallback to high-fidelity mock stream active.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adapter Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Channel Adapters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adapters.map((adapter) => {
                    const isEnabled = enabledAdapters.includes(adapter.id);
                    return (
                      <div
                        key={adapter.id}
                        onClick={() => toggleAdapter(adapter.id)}
                        className="p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer hover:border-slate-500/40 select-none"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-text-primary">{adapter.name}</span>
                          </div>
                          <p className="text-[11px] text-text-muted">Live job aggregator stream</p>
                        </div>
                        <div 
                          className="w-11 h-6 rounded-full relative shrink-0 transition-colors duration-200 cursor-pointer shadow-inner" 
                          style={{ 
                            background: isEnabled ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.12)',
                            boxShadow: isEnabled ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                          }}
                        >
                          <span 
                            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-md"
                            style={{
                              transform: isEnabled ? 'translateX(22px)' : 'translateX(3px)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & THEME */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <span>Appearance &amp; Theme</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Select your preferred color theme. Changes apply instantly across the entire dashboard.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark Theme', icon: Moon, desc: 'Abyssal obsidian & indigo glow' },
                  { id: 'light', label: 'Light Theme', icon: Sun, desc: 'Crisp porcelain & royal slate' },
                  { id: 'system', label: 'System Theme', icon: Monitor, desc: 'Syncs with OS preferences' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setTheme(item.id as AppTheme)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                        isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-slate-500/40'
                      }`}
                      style={{
                        background: isSelected ? 'var(--sidebar-item-active)' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      }}
                    >
                      <Icon size={20} className={isSelected ? 'text-primary' : 'text-text-muted'} />
                      <span className="text-xs font-bold text-text-primary">{item.label}</span>
                      <span className="text-[10px] text-text-muted text-center">{item.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Follow-up Reminder Threshold */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <h4 className="text-xs font-bold text-text-primary mb-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Follow-up Alert Threshold</span>
                </h4>
                <p className="text-[11px] text-text-muted mb-3">
                  Applications with no status change beyond this duration will be highlighted with a follow-up warning.
                </p>

                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={defaultReminderDays}
                    onChange={handleDaysChange}
                    className="w-24 border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                  <span className="text-xs text-text-muted font-medium">Days of inactivity</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE & BACKUPS */}
          {activeSubTab === 'database' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Database &amp; Data Portability</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Backup your applications locally as JSON, import from another machine, or reset the local database.
                </p>
              </div>

              {dbSuccessMessage && (
                <div className="p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <Check className="h-4 w-4" />
                  <span>{dbSuccessMessage}</span>
                </div>
              )}

              <div className="card p-4 border flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Total Applications Stored</h4>
                  <p className="text-[11px] text-text-muted">IndexedDB storage is active locally on this device.</p>
                </div>
                <span className="text-lg font-black font-display text-cyan-400">{allJobs.length}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export Backup */}
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  disabled={isExporting}
                  className="btn-secondary p-4 rounded-xl flex flex-col items-center justify-center space-y-1.5"
                >
                  <Database className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold">Export JSON Backup</span>
                  <span className="text-[10px] text-text-muted">Download all applications and status history</span>
                </button>

                {/* Import Backup */}
                <label className="btn-secondary p-4 rounded-xl flex flex-col items-center justify-center space-y-1.5 cursor-pointer">
                  <RefreshCw className={`h-5 w-5 text-primary ${isImporting ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-bold">Import JSON Backup</span>
                  <span className="text-[10px] text-text-muted">Restore applications from a previous file</span>
                  <input type="file" accept=".json" onChange={handleImportDatabase} className="hidden" />
                </label>
              </div>

              {/* Clear Database */}
              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h4 className="text-xs font-bold text-text-danger">Danger Zone</h4>
                  <p className="text-[11px] text-text-muted">Permanently delete all stored applications and history.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="btn-secondary text-xs px-4 py-2 border-danger/40 text-danger hover:bg-danger/10"
                >
                  <Trash2 size={13} className="mr-1.5" />
                  <span>Clear All Records</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Clear Database Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear All Applications?"
        message="This action will permanently delete all stored applications, notes, and status histories. This cannot be undone."
        confirmText="Clear All Data"
        variant="danger"
        onConfirm={handleClearDatabase}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
