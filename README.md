# 🚀 JobFinder - Smart Job Application Tracker & Multi-Platform Aggregator

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.1-purple?logo=vite)
![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-green)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)

**JobFinder** is a modern, high-performance job application tracking & search platform built with React 19, TypeScript, Vite, Dexie IndexedDB, and Zustand. It helps tech & non-tech job seekers discover opportunities across multiple platforms (LinkedIn, Naukri, Indeed, Glassdoor, Internshala, Apify) and organize their entire job hunting pipeline in a sleek, high-density dashboard.

---

## ✨ Features & Highlights

### ⚡ 1. Multi-Platform Job Search Hub
- **Parallel Source Aggregation**: Queries active search sources concurrently using async streaming pipelines.
- **Granular Caching**: Per-role and per-adapter caching for instant results and zero redundant network requests.
- **Smart Query Expansion**: Automatically expands merged role categories into sub-queries across all job platforms.

### 💼 2. Tech & Non-Tech Composite Role Clusters
Organized into clear **Tech** and **Non-Tech** job categories with merged composite role pills for single-click selection:
- **Technical Support & IT Operations**: `Technical Support / IT Support Specialist`, `L1 / L2 / L3 Support Executive`, `Desktop & Network Support Engineer`, `Cloud Support & IT Operations`.
- **Software Engineering & Web Development**: `Software Engineer / Full Stack Developer`, `Frontend / React / Angular Developer`, `Backend / Node.js / Java / Python Developer`, `C++ / C# / Golang / PHP Developer`.
- **Cloud, DevOps & Systems Infrastructure**: `DevOps / SRE / Cloud Architect`, `System & Network Administrator`, `Database Administrator (DBA)`.
- **AI, Data & Analytics**: `Data Science / Machine Learning / AI Engineer`, `Data Engineer & Big Data Specialist`, `Data Analyst & BI Developer`.
- **Cybersecurity & QA**: `Cybersecurity & SOC Analyst`, `QA Automation & SDET Engineer`, `Manual Software Tester`.
- **Non-Tech & Business Roles**: `Customer Support (Voice / Non-Voice / Chat)`, `BPO & International Voice Process`, `Business Development (BDE / BDM)`, `Digital Marketing & SEO`, `Product Management (PM / APM / BA)`, `UI/UX & Product Design`, `HR & Talent Acquisition`, `Finance & Accounts`.

### 📊 3. High-Density Application Tracker
- **Single-Table List View**: Track applications across 7 status stages (`Wishlist`, `Applied`, `OA/Assessment`, `Interview`, `Offer`, `Rejected`, `Withdrawn`).
- **Inline Status Dropdowns**: Instant status changes with timestamp history tracking.
- **Portalled Overlays**: Clean portal mounting to `document.body` via `createPortal` for detail modals and delete confirmation popups.

### 🎯 4. Precision Search Filters & Constraints
- **Experience Level**: Fresher (0-1 yrs), Junior (1-3 yrs), Mid-Level (3-5 yrs), Senior (5+ yrs).
- **Work Mode**: Remote / WFH, Hybrid, Onsite.
- **Job Type**: Full-Time, Internship, Contract.
- **Min Salary Filter**: Multi-format CTC parser (`₹6+ LPA`, `₹10+ LPA`, `₹15+ LPA`, monthly/annual INR).
- **Company Tiers**: Filter by MAANG / Tech Giants, Indian Unicorns, and Global MNCs.
- **Date Posted**: Past 24 Hours, Past 3 Days, Past 7 Days.

### 🔒 5. Privacy-First Local Persistence
- All application data, custom tags, status history, and notes are stored locally in your browser using **IndexedDB (Dexie.js)**. No external tracking or server storage required.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tooling** | Vite 6 |
| **State Management** | Zustand |
| **Local Database** | Dexie.js (IndexedDB wrapper) |
| **UI Styling** | Custom CSS Variables + Tailwind CSS |
| **Icon Set** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Suvesh108/jobfinder.git

# Navigate to the project directory
cd jobfinder

# Install dependencies
npm install

# Start the local development server
npm run dev
```

### Production Build
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Directory Architecture

```
jobfinder/
├── src/
│   ├── adapters/            # Multi-platform job scraper & API adapters
│   │   ├── apify.ts
│   │   ├── internshalaAdapter.ts
│   │   ├── linkedinAdapter.ts
│   │   ├── naukriIndeedAdapter.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── components/          # Core Application UI Components
│   │   ├── ConfirmModal.tsx # Custom dark glass confirmation modal
│   │   ├── JobCard.tsx
│   │   ├── JobModal.tsx     # Full job details & status timeline modal
│   │   ├── SearchView.tsx   # Search hub, role selector, & results engine
│   │   ├── SettingsView.tsx # Platform toggles & database tools
│   │   ├── Sidebar.tsx      # App navigation bar
│   │   └── TrackerView.tsx  # High-density application tracker table
│   ├── db/                  # Dexie IndexedDB schema & helpers
│   │   └── schema.ts
│   ├── store/               # Global Zustand UI & state stores
│   │   └── useUIStore.ts
│   ├── utils/               # Deduplication & helper functions
│   │   ├── dedupeJobs.ts
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── index.css            # Fluent glassmorphism design system tokens
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
