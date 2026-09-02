import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JobListing } from '../adapters';

interface DiscoveredJobsStore {
  foundJobs: JobListing[];
  isSearching: boolean;
  searchProgress: number;
  lastSearchQuery: string;
  lastSearchLocation: string;
  
  setFoundJobs: (jobs: JobListing[]) => void;
  appendFoundJobs: (jobs: JobListing[]) => void;
  clearFoundJobs: () => void;
  setIsSearching: (val: boolean) => void;
  setSearchProgress: (val: number) => void;
  setLastSearch: (query: string, location: string) => void;
}

export const useDiscoveredJobsStore = create<DiscoveredJobsStore>()(
  persist(
    (set) => ({
      foundJobs: [],
      isSearching: false,
      searchProgress: 0,
      lastSearchQuery: '',
      lastSearchLocation: '',

      setFoundJobs: (jobs) => set({ foundJobs: jobs }),
      appendFoundJobs: (newJobs) => 
        set((state) => {
          const existingKeys = new Set(state.foundJobs.map(j => `${j.company.toLowerCase()}__${j.title.toLowerCase()}`));
          const uniqueNew = newJobs.filter(j => !existingKeys.has(`${j.company.toLowerCase()}__${j.title.toLowerCase()}`));
          return { foundJobs: [...uniqueNew, ...state.foundJobs] };
        }),
      clearFoundJobs: () => set({ foundJobs: [] }),
      setIsSearching: (val) => set({ isSearching: val }),
      setSearchProgress: (val) => set({ searchProgress: val }),
      setLastSearch: (query, location) => set({ lastSearchQuery: query, lastSearchLocation: location }),
    }),
    {
      name: 'jobfinder-discovered-jobs',
      partialize: (state) => ({
        foundJobs: state.foundJobs,
        lastSearchQuery: state.lastSearchQuery,
        lastSearchLocation: state.lastSearchLocation,
      }),
    }
  )
);
