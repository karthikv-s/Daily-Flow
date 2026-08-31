# Daily Planner App — Product Requirements & Implementation Plan

## 1. Overview

A daily planner web app with an AI chatbot that helps organize tasks, sends in-app notifications/alerts for deadlines, and rewards timely completion with points. Users log in with a password-protected account and get the same data on any device.

## 2. Goals

- One account, synced across devices (phone, laptop, etc.)
- AI chatbot gives organizing suggestions based on the user's actual tasks
- The app itself alerts the user about upcoming/overdue tasks (no email dependency)
- Points awarded for completing tasks on time, to build a habit loop

## 3. Core Features

### 3.1 Accounts & Auth
- Register/login with email + password
- Passwords hashed (bcrypt), never stored in plain text
- Session handled via JWT so the same login works on any browser/device
- Logging in on device B immediately shows the same tasks/points as device A (server is the single source of truth — no local-only storage)

### 3.2 Task Planner
- Create/edit/delete tasks with: title, description, due date & time, priority, category
- Daily/weekly view of tasks
- Mark complete; timestamp of completion is recorded

### 3.3 AI Chatbot (Claude API)
- Chat panel where the user can ask things like "how should I plan today?"
- On request (or once daily), the bot looks at the user's current task list and suggests an ordering/schedule, flags overloaded days, and suggests splitting large tasks
- Sends the user's tasks + the question to the Claude API as context; returns a plain-language suggestion

### 3.4 In-App Notifications
Since this must come from the app itself (not email), this needs to work even when the tab is closed:
- **Web Push API + Service Worker**: browser subscribes once; server pushes a notification (like a phone push notification) when a task is due soon or overdue, even if the site isn't open
- Fallback: when the app is open, an in-app banner/toast list shows reminders too
- Notification triggers: N minutes before due time, at due time, and if still incomplete X minutes after due time

### 3.5 Points & Gamification
- Completing a task **before or exactly at** its due time → full points
- Completing late → partial or zero points (configurable rule)
- Running total shown on dashboard; simple streak counter (consecutive days with all tasks done on time) is a good v1 addition

## 4. Non-Functional Requirements
- Data belongs to the logged-in user only (no cross-user leakage)
- Server must run continuously (or on a schedule) to check due dates and fire push notifications — this can't be a "serverless function that only runs on request," it needs a background scheduler
- Works on mobile browser and desktop browser

## 5. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) or plain HTML/CSS/JS | React is more maintainable as it grows; plain JS is faster to ship for v1 |
| Backend | Node.js + Express | Simple, same language as frontend |
| Database | PostgreSQL (hosted free on Neon or Supabase) | Needs to persist across restarts/devices — SQLite on a free host gets wiped on redeploy |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | JWT + bcrypt | Standard, stateless, works across devices |
| Push notifications | Web Push API (`web-push` npm package) + Service Worker | Real "from the app" notifications without needing email or a native app |
| Scheduler | `node-cron` inside the Express server | Checks due tasks every minute, triggers push notifications |
| AI chatbot | Anthropic API (`@anthropic-ai/sdk`) | You supply your own API key |
| Hosting | Render or Railway (not Vercel — Vercel's serverless functions can't run a persistent cron loop) | Needs an always-on process for the scheduler |

## 6. Data Model (core tables)

```
User
- id, email (unique), password_hash, points_total, created_at

Task
- id, user_id (FK), title, description, due_at, priority,
  category, status (pending/done), completed_at, points_awarded

PushSubscription
- id, user_id (FK), endpoint, keys (p256dh, auth)
  -- one row per device the user has enabled notifications on

ChatMessage (optional, for history)
- id, user_id (FK), role (user/assistant), content, created_at
```

## 7. API Endpoints (v1)

```
POST   /api/auth/register
POST   /api/auth/login              -> returns JWT
GET    /api/tasks                   -> list current user's tasks
POST   /api/tasks
PATCH  /api/tasks/:id                -> edit / mark complete (awards points)
DELETE /api/tasks/:id
POST   /api/push/subscribe          -> save a device's push subscription
POST   /api/chat                    -> { message } -> Claude suggestion using current tasks as context
GET    /api/me                      -> profile + points_total
```

All routes except register/login require the JWT in an `Authorization: Bearer <token>` header — this is what makes "same account, any device" work.

## 8. Implementation Plan

**Phase 1 — Foundation (auth + sync)**
- Set up Express + Prisma + Postgres
- Build register/login, JWT middleware
- Task CRUD endpoints
- Bare-bones frontend: login screen, task list, add/edit/complete
- *Milestone: log in from two different browsers, see the same tasks*

**Phase 2 — Points**
- Add points logic on task completion (on-time vs late)
- Dashboard shows running total + basic streak

**Phase 3 — Notifications**
- Add service worker + Web Push subscription flow on frontend
- `node-cron` job scanning for tasks due soon/overdue
- Send push notification via `web-push`
- *Milestone: close the tab, get a real OS-level notification when a task is due*

**Phase 4 — Chatbot**
- `/api/chat` endpoint: pull user's open tasks, send to Claude with a system prompt like "You are a scheduling assistant, suggest how to organize these tasks"
- Simple chat UI panel

**Phase 5 — Polish**
- Priority/category filtering, daily/weekly view
- Error states, empty states, mobile responsiveness
- Deploy to Render/Railway with env vars: `DATABASE_URL`, `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ANTHROPIC_API_KEY`

## 9. Open Decisions to Make Before Coding
- Late-completion points rule: zero, or partial credit scaled by how late?
- Should the chatbot proactively message once a day, or only respond when asked?
- Streaks/badges beyond a simple point total — worth a v1 feature or v2?
