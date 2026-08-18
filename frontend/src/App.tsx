import { useEffect } from 'react';
import { Sidebar, MobileTopBar } from './components/Sidebar';
import { TrackerView } from './components/TrackerView';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { useUIStore, applyThemeToDocument } from './store/useUIStore';

export default function App() {
  const activeTab = useUIStore((state) => state.activeTab);
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
      {/* ── Left Sidebar (desktop) ── */}
      <Sidebar />

      {/* ── Main Area ── */}
      <div className="app-main">

        {/* ── Mobile Top Bar (≤768px) ── */}
        <MobileTopBar />

        {/* ── Page Views ── */}
        <div
          className="page-container animate-fade-in"
          style={{ display: activeTab === 'search' ? 'flex' : 'none' }}
        >
          <SearchView />
        </div>
        <div
          className="page-container animate-fade-in"
          style={{ display: activeTab === 'tracker' ? 'flex' : 'none' }}
        >
          <TrackerView />
        </div>
        <div
          className="page-container animate-fade-in"
          style={{ display: activeTab === 'settings' ? 'flex' : 'none' }}
        >
          <SettingsView />
        </div>

      </div>
    </div>
  );
}
