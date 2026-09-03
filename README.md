# 🚀 JobFinder v2.0 — Autonomous Multi-Portal Job Finder & ATS Resume Studio

[![Release](https://img.shields.io/github/v/release/Suvesh108/jobfinder?color=06B6D4&label=Latest%20Release)](https://github.com/Suvesh108/jobfinder/releases/latest)
[![Android APK](https://img.shields.io/badge/Download-Android%20APK-3DDC84?logo=android&logoColor=white)](https://github.com/Suvesh108/jobfinder/releases/latest)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB%20100%25%20Private-059669)](https://dexie.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

**JobFinder** is India's #1 fast, autonomous, multi-portal job finder and local-first career operating system. Search verified live openings simultaneously across **Naukri, Indeed, LinkedIn, Internshala, Shine, Freshersworld, Apna, Glassdoor & Instahyre** with **100% guaranteed genuine URLs (zero broken links)**, craft ATS-compliant single-column resumes with an in-browser LaTeX editor, and track your applications with complete local privacy.

---

## ⚡ Quick Download

📱 **Android APK**: Download the latest installable build from [GitHub Releases](https://github.com/Suvesh108/jobfinder/releases/latest) → `JobFinder-v2.0.0.apk`.  
💻 **Desktop / Web**: Clone and run locally in under 2 minutes with complete offline IndexedDB persistence.

---

## 🌟 Key Features

### 🔍 1. Autonomous 9-Portal Parallel Job Scanner
- **Direct Multi-Portal Crawling**: Concurrent live searches across:
  - 🌐 **Naukri.com** (India's premier corporate portal)
  - 💼 **LinkedIn Jobs** (Direct hiring & tech roles)
  - 🔎 **Indeed India** (High-volume enterprise & SMB roles)
  - 🎓 **Internshala** (Dedicated fresher & internship openings)
  - ✨ **Shine.com** (Corporate & mid-senior positions)
  - 🚀 **Freshersworld** (0–1 Yrs entry-level specialist roles)
  - 📱 **Apna.co** (Growth & fast-track hiring)
  - 🏢 **Glassdoor India** (Verified company openings with salary insights)
  - ⚡ **Instahyre** (Fast-growing startups & top tech engineering)
- **100% Verified Real URLs**: Advanced validation guarantees zero 404 broken links or dead redirects.
- **Unified Command Center**: Select custom target roles, input any city/remote location, and stream results in parallel with real-time scan progress.
- **Industry Presets**: One-click toggling between **⚡ Tech & Engineering** and **💼 Business & Operations**.

---

### 📄 2. Jake's ATS Resume Studio & In-Browser LaTeX Editor
- **Jake's Resume Standard**: Pixel-perfect rendering of the battle-tested single-column ATS resume layout preferred by FAANG/top tech recruiters.
- **WYSIWYG Paper Preview**: Real-time A4 visual paper preview with reactive data binding to your candidate profile.
- **Live In-Browser LaTeX (`.tex`) Editor**:
  - 📋 **Copy LaTeX Code** for instant import into Overleaf.
  - 📥 **Download `.tex` File** for local compilation.
  - 🖨️ **Print & Export to PDF** directly from your browser.
  - ✨ **AI Resume Tailoring**: Automatically optimize bullet points for target job descriptions using STAR methodology.

---

### 🔒 3. 100% Local-First Data Privacy (Zero Cloud Dependency)
- **Browser-Sandboxed Database**: Powered by **Dexie.js (IndexedDB)**. Your profile details, resumes, and application tracking data remain strictly on your device.
- **Zero Pre-Seeded Tracking**: Clean template profile with zero hardcoded tracking. Anyone cloning the repository starts with a completely private blank slate.
- **JSON Backup & Restore**: Export your full job application pipeline and profile into encrypted/portable JSON with 1-click import.

---

### 📱 4. Native Android Application
- **Capacitor Android Core**: Touch-optimized interface featuring centered mobile headers, haptic feedback, and a bottom glassmorphic dock.
- **Sleek Dark Brand Identity**: High-contrast OLED black theme with white and electric cyan briefcase icons.
- **Direct In-App OTA Update Checker**: Seamlessly detects new GitHub releases and downloads updates internally.

---

### 🤖 5. Multi-Provider AI Hub
Connect any AI provider of your choice for resume tailoring and cover letter drafting:
- ⚡ **Google Gemini** (Gemini 2.0 Flash / 1.5 Flash)
- 🔀 **OpenRouter** (DeepSeek R1, Llama 3.3, Qwen)
- 🟢 **NVIDIA NIM** (Llama 3.1 405B / Nemotron)
- ⚡ **Groq Cloud** (Ultra-fast Llama 3.3 70B Versatile)
- 🧠 **DeepSeek** (DeepSeek Chat & Reasoner)
- 🔮 **Mistral AI**, **OpenAI**, or local **Ollama** models.

---

## 🛠️ Architecture & Tech Stack

```
jobfinder/
├── frontend/                  # React 19 + Vite + Tailwind CSS + Capacitor Native
│   ├── src/
│   │   ├── adapters/          # Direct JobScrap adapters (9 portals)
│   │   ├── components/        # SearchView, FoundJobsView, ProfileView, ResumePreview
│   │   ├── db/                # Dexie.js local IndexedDB schema
│   │   ├── store/             # Zustand stores for reactive state
│   │   └── utils/             # In-app updater, LaTeX generator, SEO helpers
│   └── android/               # Native Android project with Gradle wrapper
│
└── backend/jobscrap/          # Autonomous Python JobScrap Engine (FastAPI)
    ├── api.py                 # Fast non-blocking REST API (/search, /updater)
    ├── db.py                  # SQLite with normalized city/keyword matching
    └── scrapers.py            # Custom resilient portal parsers
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: `v20+`
- **Python**: `3.10+` (optional, for local scraper backend)

### 1. Clone the Repository
```bash
git clone https://github.com/Suvesh108/jobfinder.git
cd jobfinder
```

### 2. Launch the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Launch the JobScrap Backend (Optional for Live Multi-Portal Scraping)
```bash
cd backend
python -m uvicorn jobscrap.api:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📱 Building the Android APK

```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
The output APK will be generated at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Suvesh108/jobfinder/issues).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
