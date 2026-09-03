import { useEffect } from 'react';
import { updatePageSEO } from './utils/seoHelper';
import { Sidebar } from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNavigation';
import { TrackerView } from './components/TrackerView';
import { SearchView } from './components/SearchView';
import { FoundJobsView } from './components/FoundJobsView';
import { SettingsView } from './components/SettingsView';
import { NotificationBanner } from './components/NotificationBanner';
import { ProfileView } from './components/ProfileView';
import { AIChatCopilot } from './components/AIChatCopilot';
import { useUIStore, applyThemeToDocument } from './store/useUIStore';

export default function App() {
  const activeTab = useUIStore((state) => state.activeTab);

  useEffect(() => {
    updatePageSEO(activeTab);
  }, [activeTab]);
  const theme     = useUIStore((state) => state.theme);

  /* Apply theme to <html data-theme="..."> */
  useEffect(() => {
    applyThemeToDocument(theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (useUIStore.getState().theme === 'system') {
        applyThemeToDocument('system');
      }
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, [theme]);


  return (
    <div className="app-shell">
      {/* ── Top In-App Notifications (Search % & Updates) ── */}
      <NotificationBanner />
      {/* ── Left Sidebar (desktop) ── */}
      <Sidebar />

      {/* ── Main Area ── */}
      <div className="app-main">

        {/* ── Mobile Top Bar (≤768px) ── */}
        <MobileHeader />

        {/* ── Page Views ── */}
        <div
          className="page-container animate-scale-up"
          style={{ display: activeTab === 'search' ? 'flex' : 'none' }}
        >
          <SearchView />
        </div>
        <div
          className="page-container animate-scale-up"
          style={{ display: activeTab === 'found_jobs' ? 'flex' : 'none' }}
        >
          <FoundJobsView />
        </div>
        <div
          className="page-container animate-scale-up"
          style={{ display: activeTab === 'tracker' ? 'flex' : 'none' }}
        >
          <TrackerView />
        </div>
        <div
          className="page-container animate-scale-up"
          style={{ display: activeTab === 'profile' ? 'flex' : 'none' }}
        >
          <ProfileView />
        </div>
        <div
          className="page-container animate-scale-up"
          style={{ display: activeTab === 'settings' ? 'flex' : 'none' }}
        >
          <SettingsView />
        </div>

      </div>

      {/* ── Floating AI Resume Copilot (Bottom Left) ── */}
      <AIChatCopilot />
      <MobileBottomNav />
    </div>
  );
}
