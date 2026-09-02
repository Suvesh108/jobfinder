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
  name: 'SUVESH KUMAR',
  headline: 'Computer Science Graduate | Software Engineer & Technical Support Specialist',
  email: 'suvesh546@gmail.com',
  phone: '+91-6202474991',
  location: 'Bangalore, India',
  linkedinUrl: 'https://linkedin.com/in/suveshkumar',
  githubUrl: 'https://github.com/suveshkumar',
  portfolioUrl: 'https://suveshkumar.dev',
  bio: 'I am a Computer Science graduate who enjoys solving problems and understanding how things work. I am comfortable working with computers, software, and different technical tools. I learn new things quickly and enjoy sharing my knowledge and experiences with others. I like to stay organized, keep learning, and work calmly under pressure. I can work well both independently and as part of a team, and I always try to give my best in whatever I do.',
  
  // Core Skills
  skills: [
    'Java', 'JavaScript', 'TypeScript', 'SQL', 'Spring Boot', 'Node.js', 'Express.js', 'REST APIs',
    'MySQL', 'PostgreSQL', 'Dexie (IndexedDB)', 'Git', 'GitHub', 'Postman', 'Maven', 'Linux CLI',
    'TCP/IP', 'IPv4', 'Subnetting', 'DNS', 'DHCP', 'HTTP/HTTPS', 'SSH', 'Troubleshooting', 'System Validation'
  ],
  technicalSupportSkills: 'Troubleshooting, Debugging, Problem Solving, Technical Documentation, System Validation',
  operatingSystemsSkills: 'Linux, Windows',
  networkingSkills: 'TCP/IP, IPv4, Subnetting, DNS, DHCP, HTTP/HTTPS, SSH, Network Troubleshooting',
  toolsSkills: 'Git, GitHub, Postman, Maven, Linux CLI',
  languagesBackendSkills: 'Java, JavaScript, TypeScript, SQL, Spring Boot, Node.js, Express.js, REST APIs',
  databasesSkills: 'MySQL, PostgreSQL, JDBC, Dexie (IndexedDB)',

  // Education
  education: 'B.Tech in Computer Science and Engineering - Nagarjuna College of Engineering and Technology (CGPA: 7/10)',
  educationList: [
    {
      institution: 'Nagarjuna College of Engineering and Technology',
      cgpaOrGrade: 'CGPA: 7/10',
      location: 'Bangalore, India',
      degree: 'B.Tech in Computer Science and Engineering',
      years: '2021 — 2025',
    }
  ],

  // Experience
  experienceSummary: 'Frontend development internship and systems validation experience diagnosing application bugs, testing cross-browser features, and escalating ticket issues according to L1/L2 SLA protocols.',
  experienceList: [
    {
      company: 'CODTECH IT SOLUTIONS',
      location: 'Remote',
      dates: 'Jan 2025 — May 2025',
      role: 'Frontend Web Development Intern',
      certificateUrl: 'https://certificate.link',
      bullets: [
        'Diagnosed and resolved application bugs, UI issues, and data-flow errors within tight resolution windows, similar to L1/L2 ticket SLAs.',
        'Built and debugged features using HTML, CSS, and JavaScript, testing across browsers and environments for stability.',
        'Documented technical issues, troubleshooting steps, and resolutions clearly for team handoff and coordination.'
      ]
    },
    {
      company: 'Aqmnez Automation Pvt. Ltd.',
      location: 'Bangalore, India',
      dates: '1 Month (2023)',
      role: 'Systems Validation Trainee',
      certificateUrl: 'https://certificate.link',
      bullets: [
        'Identified system and configuration discrepancies against defined workflows, escalating unresolved issues – consistent with L1-to-L2 escalation protocol.',
        'Validated system setup and configuration steps across multiple test environments, maintaining accurate records.',
        'Communicated status updates and resolution steps clearly to stakeholders to keep turnaround time minimal.'
      ]
    }
  ],

  // Projects
  projectsList: [
    {
      title: 'JobFinder — Job Tracking & Search Platform',
      githubUrl: 'https://github.com/Suvesh108/jobfinder',
      bullets: [
        'Built a multi-service application (React frontend, Python/FastAPI & Node/Express backends), troubleshooting cross-service connectivity and configuration issues end-to-end.',
        'Diagnosed data-flow and API integration failures, applying structured root-cause analysis to restore stable functionality.'
      ]
    },
    {
      title: 'Universal-Shared — Cross-Platform Sharing Platform',
      githubUrl: 'https://github.com/suveshkumar/universal-shared',
      bullets: [
        'Built a real-time client-server data-sharing application, testing connectivity and file transfer across multiple devices and network conditions.',
        'Resolved multi-device synchronization and communication failures through systematic testing and debugging.'
      ]
    },
    {
      title: 'BlockVerify — Product Authentication & Supply Chain Verification',
      githubUrl: 'https://github.com/suveshkumar/blockverify',
      bullets: [
        'Developed a blockchain-based verification system on a local Hardhat network, troubleshooting smart contract deployment and integration issues.',
        'Designed anomaly-based fraud detection logic and custody-tracking workflows, documenting the system architecture end-to-end.'
      ]
    }
  ],

  // Certifications
  certificationsList: [
    {
      title: 'Oracle Cloud Infrastructure 2025 Foundations Associate',
      certificateUrl: 'https://certificate.link',
      description: 'Foundation in IT Systems, Networking, and Cloud Infrastructure'
    },
    {
      title: 'Cyber Crime Conclave Hackathon Participant',
      certificateUrl: 'https://certificate.link',
      description: 'IT Security Fundamentals & System Integrity'
    }
  ],

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
  if (profile) return profile;
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
