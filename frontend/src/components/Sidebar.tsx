import React from 'react';
import { useUIStore, type AppTheme } from '../store/useUIStore';
import { Logo } from './Logo';
import {
  KanbanSquare,
  Search,
  User,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

const THEME_OPTIONS: {
  id: AppTheme;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}[] = [
  { id: 'light',  icon: Sun,     label: 'Light'  },
  { id: 'dark',   icon: Moon,    label: 'Dark'   },
  { id: 'system', icon: Monitor, label: 'Auto'   },
];

export const TopNavbar: React.FC = () => {
  const { activeTab, setActiveTab, theme, setTheme } = useUIStore();

  return (
    <header className="app-topbar relative hidden md:flex">
      {/* ── Left: Brand / Logo ── */}
      <div className="flex items-center">
        <div 
          onClick={() => setActiveTab('search')}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity select-none"
          title="JobFinder"
        >
          <Logo size={28} />
          <span 
            className="font-display font-black text-base tracking-tight"
            style={{ 
              background: "linear-gradient(135deg, #FFFFFF 0%, #38BDF8 50%, #818CF8 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}
          >
            JobFinder
          </span>
        </div>
      </div>

      {/* ── Center: Main Navigation Tabs (Search Hub & Tracker) ── */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-1.5">
        {/* 1. Search Hub */}
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'font-bold shadow-xs' 
              : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50'
          }`}
          style={{
            background: activeTab === 'search' ? 'var(--sidebar-item-active)' : 'transparent',
            color: activeTab === 'search' ? 'var(--accent-primary)' : 'var(--text-muted)',
            border: activeTab === 'search' ? '1px solid var(--border-highlight)' : '1px solid transparent'
          }}
        >
          <Search size={14} className={activeTab === 'search' ? 'text-primary' : ''} />
          <span>Search Job</span>
        </button>

        {/* 2. Tracker */}
        <button
          type="button"
          onClick={() => setActiveTab('tracker')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'tracker'
              ? 'font-bold shadow-xs' 
              : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50'
          }`}
          style={{
            background: activeTab === 'tracker' ? 'var(--sidebar-item-active)' : 'transparent',
            color: activeTab === 'tracker' ? 'var(--accent-primary)' : 'var(--text-muted)',
            border: activeTab === 'tracker' ? '1px solid var(--border-highlight)' : '1px solid transparent'
          }}
        >
          <KanbanSquare size={14} className={activeTab === 'tracker' ? 'text-primary' : ''} />
          <span>Tracker</span>
        </button>

        {/* 3. Candidate Profile */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'font-bold shadow-xs' 
              : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50'
          }`}
          style={{
            background: activeTab === 'profile' ? 'var(--sidebar-item-active)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--accent-primary)' : 'var(--text-muted)',
            border: activeTab === 'profile' ? '1px solid var(--border-highlight)' : '1px solid transparent'
          }}
        >
          <User size={14} className={activeTab === 'profile' ? 'text-primary' : ''} />
          <span>Candidate Profile</span>
        </button>
      </nav>

      {/* ── Right Corner: Settings & Theme Switcher ── */}
      <div className="flex items-center space-x-2.5">
        {/* Settings Button */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'font-bold shadow-xs' 
              : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
          }`}
          style={{
            background: activeTab === 'settings' ? 'var(--sidebar-item-active)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-muted)',
            border: activeTab === 'settings' ? '1px solid var(--border-highlight)' : '1px solid transparent'
          }}
          title="Settings & Scrapers"
        >
          <Settings size={14} className={activeTab === 'settings' ? 'text-primary' : ''} />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {/* 3-Way Theme Switcher */}
        <div 
          className="flex items-center p-0.5 rounded-xl border"
          style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
        >
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  isSelected ? 'bg-card text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
                }`}
                style={{
                  background: isSelected ? 'var(--bg-card)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
                title={`${opt.label} Theme`}
              >
                <Icon size={13} />
                <span className="hidden lg:inline text-[11px]">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export const Sidebar = TopNavbar;
export const Navbar = TopNavbar;
export const MobileTopBar: React.FC = () => null;
