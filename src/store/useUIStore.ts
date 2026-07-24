import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTab = 'tracker' | 'search' | 'settings';

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

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activeTab: 'search',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
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
      
      enabledAdapters: ['naukri', 'indeed', 'linkedin', 'glassdoor', 'internshala'],
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
      // Only persist settings and activeTab, filter state can reset
      partialize: (state) => ({
        activeTab: state.activeTab,
        defaultReminderDays: state.defaultReminderDays,
        enabledAdapters: state.enabledAdapters,
      }),
    }
  )
);
