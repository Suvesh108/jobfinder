import React from 'react';
import { useUIStore } from '../store/useUIStore';
import { useDiscoveredJobsStore } from '../store/useDiscoveredJobsStore';
import { Layers } from 'lucide-react';
import { Logo } from './Logo';
import {
  Search,
  KanbanSquare,
  User,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const { activeTab, setActiveTab, theme, setTheme } = useUIStore();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'search': return 'Search Jobs';
      case 'found_jobs': return 'Found Jobs';
      case 'tracker': return 'Application Tracker';
      case 'profile': return 'Candidate Profile (Beta)';
      case 'settings': return 'Settings & AI';
      default: return 'JobFinder';
    }
  };

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const CurrentThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header 
      className="mobile-header md:hidden sticky top-0 z-[900] w-full px-4 py-2.5 flex items-center justify-between border-b backdrop-blur-xl shrink-0 select-none"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left Placeholder for Symmetrical Centering */}
      <div 
        onClick={() => setActiveTab('search')} 
        className="cursor-pointer p-1 rounded-xl hover:opacity-80 transition-opacity"
        title="JobFinder"
      >
        <Logo size={26} />
      </div>

      {/* Center: Brand Name & Active Page Subtitle */}
      <div 
        onClick={() => setActiveTab('search')} 
        className="flex flex-col items-center justify-center text-center cursor-pointer"
      >
        <span 
          className="font-display font-black text-base tracking-tight leading-tight"
          style={{ 
            background: "linear-gradient(135deg, #FFFFFF 0%, #38BDF8 50%, #818CF8 100%)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}
        >
          JobFinder
        </span>
        <span className="text-[10px] text-text-muted font-bold tracking-wide uppercase">
          {getTabTitle()}
        </span>
      </div>

      {/* Right: Quick Theme Switcher Button */}
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className="p-2 rounded-xl border flex items-center justify-center text-text-muted hover:text-text-primary transition-all cursor-pointer shadow-xs shrink-0"
        style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
        title="Toggle Theme"
      >
        <CurrentThemeIcon size={14} />
      </button>
    </header>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  const foundCount = useDiscoveredJobsStore((state) => state.foundJobs.length);

  const navItems = [
    { id: 'search', label: 'Search', icon: Search, badge: null },
    { id: 'found_jobs', label: 'Found', icon: Layers, badge: foundCount > 0 ? foundCount : null },
    { id: 'tracker', label: 'Tracker', icon: KanbanSquare, badge: null },
    { id: 'profile', label: 'Profile', icon: User, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ] as const;

  return (
    <nav 
      className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-[950] border-t backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb select-none"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.35)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer relative ${
              isActive 
                ? 'text-cyan-400 font-bold' 
                : 'text-text-muted hover:text-text-primary opacity-80'
            }`}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <span 
                className="absolute -top-1 w-8 h-1 rounded-full bg-cyan-400 shadow-xs animate-scale-up" 
                style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}
              />
            )}

            <div className={`p-1 rounded-lg transition-transform relative ${isActive ? 'scale-110' : ''}`}>
              <Icon size={17} />
              {item.badge && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-black bg-cyan-500 text-black leading-none animate-scale-up">
                  {item.badge}
                </span>
              )}
            </div>
            
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
