import React from 'react';
import { useUIStore, type AppTab, type AppTheme } from '../store/useUIStore';
import {
  KanbanSquare,
  Search,
  Settings,
  Zap,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

/* ─── Nav Items ─────────────────────────────────────────────────── */
const NAV_ITEMS: {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}[] = [
  { id: 'search',   label: 'Search Hub',   icon: Search,       badge: 'Live' },
  { id: 'tracker',  label: 'Tracker',      icon: KanbanSquare               },
  { id: 'settings', label: 'Settings',     icon: Settings                   },
];

/* ─── Theme Options ──────────────────────────────────────────────── */
const THEME_OPTIONS: {
  id: AppTheme;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}[] = [
  { id: 'light',  icon: Sun,     label: 'Light Mode'  },
  { id: 'dark',   icon: Moon,    label: 'Dark Mode'   },
  { id: 'system', icon: Monitor, label: 'System Mode' },
];

/* ═══════════════════════════════════════════════════════════════════
   PERMANENT COMPACT ICON-RAIL SIDEBAR
   ═══════════════════════════════════════════════════════════════════ */
export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, theme, setTheme } = useUIStore();

  return (
    <aside className="app-sidebar">

      {/* ── Brand / Logo ── */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-mark" title="JobFinder PRO">
          <Zap size={18} />
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* ── Navigation (Icon Rail) ── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
              title={item.label}
            >
              <Icon size={18} className="sidebar-nav-icon" />
            </button>
          );
        })}
      </nav>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Footer: Status + Theme toggle ── */}
      <div className="sidebar-footer">
        <div className="sidebar-status-row" title="Local Engine Active">
          <span className="sidebar-status-dot" />
        </div>
        <div className="sidebar-theme-row">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`sidebar-theme-btn${theme === opt.id ? ' active' : ''}`}
                title={opt.label}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MOBILE TOP BAR (≤ 768px)
   ═══════════════════════════════════════════════════════════════════ */
export const MobileTopBar: React.FC = () => {
  const { activeTab, setActiveTab, theme, setTheme } = useUIStore();

  return (
    <div className="mobile-topbar">
      {/* Brand */}
      <div className="mobile-topbar-brand">
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #06B6D4 100%)',
            display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', color: 'white',
          }}
        >
          <Zap size={14} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
          JobFinder
        </span>
      </div>

      {/* Nav icons */}
      <div className="mobile-topbar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-topbar-btn${isActive ? ' active' : ''}`}
              title={item.label}
            >
              <Icon size={17} />
            </button>
          );
        })}

        {/* Theme toggle (cycle) */}
        <button
          className="mobile-topbar-btn"
          onClick={() => {
            const next: AppTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
            setTheme(next);
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} style={{ color: '#FBBF24' }} /> : theme === 'light' ? <Moon size={16} style={{ color: '#94A3B8' }} /> : <Monitor size={16} />}
        </button>
      </div>
    </div>
  );
};

/* Backward compat alias — App.tsx still imports `Navbar` */
export const Navbar = Sidebar;
