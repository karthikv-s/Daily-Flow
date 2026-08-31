# 📅 DailyFlow AI — Smart Daily Planning & Habit Tracking System

> **Plan Smarter. Achieve More.**  
> A full-stack, AI-powered daily planner with automated task scheduling, multi-model AI assistant (Google Gemini & Claude), interactive habits & goals tracker, dark/light theme engine, and web push notifications.

---

## ✨ Features

- 🤖 **Interactive AI Planning Assistant**: Powered by **Google Gemini** (`gemini-3.6-flash`) & **Anthropic Claude**. Natural language intent parser extracts tasks, sets priorities, and schedules them in 1 click.
- 🗓️ **3-Column Modern Dashboard**: Live vertical timeline schedule, task manager with past-date blocking, quick time presets, priority cards, and progress rings.
- 🌤️ **My Day Workspace**: Dedicated morning focus board to conquer today's goals.
- 📅 **Interactive Calendar**: Full month view with date-based task indicators and day agenda drawer.
- 🎯 **Goals & Milestones**: Goal progress sliders with celebratory badge unlocks on 100% completion.
- 🔄 **Weekly Habits Tracker**: 7-day check-in board (*Mon–Sun*) with automatic weekly refresh and streak counter.
- 📊 **Productivity Analytics**: Completion rate metrics, focus time breakdown, and achievement badges showcase.
- 🔔 **Smart Reminders**: Web Push OS notifications, 15-minute pre-due alerts, overdue alerts, and 8:00 AM morning AI briefings.
- 📝 **Sticky Notes & Scratchpad**: Color-tagged notes (*Lavender, Yellow, Mint, Sky, Rose*) with search, pinning, and persistent local storage.
- 🎨 **Dual-Theme Engine**: Seamless switching between **Light Mode** (emerald green & crisp white) and **Dark Mode** (deep obsidian glassmorphism).
- 🔐 **Authentication & Security**: JWT authentication, bcryptjs hashing, and real-time **Gmail SMTP OTP verification** for password resets.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router, Custom Glassmorphism CSS Modules.
- **Backend**: Node.js, Express.js, Prisma ORM, Node-Cron, Web-Push, Nodemailer.
- **Database**: PostgreSQL (Neon Serverless).
- **AI Models**: Google Gemini 3.6 Flash (`@google/generative-ai`), Anthropic Claude (`@anthropic-ai/sdk`).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (or free Neon PostgreSQL)

### 2. Clone the Repository
```bash
git clone https://github.com/karthikv-s/Daily-Flow.git
cd Daily-Flow
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your DATABASE_URL, GEMINI_API_KEY, and SMTP credentials in .env
npx prisma db push
npm run dev
```
Backend runs on `http://localhost:4000`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 📜 License
MIT License. Built with ❤️ for peak productivity.
