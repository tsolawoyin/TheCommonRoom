# TheCommonRoom — Technical Specification v1.0

**Stack:** Next.js 14 · Supabase · Tailwind CSS · TypeScript  
**Date:** March 2026  
**Status:** Pre-build · Stage 1 Priority

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Site Architecture & Pages](#3-site-architecture--pages)
4. [Database Schema](#4-database-schema)
5. [Core Features](#5-core-features)
6. [API Routes](#6-api-routes)
7. [Security & RLS](#7-security--rls)
8. [Build Stages](#8-build-stages)
9. [Brand & Design System](#9-brand--design-system)
10. [Environment Variables](#10-environment-variables)
11. [Folder Structure](#11-folder-structure)
12. [Notes for Claude Code](#12-notes-for-claude-code)

---

## 1. Project Overview

TheCommonRoom (TCR) is a biweekly essay-based reading and quiz competition platform. Users read a curated essay, answer MCQ questions testing comprehension, compete on a global leaderboard, and earn cash prizes.

**The mission:** In a world dominated by short-form scrolling content, TCR creates a competitive incentive to read long-form essays. Every round publishes one essay on a topic that matters. Users who read carefully score higher. The platform rewards literacy.

### 1.1 Current Baseline

| Metric | Value |
|---|---|
| Active users per round | 100+ |
| Frequency | Biweekly (every 2 weeks) |
| Prize per round | ₦5,000 |
| Current distribution | WhatsApp + word of mouth |
| Rounds completed | 2 |

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) |
| Backend | Next.js API Routes + Supabase Edge Functions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Styling | Tailwind CSS |
| Language | TypeScript (strict) |
| Email | Resend |
| Hosting | Vercel |
| Storage | Supabase Storage (sponsor logos, assets) |

---

## 3. Site Architecture & Pages

### 3.1 Public Routes (No Auth Required)

| Route | Description |
|---|---|
| `/` | Landing page — brand intro, active round teaser, CTA to register |
| `/essays` | Essay archive — all past essays as readable public content (SEO) |
| `/essays/[slug]` | Individual essay page — essay body + post-round MCQ results |
| `/auth/login` | Login page |
| `/auth/sign-up` | Registration page |
| `/auth/forgot-password` | Password reset page |

### 3.2 Protected Routes (Auth Required)

| Route | Description |
|---|---|
| `/dashboard` | User home — active round card, personal stats, recent performance |
| `/round/[id]` | Competition page — read essay, take timed MCQ, submit answers |
| `/leaderboard` | Live leaderboard for current round + season standings tab |
| `/profile` | Personal stats — rounds played, avg score, best rank, points, badges |
| `/profile/[userId]` | Public profile — other users' stats (read-only) |

### 3.3 Admin Routes (Role-Gated)

| Route | Description |
|---|---|
| `/admin` | Admin dashboard — overview of rounds, users, submissions |
| `/admin/rounds/new` | Create new round — essay editor, MCQ builder, dates, sponsor |
| `/admin/rounds/[id]` | Manage round — edit, close, declare winner |
| `/admin/users` | All registered users — name, email, phone, join date, history |

---

## 4. Database Schema

### 4.1 `users`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
full_name     text NOT NULL
email         text UNIQUE NOT NULL
phone         text NOT NULL
role          text DEFAULT 'user'        -- 'user' | 'admin'
total_points  integer DEFAULT 0
rounds_played integer DEFAULT 0
created_at    timestamptz DEFAULT now()
```

### 4.2 `seasons`

```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
name       text NOT NULL                 -- e.g. 'Season 1: Jan–Mar 2026'
start_date date NOT NULL
end_date   date NOT NULL
is_active  boolean DEFAULT true
created_at timestamptz DEFAULT now()
```

### 4.3 `rounds`

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
season_id        uuid REFERENCES seasons(id)
title            text NOT NULL
slug             text UNIQUE NOT NULL
essay_body       text NOT NULL            -- full essay in markdown
sponsor_name     text                     -- optional
sponsor_logo_url text                     -- optional, from Supabase Storage
prize_amount     integer NOT NULL DEFAULT 5000   -- in Naira
starts_at        timestamptz NOT NULL
ends_at          timestamptz NOT NULL
status           text DEFAULT 'draft'     -- 'draft' | 'active' | 'closed'
winner_id        uuid REFERENCES users(id)
created_at       timestamptz DEFAULT now()
```

### 4.4 `questions`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
round_id      uuid REFERENCES rounds(id) ON DELETE CASCADE
question_text text NOT NULL
options       jsonb NOT NULL             -- array of 4 strings ["A","B","C","D"]
correct_index integer NOT NULL           -- 0-based index. NEVER sent to client.
position      integer NOT NULL           -- display order
```

### 4.5 `submissions`

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid REFERENCES users(id)
round_id     uuid REFERENCES rounds(id)
answers      jsonb NOT NULL             -- array of chosen indices e.g. [2, 0, 1, 3]
score        integer NOT NULL           -- number of correct answers
rank         integer                    -- set after round closes
points_earned integer DEFAULT 0        -- set after round closes
submitted_at timestamptz DEFAULT now()

UNIQUE (user_id, round_id)             -- one submission per user per round
```

### 4.6 `season_standings`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES users(id)
season_id     uuid REFERENCES seasons(id)
total_points  integer DEFAULT 0
rounds_entered integer DEFAULT 0
best_rank     integer

UNIQUE (user_id, season_id)
```

---

## 5. Core Features

### 5.1 Authentication

- Email + password via Supabase Auth
- Phone number captured at signup (not OTP — used for prize verification and anti-cheat deterrence)
- Role-based access: `user` vs `admin` stored on `users` table
- Protected routes redirect to `/auth/login` if unauthenticated
- Admin routes return 403 if `role !== 'admin'`

### 5.2 Competition Flow

1. Admin creates a round with essay, MCQ questions, start/end dates, and optional sponsor
2. At `starts_at`, round `status` flips to `'active'` (can be automated via cron or done manually)
3. Authenticated users visit `/round/[id]` to read the essay and take the quiz
4. Questions and answer options are **shuffled per user server-side** to prevent answer sharing
5. **Timer: 20 minutes** from the moment the user opens the quiz (enforced server-side)
6. On submit, answers are evaluated **server-side only** — correct answers never sent to client
7. One submission per user per round enforced by DB unique constraint
8. At `ends_at`, round `status` flips to `'closed'` — no new submissions accepted
9. Admin closes the round, triggering rank computation, points allocation, and winner declaration

### 5.3 Scoring & Points System

Every submission earns points based on percentile rank within the round. Points accumulate across a season on `season_standings`.

| Rank / Percentile | Points Earned |
|---|---|
| 1st place | 100 points + cash prize |
| 2nd place | 85 points |
| 3rd place | 75 points |
| Top 10% | 60 points |
| Top 25% | 40 points |
| Top 50% | 20 points |
| Everyone else who completes | 10 points (participation floor) |

Tiebreaker: earlier `submitted_at` wins.

### 5.4 Leaderboard

- Real-time current round leaderboard via Supabase Realtime subscription
- Columns: rank, display name, score, submission time
- Season standings tab — cumulative points across all rounds in the active season
- Logged-in user's row is always highlighted and visible regardless of scroll position

### 5.5 Anti-Cheating Mechanisms

- **Server-side answer evaluation** — `correct_index` never returned in any API response
- **Question + option order shuffled per user** on round open (server-side, stored in session)
- **DB unique constraint** on `(user_id, round_id)` — second submission returns 409
- **20-minute timer enforced server-side** — submission rejected if `submitted_at > opened_at + 20min`
- **Prize requires bank account name matching registered name** — psychological deterrent at signup
- **Public winner announcement by full name** — discourages fake account registration
- **IP logging at signup** — flag (not block) duplicate registrations from same IP

### 5.6 Email Notifications (Resend)

- Welcome email on signup
- Round launch notification to all users when status flips to `'active'`
- Submission confirmation with score preview
- Results email after round closes — personal score, rank, points earned
- Winner announcement email to all registered users

---

## 6. API Routes

| Method + Route | Description |
|---|---|
| `POST /api/auth/signup` | Create user account — validate uniqueness of email + phone |
| `GET /api/rounds/active` | Return current active round (essay, questions without `correct_index`, timer) |
| `POST /api/rounds/[id]/submit` | Evaluate answers server-side, write submission, return score |
| `GET /api/rounds/[id]/leaderboard` | Return ranked submissions for a round |
| `GET /api/seasons/[id]/standings` | Return season leaderboard |
| `GET /api/profile/[userId]` | Return user stats and round history |
| `POST /api/admin/rounds` | Create new round (admin only) |
| `PATCH /api/admin/rounds/[id]` | Update round — status, winner, sponsor (admin only) |
| `POST /api/admin/rounds/[id]/close` | Close round, compute ranks, award points (admin only) |

---

## 7. Security & RLS

### 7.1 Row Level Security Policies

| Table | Policy |
|---|---|
| `users` | Users read/update own row only. Admin reads all. |
| `seasons` | Public read. Admin full access. |
| `rounds` | Public read for `active`/`closed`. Admin full access including `draft`. |
| `questions` | Public read for active rounds — `options` only, `correct_index` excluded via column-level policy. Admin full access. |
| `submissions` | Users read own rows only. Admin reads all. Insert allowed only if round is `active` and no prior submission exists for that user. |
| `season_standings` | Public read. System/admin write only. |

### 7.2 Server-Side Guards

- `correct_index` on `questions` is **never returned to the client** — evaluated only inside `/api/rounds/[id]/submit`
- Admin API routes verify user role server-side using Supabase service role key
- Submit API validates: round is `active`, timer not expired, no prior submission exists
- All mutations require authenticated session — anon access is read-only at most

---

## 8. Build Stages

### Stage 1 — Launch Ready
*Goal: Ship a working platform capable of running Round 3.*

- [ ] Supabase project setup — tables, RLS policies, auth config
- [ ] Auth flow — signup (name, email, phone, password), login, forgot password
- [ ] Admin panel — create round, write essay (markdown), add MCQ questions, set dates
- [ ] Competition page — read essay, take timed quiz, submit answers
- [ ] Server-side answer evaluation API route
- [ ] Leaderboard — live current round rankings
- [ ] Basic user dashboard — active round card, submission status
- [ ] Deployed to Vercel with environment variables configured

### Stage 2 — Retention
*Goal: Give users a reason to return every round.*

- [ ] Points system + season standings table logic
- [ ] User profile page — full stats, round history, earned points, badges
- [ ] Essay archive — all past essays as public readable pages (SEO)
- [ ] Email notifications via Resend
- [ ] Question + option shuffling per user (server-side)
- [ ] Season standings tab on leaderboard

### Stage 3 — Revenue
*Goal: Monetise the audience built in Stages 1 and 2.*

- [ ] Sponsor placement — "This round powered by [Brand]" on round and leaderboard pages
- [ ] Sponsor logo upload in admin panel (Supabase Storage)
- [ ] Analytics dashboard — registered users, submissions per round, completion rate (for sponsor pitches)
- [ ] Google AdSense or local ad network on essay archive pages

---

## 9. Brand & Design System

| Token | Value | Usage |
|---|---|---|
| Primary (Navy) | `#0a2463` | Backgrounds, buttons, headings |
| Accent (Gold) | `#e8c547` | Highlights, CTAs, active states |
| Surface (Cream) | `#f5f0e8` | Card backgrounds, page background |
| Text Primary | `#1a1a2e` | Body text |
| Text Muted | `#666666` | Secondary text, labels |
| Display Font | Playfair Display | Headings, brand name |
| Body Font | DM Sans | UI labels, body copy, inputs |

**Design approach:** Mobile-first. All pages default to 390px viewport, scaling up with `md:` breakpoints. The editorial aesthetic — navy + cream + gold — reinforces the reading-focused brand identity. No generic UI. Every screen should feel like a publication, not a SaaS app.

---

## 10. Environment Variables

```bash
# .env.local

NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only — never expose to client
RESEND_API_KEY=                     # Resend transactional email
NEXT_PUBLIC_SITE_URL=               # e.g. https://thecommonroom.ng
```

---

## 11. Folder Structure

```
/app
  /(auth)
    /login/page.tsx
    /sign-up/page.tsx
    /forgot-password/page.tsx
  /(protected)
    /dashboard/page.tsx
    /round/[id]/page.tsx
    /leaderboard/page.tsx
    /profile/page.tsx
    /profile/[userId]/page.tsx
  /(admin)
    /admin/page.tsx
    /admin/rounds/new/page.tsx
    /admin/rounds/[id]/page.tsx
    /admin/users/page.tsx
  /essays/page.tsx
  /essays/[slug]/page.tsx
  /api
    /auth/signup/route.ts
    /rounds/active/route.ts
    /rounds/[id]/submit/route.ts
    /rounds/[id]/leaderboard/route.ts
    /seasons/[id]/standings/route.ts
    /profile/[userId]/route.ts
    /admin/rounds/route.ts
    /admin/rounds/[id]/route.ts
    /admin/rounds/[id]/close/route.ts

/components
  /ui                   -- shadcn/ui base components
  /round
    EssayReader.tsx
    QuizForm.tsx
    Timer.tsx
    LeaderboardTable.tsx
  /admin
    RoundForm.tsx
    QuestionBuilder.tsx
  /layout
    Navbar.tsx
    Footer.tsx

/lib
  /supabase
    client.ts           -- browser Supabase client
    server.ts           -- server Supabase client (service role)
  scoring.ts            -- points calculation logic
  email.ts              -- Resend email helpers
  utils.ts              -- shared utilities

/types
  database.ts           -- TypeScript types for all Supabase table rows
```

---

## 12. Notes for Claude Code

This document is the single source of truth for the TCR build.

**Critical rules — do not deviate:**

1. **Never return `correct_index` to the client.** Evaluate answers only inside the submit API route using the service role key. This is the foundation of the anti-cheat system.

2. **Enforce the unique constraint at the DB level.** `UNIQUE (user_id, round_id)` on `submissions` must exist as a real constraint — do not rely on frontend guards or API-level checks alone.

3. **Use Supabase RLS as the primary security layer.** API routes are a secondary guard. If RLS is misconfigured, sensitive data leaks regardless of API logic.

4. **All pages are mobile-first.** Default layout is 390px. Use `md:` breakpoints to scale up. Do not build desktop-first and retrofit mobile.

5. **Admin pages are internal tooling.** They should be functional and clean but do not need the same design polish as public-facing pages.

6. **Use TypeScript strictly.** Define types for all Supabase table rows in `/types/database.ts`. No `any`.

7. **Build Stage 1 only first.** Do not implement points, seasons, email, or sponsor features until Stage 1 is fully working and deployed.

8. **The essay is markdown.** Store `essay_body` as markdown, render with a markdown parser on the frontend (`react-markdown` or similar).

---

*Brand voice: editorial, intelligent, encouraging. TCR believes reading is worth rewarding. Every piece of copy should reflect that mission.*