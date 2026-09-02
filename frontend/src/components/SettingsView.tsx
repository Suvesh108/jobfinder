import { fetchLatestRelease } from '../utils/updaterService';
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
  Wand2,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2
} from 'lucide-react';

const CURRENT_VERSION = 'v1.1.4';

export const SettingsView: React.FC = () => {
  const { 
    defaultReminderDays, 
    setDefaultReminderDays, 
    enabledAdapters, 
    toggleAdapter, 
    theme, 
    setTheme 
  } = useUIStore();

  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'scrapers' | 'preferences' | 'database' | 'about'>('ai');
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

  // About & Update State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ checked: boolean; isLatest: boolean; latestTag?: string; releaseUrl?: string; error?: string } | null>(null);

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }

    setIsDetecting(false);
  };

  const handleProviderToggle = (prov: AIProviderId) => {
    if (aiProvider === prov) {
      // already open
      return;
    }
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

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const info = await fetchLatestRelease();
      if (info) {
        const isLatest = info.tag.toLowerCase() === CURRENT_VERSION.toLowerCase();
        setUpdateStatus({
          checked: true,
          isLatest,
          latestTag: info.tag,
          releaseUrl: info.htmlUrl
        });
      }
    } catch (err) {
      setUpdateStatus({
        checked: true,
        isLatest: true,
        latestTag: CURRENT_VERSION,
        releaseUrl: 'https://github.com/Suvesh108/jobfinder/releases'
      });
    } finally {
      setIsCheckingUpdate(false);
    }
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
        const existingKeys = new Set(currentJobs.map(j => `${String(j.company).toLowerCase()}__${String(j.role).toLowerCase()}`));

        for (const j of importedJobs) {
          if (!j.company || !j.role) continue;
          const key = `${String(j.company).toLowerCase()}__${String(j.role).toLowerCase()}`;
          if (existingKeys.has(key)) {
            dupCount++;
          } else {
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
    setDbSuccessMessage('All application records have been permanently cleared.');
    setTimeout(() => setDbSuccessMessage(null), 3000);
  };

  const SUB_TABS = [
    { id: 'ai', label: 'AI Providers & API Keys', icon: Sparkles, color: 'text-cyan-400' },
    { id: 'scrapers', label: 'JobSpy Scrapers', icon: Sliders, color: 'text-indigo-400' },
    { id: 'preferences', label: 'Preferences & Theme', icon: Palette, color: 'text-purple-400' },
    { id: 'database', label: 'Database & Backups', icon: Database, color: 'text-emerald-400' },
    { id: 'about', label: 'About & Updates', icon: Info, color: 'text-sky-400' },
  ] as const;

  return (
    <div className="page-content w-full max-w-full px-3 sm:px-8 py-3 sm:py-6 pb-24 sm:pb-10 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        
        {/* Left Navigation Sub-Tabs */}
        <div className="w-full card p-2 shrink-0 flex md:flex-col overflow-x-auto md:overflow-visible gap-1.5 md:space-y-1.5 shadow-xl border scrollbar-none" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-auto md:w-full whitespace-nowrap text-left px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border shrink-0 ${
                  isActive 
                    ? 'text-text-primary shadow-xs' 
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50'
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

        {/* Right Content Area */}
        <div className="w-full min-w-0 card p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          
          {/* ══════════════════════════════════════════════════════════════
              TAB 1: AI PROVIDERS (INLINE EXPANDING ACCORDION CARDS)
              ══════════════════════════════════════════════════════════════ */}
          {activeSubTab === 'ai' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>AI Providers &amp; Auto-Detect Engine</span>
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Click any provider below to expand and configure its API keys and active models inline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAIConfig}
                  className="btn-primary text-xs px-4 py-2 flex items-center space-x-1.5 font-bold cursor-pointer shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saveSuccess ? 'Saved!' : 'Save Config'}</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <Check className="h-4 w-4 shrink-0" />
                  <span>AI configuration saved successfully! Resume generation will use these live credentials.</span>
                </div>
              )}

              {/* Accordion Provider Cards List */}
              <div className="space-y-3">
                {AI_PROVIDERS.map((prov) => {
                  const isExpanded = aiProvider === prov.id;
                  
                  return (
                    <div
                      key={prov.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isExpanded ? 'shadow-lg' : 'hover:border-cyan-500/30'
                      }`}
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: isExpanded ? prov.badgeColor : 'var(--border-subtle)',
                      }}
                    >
                      {/* Provider Card Header */}
                      <div
                        onClick={() => handleProviderToggle(prov.id)}
                        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none"
                        style={{
                          background: isExpanded ? 'var(--sidebar-item-active)' : 'transparent'
                        }}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                            style={{ background: prov.badgeColor }} 
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-text-primary truncate font-display">
                                {prov.name}
                              </span>
                              <span 
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0"
                                style={{ background: 'var(--bg-surface-raised)', color: prov.badgeColor }}
                              >
                                {prov.badge}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-text-muted line-clamp-1 mt-0.5">
                              {prov.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          {isExpanded && (
                            <span className="text-[10px] text-cyan-400 font-bold hidden sm:inline">Active</span>
                          )}
                          <div className="p-1 rounded-lg text-text-muted">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* Inline Expanded Configuration Form */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t space-y-4 animate-fade-in" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                          
                          {/* Top key link */}
                          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="text-xs font-semibold text-text-secondary">
                              Configure {prov.name} Credentials
                            </span>
                            {prov.keyDashboardUrl && (
                              <a
                                href={prov.keyDashboardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                              >
                                <span>Get API Key</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>

                          {/* API Key Input & Auto-Detect Button */}
                          {prov.id !== 'offline' && (
                            <div>
                              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                                <span className="flex items-center space-x-1.5">
                                  <Key className="h-3 w-3" />
                                  <span>API Key</span>
                                </span>
                                {prov.isFreeTier && (
                                  <span className="text-[10px] text-emerald-400 font-normal">✓ Free Tier Eligible</span>
                                )}
                              </label>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1 min-w-0">
                                  <input
                                    type={showApiKey ? 'text' : 'password'}
                                    placeholder={prov.keyPlaceholder}
                                    value={aiApiKey}
                                    onChange={(e) => {
                                      setAiApiKey(e.target.value);
                                      setDetectResult(null);
                                    }}
                                    className="w-full border rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-text-primary focus:outline-none"
                                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-2 text-text-muted hover:text-text-primary cursor-pointer"
                                    title={showApiKey ? 'Hide key' : 'Show key'}
                                  >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAutoDetectModel(aiApiKey, prov.id)}
                                  disabled={isDetecting || (!aiApiKey && prov.id !== 'custom')}
                                  className="btn-primary text-xs px-3.5 py-2 font-bold flex items-center justify-center space-x-1.5 shrink-0 disabled:opacity-40 cursor-pointer"
                                  title="Ping provider and auto-select the best working model"
                                >
                                  <Wand2 size={13} className={isDetecting ? 'animate-spin' : ''} />
                                  <span>{isDetecting ? 'Detecting...' : 'Auto-Detect Model'}</span>
                                </button>
                              </div>
                            </div>
                          )}

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

                          {/* Active Model Identifier */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center space-x-1.5">
                                <Cpu className="h-3 w-3" />
                                <span>Active Model</span>
                              </label>
                              <input
                                type="text"
                                placeholder={prov.defaultModel}
                                value={aiModel}
                                onChange={(e) => setAiModel(e.target.value)}
                                className="w-full border rounded-xl px-3.5 py-1.5 text-xs font-mono text-text-primary focus:outline-none"
                                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {prov.candidateModels.map(m => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => { setAiModel(m); setDetectResult(null); }}
                                    className={`text-[9px] px-2 py-0.5 rounded-md border font-mono transition-all cursor-pointer ${
                                      aiModel === m 
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' 
                                        : 'bg-surface-raised text-text-muted hover:text-text-primary border-subtle'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Base URL (for Ollama or Custom) */}
                            {prov.id === 'custom' && (
                              <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center space-x-1.5">
                                  <Globe className="h-3 w-3" />
                                  <span>Custom Endpoint / Base URL</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="http://localhost:11434/v1"
                                  value={aiBaseUrl}
                                  onChange={(e) => setAiBaseUrl(e.target.value)}
                                  className="w-full border rounded-xl px-3.5 py-1.5 text-xs font-mono text-text-primary focus:outline-none"
                                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                                />
                                <span className="text-[10px] text-text-muted block mt-1">
                                  Default: Ollama OpenAI-compatible endpoint
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Save CTA */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleSaveAIConfig}
                              className="btn-primary text-xs px-4 py-2 flex items-center space-x-1.5 font-bold cursor-pointer"
                            >
                              <Save size={13} />
                              <span>Save {prov.name}</span>
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: JOBSPY SCRAPERS CONFIGURATION
              ══════════════════════════════════════════════════════════════ */}
          {activeSubTab === 'scrapers' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  <span>JobSpy Multi-Channel Scraper Engine</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Toggle platform adapters used during live searches. JobFinder connects to LinkedIn, Indeed, Naukri, Glassdoor, and ZipRecruiter in parallel.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${jobspyStatus === 'running' ? 'bg-emerald-400 shadow-xs' : 'bg-amber-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">FastAPI Python Scraper Microservice</h4>
                    <p className="text-[10px] text-text-muted">JobSpy Python aggregator on Render with client-side failover fallback</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border text-emerald-400" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  {jobspyStatus === 'running' ? 'Connected' : 'Active (Local Fallback)'}
                </span>
              </div>

              {/* Scraper Toggles */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Enabled Job Board Scrapers
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adapters.map((adp) => {
                    const isEnabled = enabledAdapters.includes(adp.id);
                    return (
                      <div
                        key={adp.id}
                        onClick={() => toggleAdapter(adp.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isEnabled ? 'border-indigo-500/40' : 'opacity-60 border-subtle'
                        }`}
                        style={{ background: 'var(--bg-card)' }}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Globe className="h-4 w-4 text-indigo-400" />
                          <div>
                            <span className="text-xs font-bold text-text-primary block">{adp.name}</span>
                            <span className="text-[10px] text-text-muted">Direct JobSpy Query Pipeline</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-indigo-500 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: PREFERENCES & THEME
              ══════════════════════════════════════════════════════════════ */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <span>UI Preferences &amp; Notification Triggers</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Configure visual theme and follow-up reminder thresholds.
                </p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Application Color Scheme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'system', label: 'System Auto', icon: Monitor },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as AppTheme)}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                          isSelected ? 'border-purple-500 shadow-md ring-1 ring-purple-500/30 font-bold' : 'hover:border-slate-500/40'
                        }`}
                        style={{
                          background: isSelected ? 'var(--sidebar-item-active)' : 'var(--bg-card)',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-purple-400' : 'text-text-muted'}`} />
                        <span className="text-xs text-text-primary">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up Reminder Days */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Follow-up Stale Threshold (Days)
                </label>
                <div className="card p-4 rounded-xl border flex items-center justify-between gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center space-x-2.5">
                    <Clock className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Automatic Stale Job Flagging</span>
                      <span className="text-[10px] text-text-muted">Applications with no status change beyond this threshold show a follow-up indicator</span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={defaultReminderDays}
                    onChange={handleDaysChange}
                    className="w-20 border rounded-xl px-3 py-1.5 text-xs text-center font-bold text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: DATABASE & BACKUPS
              ══════════════════════════════════════════════════════════════ */}
          {activeSubTab === 'database' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>Offline Storage &amp; Database Backups</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  JobFinder stores all records locally in IndexedDB (Dexie.js). You have complete offline ownership of your data.
                </p>
              </div>

              {dbSuccessMessage && (
                <div className="p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{dbSuccessMessage}</span>
                </div>
              )}

              {/* Database Stats Card */}
              <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">IndexedDB Local Pipeline</h4>
                  <p className="text-[10px] text-text-muted">Stored securely in your local browser sandbox</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black font-display text-emerald-400">{allJobs.length}</span>
                  <span className="text-xs text-text-muted font-medium">applications stored</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  disabled={isExporting}
                  className="btn-secondary text-xs p-3 flex flex-col items-center justify-center space-y-1.5 cursor-pointer font-bold"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>{isExporting ? 'Exporting...' : 'Export Backup (JSON)'}</span>
                </button>

                <label className="btn-secondary text-xs p-3 flex flex-col items-center justify-center space-y-1.5 cursor-pointer font-bold">
                  <RefreshCw className={`h-4 w-4 text-cyan-400 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Importing...' : 'Import Backup (JSON)'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 border-rose-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 5: ABOUT & APP UPDATES
              ══════════════════════════════════════════════════════════════ */}
          {activeSubTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Info className="h-4 w-4 text-sky-400" />
                  <span>About JobFinder &amp; Updates</span>
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  View installed version information and check for new releases directly from GitHub.
                </p>
              </div>

              {/* Version & Info Card */}
              <div className="card p-5 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md select-none shrink-0" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' }}>
                      JF
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-black text-text-primary font-display">JobFinder</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {CURRENT_VERSION}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">AI-Powered Job Application Tracker &amp; ATS Resume Studio</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingUpdate}
                    className="btn-primary text-xs px-4 py-2 font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-md hover:scale-105 transition-all shrink-0"
                  >
                    <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin' : ''} />
                    <span>{isCheckingUpdate ? 'Checking...' : 'Check for Update'}</span>
                  </button>
                </div>

                {/* Update Result Alert */}
                {updateStatus && (
                  <div 
                    className="p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in"
                    style={{
                      background: updateStatus.isLatest ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.15)',
                      color: updateStatus.isLatest ? 'var(--status-success)' : 'var(--accent-cool)',
                      borderColor: updateStatus.isLatest ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      {updateStatus.isLatest ? <CheckCircle2 size={16} className="shrink-0" /> : <Sparkles size={16} className="shrink-0" />}
                      <span>
                        {updateStatus.isLatest 
                          ? `JobFinder ${CURRENT_VERSION} is up to date.`
                          : `New update available! (${updateStatus.latestTag})`}
                      </span>
                    </div>

                    {!updateStatus.isLatest && (
                      <a
                        href={updateStatus.releaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg border text-xs font-bold flex items-center space-x-1 shrink-0 bg-surface hover:scale-105 transition-transform cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <span>View Release</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                )}

                {/* Architecture Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="p-2.5 rounded-xl bg-surface-raised border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Frontend</span>
                    <span className="text-xs font-bold text-text-primary">React 19 + Vite</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-raised border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Engine</span>
                    <span className="text-xs font-bold text-text-primary">Multi-Scraper</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-raised border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Database</span>
                    <span className="text-xs font-bold text-text-primary">Dexie IndexedDB</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-raised border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Mobile</span>
                    <span className="text-xs font-bold text-text-primary">Capacitor Android</span>
                  </div>
                </div>
              </div>

              {/* GitHub & Open Source Links */}
              <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Open Source Repository</h4>
                  <p className="text-[10px] text-text-muted">Built with MIT license. Star or contribute on GitHub!</p>
                </div>
                <a
                  href="https://github.com/Suvesh108/jobfinder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs px-4 py-2 flex items-center justify-center space-x-1.5 font-bold shrink-0"
                >
                  <Globe size={13} />
                  <span>GitHub Repository</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Clear Database Confirmation Modal */}
      {showClearModal && (
        <ConfirmModal
          isOpen={showClearModal}
          title="Clear Entire Database?"
          message="Are you sure you want to delete all job applications, status histories, and notes? This action is permanent and cannot be undone."
          confirmText="Yes, Delete Everything"
          variant="danger"
          onConfirm={handleClearDatabase}
          onCancel={() => setShowClearModal(false)}
        />
      )}
    </div>
  );
};
