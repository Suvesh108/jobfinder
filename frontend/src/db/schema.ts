import Dexie, { type Table } from 'dexie';

export interface StatusHistoryEntry {
  status: string;
  date: string; // ISO String or YYYY-MM-DD
}

export type JobStatus = 'Wishlist' | 'Applied' | 'OA/Assessment' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';

export interface JobApplication {
  id?: number;
  company: string;
  role: string;
  location: string;
  salary: string; // e.g. "12 LPA", "₹18,000/mo"
  sourceSite: string; // e.g. "Indeed", "Apna", "Naukri", etc.
  dateApplied: string; // YYYY-MM-DD
  lastStatusChange: string; // YYYY-MM-DD
  status: JobStatus;
  statusHistory: StatusHistoryEntry[];
  link: string;
  notes: string;
  tags: string[]; // e.g. "referral", "high priority", etc.
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  reminderDays?: number; // Custom reminder limit (defaults to 14)
}

export class JobTrackerDatabase extends Dexie {
  jobs!: Table<JobApplication>;

  constructor() {
    super('JobTrackerDB');
    this.version(1).stores({
      jobs: '++id, company, role, status, dateApplied, lastStatusChange, sourceSite, *tags'
    });
  }
}

export const db = new JobTrackerDatabase();
