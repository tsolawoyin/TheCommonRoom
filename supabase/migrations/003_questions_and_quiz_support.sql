-- ============================================
-- TheCommonRoom: Questions table + quiz submission support
-- Run in Supabase SQL Editor (after 002)
-- ============================================

-- 1. Questions table
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  question_text text not null,
  options text[] not null,
  correct_index integer not null,
  position integer not null,

  unique (round_id, position)
);

alter table public.questions enable row level security;

-- Questions are readable only when the round has started
create policy "Questions readable after round starts"
  on public.questions for select
  using (
    exists (
      select 1 from public.rounds
      where id = round_id
        and now() >= starts_at
    )
  );

-- 2. Alter submissions for quiz flow
-- Add started_at to track when user began the quiz
alter table public.submissions
  add column started_at timestamptz;

-- Make answers nullable (null = quiz started but not yet submitted)
alter table public.submissions
  alter column answers drop not null;

-- Make score nullable (null = not yet graded)
alter table public.submissions
  alter column score drop not null;

-- 3. Add UPDATE policy: users can update own row only when answers is null
create policy "Users can update own unfinished submission"
  on public.submissions for update
  using (
    auth.uid() = user_id
    and answers is null
  );
