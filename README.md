# 🚀 JobFinder - AI-Powered Job Application Tracker & Multi-Channel Aggregator

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.1-purple?logo=vite)
![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-green)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)
![Android](https://img.shields.io/badge/Android-APK%20Available-3DDC84?logo=android)
![Capacitor](https://img.shields.io/badge/Capacitor-Android%20Native-119EFF?logo=capacitor)

**JobFinder** is a modern, high-performance job application tracking, multi-channel aggregation, and AI resume engineering platform. Built with **React 19, TypeScript, Vite, Dexie.js (IndexedDB), Tailwind CSS, and Capacitor for Android**, it empowers job seekers to discover opportunities across top platforms, manage their application pipeline in a unified dashboard, and automatically tailor ATS-compliant resumes using cutting-edge AI models.

---

## ✨ Key Features & Capabilities

### 🔍 1. Luxury "Search Job" Command Center
- **Parallel Aggregator Engine**: Queries top job platforms (*LinkedIn, Naukri, Indeed, Glassdoor, ZipRecruiter*) concurrently with async streaming pipelines.
- **Unified Discovery View**: Seamless search command bar with multi-role selection, location autocomplete, and instant live results on a single page.
- **Real-Time Progress Tracking**: Visual progress bar with animated cyan-to-emerald gradient and source breakdown badges during scans.
- **Smart Role Clustering**: Instant toggling between **Tech & Engineering** and **Business & Operations** role presets.
- **Precision Filters**: Experience levels (*Fresher to Senior*), work modes (*Remote, Hybrid, Onsite*), job types, salary thresholds (INR/LPA), and company tiers (*MAANG, Unicorns, MNCs*).

---

### 🤖 2. Intelligent AI Chat Copilot (Drag-and-Drop)
- **Interactive Floating Copilot**: Permanently anchored in the bottom-right corner with fluid spring transitions and responsive drawer states.
- **HTML5 Drag-and-Drop Workflow**: Drag any job card from the Application Tracker directly onto the AI Copilot button or chat window to trigger immediate, role-tailored resume synthesis.
- **Dual-Context Awareness**: Cross-references verified **Candidate Profile** details with target job descriptions to generate tailored summaries, prioritized core skills, and quantifiable STAR bullet points.
- **Strict Domain Guardrails**: Hard-constrained to assist exclusively with resume customization, candidate profiles, and job application materials.
- **Status Awareness**: Intelligently detects whether an AI provider is connected and provides 1-click navigation to Settings when an API key is needed.

---

### 📄 3. Candidate Profile & Jake's ATS Resume Generator
- **Live A4 WYSIWYG Resume Paper**: Real-time rendering of Jake's single-column ATS resume layout with high-contrast typography and realistic paper elevation.
- **In-Browser LaTeX Editor (`Edit .tex`)**: View and modify live `.tex` markup directly in an interactive full-screen code editor with 1-click actions:
  - 📋 **Copy Code** for Overleaf.
  - 📥 **Download .tex** file.
  - 🖨️ **Print / Save as PDF**.
  - ✨ **Recreate with AI** to synthesize fresh bullets from candidate profile state.
- **Deep Granular Profile Editor**: Dedicated repeaters for **Education**, **Work Experience** (with bullet-point repeaters), **Technical Projects**, and **Certifications**, plus categorized skills (*Technical Support, OS, Networking, Tools, Backend, Databases*).

---

### 🌐 4. Multi-Provider AI Hub & Auto-Detect Engine
- **Universal Provider Support**: Connect free or paid API keys from:
  - ⚡ **Google Gemini** (*Gemini 2.0 Flash / 1.5 Flash Free Tier*)
  - 🔀 **OpenRouter** (*DeepSeek R1, Llama 3.3, Mistral, Qwen Free Models*)
  - 🟢 **NVIDIA NIM** (*1,000 Free Credits on Llama 3.1 405B / Nemotron*)
  - ⚡ **Groq Cloud** (*Llama 3.3 70B Versatile, Mixtral 8x7B*)
  - 🧠 **DeepSeek** (*DeepSeek Chat & DeepSeek Reasoner*)
  - 🔮 **Mistral AI**, **OpenAI (GPT-4o / GPT-4o-mini)**, and **Custom / Ollama**.
- **Auto-Detect Model Engine**: Pings provider candidate models, measures latency (`⚡ 142ms`), and automatically discovers and locks the fastest active working model.

---

### 📋 5. High-Density Application Tracker
- **Pure List & Kanban Workflow**: Track applications across 7 status stages (`Wishlist`, `Applied`, `OA/Assessment`, `Interview`, `Offer`, `Rejected`, `Withdrawn`).
- **Custom Frosted Glass Dropdowns**: Glowing status select menus with stage-colored indicators and zero unstyled native elements.
- **Deduplication Engine**: Automatically identifies duplicate job postings across platforms using normalized role and company hashing.

---

### 🪄 6. Physics-Based Motion & Animation System
- **Custom Spring Curves**: Smooth `cubic-bezier(0.16, 1, 0.3, 1)` transitions for fluid interactions.
- **Micro-Interactions**: Hover elevation lift (`-2.5px`) with ambient depth shadows, tactile button compression (`scale(0.96)`), and glowing pulse rings on active elements.
- **Seamless Page Transitions**: Native-feeling animated scale-up transitions between tabs.

---

### 🔒 7. Privacy-First Local Persistence
- **Zero Cloud Lock-In**: Candidate profile data, tracked applications, notes, and API keys are stored locally in your browser using **IndexedDB (Dexie.js)**.
- **Database Tools**: 1-click JSON database export and backup restoration in Settings.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tooling** | Vite 6 |
| **State Management** | Zustand |
| **Local Database** | Dexie.js (IndexedDB wrapper) |
| **Styling & Motion** | Tailwind CSS + Custom CSS Variables + Spring Keyframes |
| **Icons** | Lucide React |
| **AI Integration** | Direct Multi-Provider REST Pipelines (Gemini, OpenRouter, NVIDIA, Groq, DeepSeek, OpenAI) |
| **Backend Scraper** | FastAPI + Python JobSpy Service (Optional) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Suvesh108/jobfinder.git

# 2. Navigate to project root
cd jobfinder

# 3. Install frontend dependencies
cd frontend
npm install

# 4. Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
cd frontend
npm run build
npm run preview
```

---

## 📁 Project Architecture

```
jobfinder/
├── frontend/                     # React 19 + TypeScript + Vite Application
│   ├── src/
│   │   ├── adapters/            # Multi-platform job scraper & aggregator adapters
│   │   ├── components/          # UI Components
│   │   │   ├── AIChatCopilot.tsx        # Floating AI Copilot with Drag-and-Drop
│   │   │   ├── CustomDropdown.tsx       # Frosted glass custom dropdowns
│   │   │   ├── JobCard.tsx              # Job card layout & action toolbar
│   │   │   ├── JobModal.tsx             # Job details and stage editor
│   │   │   ├── ProfileView.tsx          # Deep Candidate Profile Editor
│   │   │   ├── ResumePreview.tsx        # Jake's ATS Resume & LaTeX Editor
│   │   │   ├── SearchView.tsx           # Search Job Luxury Command Center
│   │   │   ├── SettingsView.tsx         # AI Providers & System Configuration
│   │   │   ├── Sidebar.tsx              # Top Navigation Bar
│   │   │   └── TrackerView.tsx          # Application Tracker with Draggable rows
│   │   ├── db/                          # Dexie IndexedDB database schemas
│   │   ├── store/                       # Zustand global state stores
│   │   ├── utils/
│   │   │   ├── aiService.ts             # Multi-Provider AI Engine & auto-detection
│   │   │   └── dedupeJobs.ts            # Job deduplication logic
│   │   ├── App.tsx                      # Root Application Controller
│   │   └── index.css                    # Design system tokens & animation keyframes
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # Python FastAPI Scraper Microservice (JobSpy)
│   └── scraper-service-py/
│       ├── main.py
│       └── requirements.txt
├── package.json                  # Root workspace scripts
└── README.md
```

---

## 📱 Android Native App & APK Releases

JobFinder is powered by **Capacitor**, providing a native Android experience with hardware acceleration, responsive safe-area insets, and full offline persistence.

### 📥 Direct APK Download
The pre-compiled debug APK is available in the [`release/`](release/) directory:
- **File**: `release/JobFinder-v1.0.0-debug.apk`

### 🛠️ Building the Android APK Locally
```bash
# 1. Build the web application
cd frontend
npm run build

# 2. Sync web assets with Capacitor Android
npx cap sync android

# 3. Assemble the Android APK with Gradle
cd android
./gradlew assembleDebug
# Generated APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### 🚀 Automated GitHub Releases
Whenever a version tag is pushed (e.g., `git tag v1.0.0 && git push origin v1.0.0`), the GitHub Actions workflow [`.github/workflows/build-and-release-apk.yml`](.github/workflows/build-and-release-apk.yml) automatically compiles the APK and attaches it as a downloadable release asset!

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
