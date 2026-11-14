# AURA • Zero-Budget Beta (Pro-Level)

> **High-trust social platform built around content publishing, community engagement, Aura Points (AP), Aura Score (AS), and virtual farms providing monthly posting capacity and storage.**

Built in accordance with the `AURA_Zero_Budget_Beta_Technical_Blueprint.pdf`.

---

## 🌟 Architecture Overview

```
Browser Client (React + Vite + Tailwind)
       │
       ▼
Supabase Gateway (Auth / Row Level Security / Stored Procedures)
       ├── PostgreSQL Source of Truth (Profiles, Farms, Cycles, Farm Usage, Posts, Media)
       └── Edge Functions (Deno / TypeScript)
              ├── drive-upload (Quota check -> Storage upload -> Asset metadata)
              ├── drive-media (Viewer authorization -> Byte-range streaming)
              ├── drive-delete (Safe cleanup & quota release)
              ├── publish-post (Atomic reservation commit -> Idempotent AP reward)
              ├── delete-post (Safe soft-delete -> Drive cleanup queue -> Storage decrement)
              ├── award-aura (Fraud-resistant AP ledger update)
              ├── calculate-aura-score (Normalized reputation calculation)
              └── renew-farms (Automated UTC monthly cycle rollover)
                     │
                     ▼
          Interchangeable Storage Adapter
          (Google Drive API v3 / S3-ready / Local Mock)
```

---

## 🔒 Pro-Level Security & Reliability Guarantees

### 1. Quota Race Condition Mitigation (`farm_usage` ledger)
- Traditional architectures check quota in the client and write later, exposing race conditions where concurrent uploads consume the last slot simultaneously.
- AURA solves this via an **atomic database reservation ledger** (`farm_usage`). The database locks user farm records and enters a provisional reservation with a 1-hour expiration. If an upload fails, compensation procedures immediately release the reservation.

### 2. Immutable Aura Points (AP) Ledger & Anti-Fraud
- Regular users have **zero direct insert or update permissions** on `aura_wallets` and `aura_transactions`.
- All balance modifications occur strictly via server-side security-definer procedures (`fn_award_aura_points`) with strict **unique idempotency keys** to prevent duplicate rewards.
- Enforces rolling 24-hour daily earning caps on social engagement to prevent bot rings.

### 3. Google Drive Isolation & Media Privacy
- Drive is an interchangeable storage adapter; it does not hold business logic or access control lists.
- Direct public Drive URLs are never exposed. Media is retrieved through authenticated backend endpoints (`drive-media`) verifying whether the viewer has permission to access the parent post before streaming bytes.
- Orphaned Drive files caused by network interruptions during upload are tracked in `media_cleanup_queue` for guaranteed background deletion.

### 4. Row Level Security (RLS) on All Tables
- Strict RLS policies on `profiles`, `posts`, `media_assets`, `likes`, `comments`, `ratings`, `farms`, `user_farms`, and `content_reports`.
- Private profiles and follower-restricted posts automatically deny unauthorized viewers.
- Mutually blocked users cannot view, follow, or interact with each other's content.

### 5. Social Integrity & Self-Rating Prevention
- Authors are blocked at the database check constraint and RLS policy level from rating their own posts to farm points.
- Ratings require scores between 1 and 5. Average ratings and counts are updated atomically.

---

## 📁 Repository Structure

```
aura/
├── public/
│   ├── favicon.svg
├── src/
│   ├── app/
│   │   └── App.jsx
│   ├── components/
│   │   ├── common/ (Button, Modal, Badge)
│   │   ├── navigation/ (Navbar, Sidebar)
│   │   └── cards/ (PostCard, FarmCard, WalletCard)
│   ├── features/
│   │   ├── posts/ (CreatePostModal)
│   │   ├── farms/ (FarmsView)
│   │   ├── aura-score/ (AuraScoreView)
│   │   ├── leaderboard/ (LeaderboardView)
│   │   ├── profile/ (ProfileView)
│   │   └── moderation/ (ModerationDashboard, ReportModal)
│   ├── lib/
│   │   ├── constants.js (Farms, AP rewards, Tiers)
│   │   └── supabase.js (Client initialization & mock mode fallback)
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── posts.service.js
│   │   ├── farms.service.js
│   │   ├── aura.service.js
│   │   ├── media.service.js
│   │   └── moderation.service.js
│   └── styles/
│       └── index.css
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/
│   │   ├── 001_core_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions_and_triggers.sql
│   │   └── 004_seed_data.sql
│   └── functions/
│       ├── _shared/storage-adapter.ts
│       ├── drive-upload/index.ts
│       ├── drive-media/index.ts
│       ├── drive-delete/index.ts
│       ├── publish-post/index.ts
│       ├── delete-post/index.ts
│       ├── award-aura/index.ts
│       ├── calculate-aura-score/index.ts
│       └── renew-farms/index.ts
├── tests/
│   └── security-and-reliability.test.js
├── .env.example
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### 1. Run Automated Security Suite
```bash
npm run test
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production Deployment
```bash
npm run build
```

---

## 🛡️ Beta Limits (Invited 20–50 Testers)
- **Free Farm**: 3 posts per month and 250 MB storage.
- **Pioneer Farm**: 30 posts per month and 2 GB storage.
- **Creator Pro Farm**: 150 posts per month and 10 GB storage.
- Simulated purchases; no real-money or cryptocurrency transactions.
