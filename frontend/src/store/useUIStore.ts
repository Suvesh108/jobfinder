import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTab = 'search' | 'found_jobs' | 'tracker' | 'profile' | 'settings';
export type AppTheme = 'dark' | 'light' | 'system';

export interface TrackerFilters {
  search: string;
  status: string;
  source: string;
  tag: string;
  dateStart: string;
  dateEnd: string;
}

interface UIStore {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  
  // Theme Management
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Tracker Filters
  filters: TrackerFilters;
  setFilters: (filters: Partial<TrackerFilters>) => void;
  resetFilters: () => void;
  
  // Settings (Persistent)
  defaultReminderDays: number;
  setDefaultReminderDays: (days: number) => void;
  enabledAdapters: string[];
  toggleAdapter: (id: string) => void;
  setEnabledAdapters: (ids: string[]) => void;
}

export const applyThemeToDocument = (theme: AppTheme) => {
  const root = document.documentElement;
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activeTab: 'search',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },

      filters: {
        search: '',
        status: 'all',
        source: 'all',
        tag: 'all',
        dateStart: '',
        dateEnd: '',
      },
      setFilters: (newFilters) => 
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      resetFilters: () => 
        set({
          filters: {
            search: '',
            status: 'all',
            source: 'all',
            tag: 'all',
            dateStart: '',
            dateEnd: '',
          }
        }),
      
      // Settings defaults
      defaultReminderDays: 14,
      setDefaultReminderDays: (days) => set({ defaultReminderDays: days }),
      
      enabledAdapters: ['naukri', 'indeed', 'linkedin', 'glassdoor', 'zip_recruiter', 'ats_greenhouse', 'ats_lever', 'ats_ashby'],
      toggleAdapter: (id) => 
        set((state) => {
          const enabled = state.enabledAdapters.includes(id)
            ? state.enabledAdapters.filter((item) => item !== id)
            : [...state.enabledAdapters, id];
          return { enabledAdapters: enabled };
        }),
      setEnabledAdapters: (ids) => set({ enabledAdapters: ids }),
    }),
    {
      name: 'job-tracker-ui-store',
      partialize: (state) => ({
        activeTab: state.activeTab,
        theme: state.theme,
        defaultReminderDays: state.defaultReminderDays,
        enabledAdapters: state.enabledAdapters,
      }),
    }
  )
);
