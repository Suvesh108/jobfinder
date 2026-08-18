export interface JobListing {
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  source: string;
  postedDate: string; // YYYY-MM-DD
  description: string;
  alsoOn?: string[];
}

export interface JobAdapter {
  id: string;
  name: string;
  fetchJobs: (query: string, location: string, postedAfter?: string) => Promise<JobListing[]>;
}
