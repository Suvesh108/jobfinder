import React from 'react';
import { useUIStore, type AppTab } from '../store/useUIStore';
import { 
  KanbanSquare, 
  Search, 
  Settings, 
  Menu,
  X,
  Zap
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const menuItems = [
    { id: 'search'   as AppTab,  label: 'Search Jobs', icon: Search },
    { id: 'tracker' as AppTab,   label: 'Tracker',   icon: KanbanSquare },
    { id: 'settings' as AppTab,  label: 'Settings',  icon: Settings },
  ];

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* ── TOP NAVBAR ── */}
      <nav
        className="sticky top-0 z-50 w-full shrink-0"
        style={{
          background: 'rgba(8, 10, 16, 0.75)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* ── LOGO / BRAND ── */}
          <div className="flex items-center space-x-2.5 select-none shrink-0">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B8CFF 0%, #F2B84B 100%)' }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-display font-bold text-text-primary tracking-tight leading-none">
                jobfinder
              </span>
              <span
                className="block text-[8px] font-semibold tracking-widest uppercase leading-none mt-0.5"
                style={{ color: 'var(--accent-cool)' }}
              >
                Campaign Hub
              </span>
            </div>
          </div>

          {/* ── DESKTOP NAV PILLS ── */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className="relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group active:scale-95 cursor-pointer"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(91, 140, 255, 0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(91, 140, 255, 0.15)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <Icon
                    className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: isActive ? 'var(--accent-cool)' : 'inherit' }}
                  />
                  <span>{item.label}</span>

                  {/* Active underline bar with glow */}
                  {isActive && (
                    <span
                      className="absolute -bottom-[9px] left-4 right-4 h-[2px] rounded-full shadow-[0_0_12px_rgba(91,140,255,0.8)]"
                      style={{ background: 'linear-gradient(90deg, transparent, var(--accent-cool), transparent)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── DESKTOP: Status pill ── */}
          <div className="hidden md:flex items-center space-x-2 select-none">
            <span
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide"
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: 'var(--status-success)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span>Local Mode</span>
            </span>
          </div>

          {/* ── MOBILE: Hamburger ── */}
          <button
            className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

        </div>

        {/* ── MOBILE DROPDOWN MENU ── */}
        <div
          className="md:hidden overflow-hidden transition-all duration-200"
          style={{
            maxHeight: isMobileOpen ? '400px' : '0px',
            borderTop: isMobileOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
        >
          <div className="px-4 py-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(91,140,255,0.12)' : 'rgba(255,255,255,0.02)',
                    borderLeft: isActive ? '3px solid var(--accent-cool)' : '3px solid transparent',
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: isActive ? 'var(--accent-cool)' : 'inherit' }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};
