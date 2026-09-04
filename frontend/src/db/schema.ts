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

export interface EducationEntry {
  institution: string;
  cgpaOrGrade: string;
  location: string;
  degree: string;
  years: string;
}

export interface ExperienceEntry {
  company: string;
  location: string;
  dates: string;
  role: string;
  certificateUrl?: string;
  bullets: string[];
}

export interface ProjectEntry {
  title: string;
  githubUrl?: string;
  liveUrl?: string;
  bullets: string[];
}

export interface CertificationEntry {
  title: string;
  certificateUrl?: string;
  description: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  
  // Categorized Core Skills (Jake's / ATS format)
  technicalSupportSkills?: string;
  operatingSystemsSkills?: string;
  networkingSkills?: string;
  toolsSkills?: string;
  languagesBackendSkills?: string;
  databasesSkills?: string;

  // Structured Resume Sections
  educationList?: EducationEntry[];
  experienceList?: ExperienceEntry[];
  projectsList?: ProjectEntry[];
  certificationsList?: CertificationEntry[];

  experienceSummary: string;
  education: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  notionToken?: string;
  notionDatabaseId?: string;
  aiApiKey?: string;
  aiProvider?: 'offline' | 'gemini' | 'openrouter' | 'nvidia' | 'groq' | 'deepseek' | 'mistral' | 'openai' | 'cohere' | 'anthropic' | 'custom';
  aiBaseUrl?: string;
  aiModel?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  headline: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  bio: '',
  skills: [],
  technicalSupportSkills: '',
  operatingSystemsSkills: '',
  networkingSkills: '',
  toolsSkills: '',
  languagesBackendSkills: '',
  databasesSkills: '',
  education: '',
  educationList: [],
  experienceSummary: '',
  experienceList: [],
  projectsList: [],
  certificationsList: [],
  aiProvider: 'offline',
};

export class JobTrackerDatabase extends Dexie {
  jobs!: Table<JobApplication>;
  profiles!: Table<UserProfile>;

  constructor() {
    super('JobTrackerDB');
    this.version(1).stores({
      jobs: '++id, company, role, status, dateApplied, lastStatusChange, sourceSite, *tags'
    });
    this.version(2).stores({
      jobs: '++id, company, role, status, dateApplied, lastStatusChange, sourceSite, *tags',
      profiles: '++id'
    });
  }
}

export const db = new JobTrackerDatabase();

export async function getUserProfile(): Promise<UserProfile> {
  const profile = await db.profiles.toCollection().first();
  if (profile) {
    // If an existing DB had pre-fed personal profile data, reset to clean blank state
    const profileStr = JSON.stringify(profile);
    if (
      profile.name === 'SUVESH KUMAR' || 
      profile.email === 'suvesh546@gmail.com' ||
      profile.phone?.includes('6202474991') ||
      profileStr.includes('Nagarjuna') ||
      profileStr.includes('CODTECH')
    ) {
      await db.profiles.clear();
      const id = await db.profiles.add({ ...DEFAULT_USER_PROFILE });
      return { ...DEFAULT_USER_PROFILE, id };
    }
    return profile;
  }
  const id = await db.profiles.add({ ...DEFAULT_USER_PROFILE });
  return { ...DEFAULT_USER_PROFILE, id };
}

export async function saveUserProfile(profileData: Partial<UserProfile>): Promise<void> {
  const existing = await db.profiles.toCollection().first();
  if (existing && existing.id) {
    await db.profiles.update(existing.id, profileData);
  } else {
    await db.profiles.add({ ...DEFAULT_USER_PROFILE, ...profileData });
  }
}
