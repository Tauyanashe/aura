# AURA • High-Trust Social Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-13%20passed-success)
![License](https://img.shields.io/badge/license-MIT-blue)

> **A modern social platform engineered for deliberate capacity, peer-verified reputation, and creator sovereignty.** Built with React 19, Vite 6, Tailwind CSS v4, Supabase (PostgreSQL + RLS + Stored Procedures), Direct Messaging, and Virtual Farm storage infrastructure.

---

## 🌟 Key Features

- **Virtual Farm Publishing Quotas**: Deliberate monthly posting limits and storage capacity (Free, Pioneer, and Creator Pro tiers) that reset monthly, eliminating bot spam and prioritizing craftsmanship.
- **Aura Points (AP) & Reputation Economy**: Anti-abuse tokenomics with immutable transaction ledgers and daily farming caps.
- **Dynamic Royalty Rankings (Aura Kings & Queens)**: Daily and weekly influence leaderboards that automatically honor creators based on peer ratings and gender profile attributes.
- **Direct Messaging (Chat & DMs)**: Real-time private communication with responsive dual-pane views and auto-scroll threading.
- **Public Creator Profiles & One-Click Follow**: Discover creators, follow their activity, view their portfolios, and initiate private chat threads.
- **Full Foldable Optimization**: Custom adaptive layouts for book-style foldables (Pixel Fold, Galaxy Z Fold), clamshell flex-modes (Galaxy Z Flip, Razr), and ultra-narrow outer cover displays.
- **Enterprise-Grade Security**: 100% server-enforced Row Level Security (RLS), atomic quota reservation procedures, and strict self-rating prevention.

---

## 🚀 Quick Launch on Render

Deploying to Render takes under 2 minutes:

### Option A: 1-Click Blueprint Deploy (Recommended)
1. Fork or push this repository to your GitHub account (`https://github.com/<your-username>/aura`).
2. Log into your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Select your `aura` GitHub repository. Render automatically reads [`render.yaml`](./render.yaml).
5. (Optional) Provide your live Supabase credentials in the environment variables form:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Apply**. Render will install dependencies, build the production bundle, and launch the service at `https://aura-platform.onrender.com`.

### Option B: Manual Web Service / Static Site Deploy
1. In Render, select **New +** → **Web Service** (or **Static Site**).
2. Connect your GitHub repository.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (or for Static Site: Publish Directory `./dist`)
4. Set Environment Variables:
   - `NODE_VERSION`: `20`
   - `VITE_STORAGE_MODE`: `mock` (or `drive`)
5. Click **Create Web Service**.

---

## 📦 Setting Up a GitHub Repository

To push this codebase to your own GitHub account:

```bash
# 1. Initialize remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/<your-username>/aura.git

# 2. Ensure main branch is selected
git branch -M main

# 3. Push code to GitHub
git push -u origin main
```

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm 9+

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/aura.git
cd aura

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# -> Local app running at http://localhost:5173

# 4. Run test suite
npm run test
# -> 13 passing unit & integration tests

# 5. Build for production
npm run build

# 6. Test production server locally
npm start
# -> Production server running at http://localhost:3000
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to [`.env.example`](./.env.example)):

| Variable | Description | Default |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project API URL | `https://mock.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anonymous API Key | `mock-anon-key` |
| `VITE_STORAGE_MODE` | Media storage driver (`mock` or `drive`) | `mock` |
| `PORT` | Local production server port | `3000` |

> **Offline/Mock Mode**: When Supabase credentials are not provided, AURA automatically boots in local browser persistent mode (`localStorage`), enabling full offline exploration, auth flows, farm capacity, ratings, and messaging without cloud credentials.

---

## 🗄️ Database Migrations (Supabase / PostgreSQL)

Database schemas and stored procedures are organized in `supabase/migrations/`:

1. `001_core_schema.sql` — Profiles, roles, farms, cycles, usage, posts, media assets, likes, comments, ratings, follows, blocks, wallets, transactions, scores.
2. `002_rls_policies.sql` — Row Level Security policies and security-definer helper functions.
3. `003_functions_and_triggers.sql` — `fn_reserve_farm_quota`, `fn_commit_post_publish`, `fn_award_aura_points`, `fn_calculate_aura_score`.
4. `004_seed_data.sql` — Virtual farms catalogue (Free, Pioneer, Creator Pro).
5. `005_chat_schema.sql` — Direct messaging conversations, participant tracking, and message threading with full RLS.

To apply migrations to your live Supabase database:
```bash
# Using Supabase CLI:
supabase db push
# Or copy and execute SQL migrations sequentially in the Supabase SQL Editor.
```

---

## 🧪 Security & Reliability Test Suite

All core security guarantees are tested with Vitest in `tests/security-and-reliability.test.js`:

```bash
npm run test
```

Test coverage includes:
- [x] Initial farm allocation & storage quota calculations
- [x] Cumulative farm capacity stacking
- [x] Media file validation & MIME type restrictions
- [x] Anti-fraud prevention: self-rating rejection
- [x] Running average rating and distribution calculations
- [x] Idempotent AP reward allocation upon publishing
- [x] Reputation tier score bracket mapping
- [x] Direct messaging conversation creation and chronological ordering
- [x] Automatic royalty title detection (Aura King vs Aura Queen)

---

## 📄 License

MIT © [AURA Engineering](https://aura.network)
