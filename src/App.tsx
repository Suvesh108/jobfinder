import { Navbar } from './components/Sidebar';
import { TrackerView } from './components/TrackerView';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { useUIStore } from './store/useUIStore';

export default function App() {
  const activeTab = useUIStore((state) => state.activeTab);

  return (
    <div className="relative flex flex-col h-screen w-screen bg-void text-text-primary overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(91,140,255,0.04)_0%,transparent_70%)] pointer-events-none blur-3xl animate-ambient-glow" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(242,184,75,0.02)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      {/* ── TOP NAVBAR ── */}
      <Navbar />

      {/* ── PAGE CONTENT ── */}
      <main className="relative flex-1 min-h-0 bg-transparent z-10 flex">
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${activeTab === 'search' ? '' : 'hidden'}`}>
          <SearchView />
        </div>
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${activeTab === 'tracker' ? '' : 'hidden'}`}>
          <TrackerView />
        </div>
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${activeTab === 'settings' ? '' : 'hidden'}`}>
          <SettingsView />
        </div>
      </main>
    </div>
  );
}
