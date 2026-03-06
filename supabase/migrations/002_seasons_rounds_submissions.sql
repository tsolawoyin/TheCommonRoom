-- ============================================
-- TheCommonRoom: Seasons, Rounds, Submissions
-- Run in Supabase SQL Editor (after 001_users.sql)
-- ============================================

-- 1. Seasons
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  sponsor_name text,
  sponsor_logo_url text,
  prize_pool integer not null default 50000,
  created_at timestamptz default now()
);

alter table public.seasons enable row level security;

-- Public read for all seasons
create policy "Seasons are publicly readable"
  on public.seasons for select using (true);

-- 2. Rounds
-- No status column — state is derived from starts_at:
--   now < starts_at                        → upcoming
--   starts_at <= now <= starts_at + 24h    → active
--   now > starts_at + 24h                  → closed
-- Every round lasts exactly 24 hours.
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  title text not null,
  slug text unique not null,
  essay_body text not null,
  sponsor_name text,
  sponsor_logo_url text,
  starts_at timestamptz not null,
  winner_id uuid references public.users(id),
  created_at timestamptz default now()
);

alter table public.rounds enable row level security;

-- Public can read rounds, but essay_body and title are only
-- meaningful when the round is active or closed.
-- The API layer enforces hiding content for upcoming rounds.
create policy "Rounds are publicly readable"
  on public.rounds for select using (true);

-- 3. Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  answers jsonb not null,
  score integer not null,
  rank integer,
  points_earned integer default 0,
  submitted_at timestamptz default now(),

  unique (user_id, round_id)
);

alter table public.submissions enable row level security;

-- Users can read their own submissions
create policy "Users can read own submissions"
  on public.submissions for select using (auth.uid() = user_id);

-- Users can insert a submission if the round is active and they haven't submitted yet
-- (unique constraint handles the duplicate check)
create policy "Users can submit during active rounds"
  on public.submissions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rounds
      where id = round_id
        and now() >= starts_at
        and now() <= starts_at + interval '24 hours'
    )
  );
