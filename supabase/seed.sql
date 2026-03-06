-- ============================================
-- TheCommonRoom: Seed data for dashboard testing
-- Run in Supabase SQL Editor
--
-- IMPORTANT: Replace YOUR_AUTH_USER_ID below with
-- your actual auth.users UUID before running.
-- ============================================

-- ── Season ──
insert into public.seasons (id, name, description, start_date, end_date, is_active, prize_pool)
values (
  'a1000000-0000-0000-0000-000000000001',
  'Season 1',
  'The inaugural season of TheCommonRoom.',
  '2026-01-01',
  '2026-06-30',
  true,
  500000
);

-- ── Closed Round 1 (started 30 days ago, lasted 24h) ──
insert into public.rounds (id, season_id, title, slug, essay_body, starts_at)
values (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Why We Stopped Reading',
  'why-we-stopped-reading',
  'The average adult reads fewer books per year than at any point in modern history...',
  now() - interval '30 days'
);

-- ── Closed Round 2 (started 16 days ago, lasted 24h) ──
insert into public.rounds (id, season_id, title, slug, essay_body, starts_at)
values (
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'The Price of Attention',
  'the-price-of-attention',
  'In an age of infinite distraction, attention has become the scarcest resource...',
  now() - interval '16 days'
);

-- ── Active Round 3 (started 6 hours ago, 18h remaining) ──
insert into public.rounds (id, season_id, title, slug, essay_body, starts_at)
values (
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'The Last Bookshop in Lagos',
  'the-last-bookshop-in-lagos',
  'Tucked behind a row of generator repair shops on Broad Street, the bookshop has no sign...',
  now() - interval '6 hours'
);

-- ── Upcoming Round 4 (starts in 14 days) ──
insert into public.rounds (id, season_id, title, slug, essay_body, starts_at)
values (
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Memory and the Digital Self',
  'memory-and-the-digital-self',
  'What happens when every moment is recorded but nothing is remembered?',
  now() + interval '14 days'
);

-- ── Questions for Round 3 (The Last Bookshop in Lagos) ──
insert into public.questions (round_id, question_text, options, correct_index, position)
values
  (
    'b1000000-0000-0000-0000-000000000003',
    'Where is the bookshop located?',
    ARRAY['Victoria Island', 'Broad Street', 'Lekki Phase 1', 'Allen Avenue'],
    1,
    1
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What is notable about the bookshop''s exterior?',
    ARRAY['It has a bright red door', 'It has no sign', 'It is painted gold', 'It has a neon light'],
    1,
    2
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What type of shops surround the bookshop?',
    ARRAY['Food vendors', 'Clothing stores', 'Generator repair shops', 'Phone accessory shops'],
    2,
    3
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What is the main theme of the essay?',
    ARRAY['Urban development', 'The survival of reading culture', 'Generator noise in Lagos', 'Street food culture'],
    1,
    4
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What does the bookshop symbolise in the essay?',
    ARRAY['Wealth', 'Resistance against cultural decline', 'Government neglect', 'Childhood nostalgia'],
    1,
    5
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Which word best describes the tone of the essay?',
    ARRAY['Angry', 'Celebratory', 'Melancholic yet hopeful', 'Satirical'],
    2,
    6
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What challenge does the bookshop face?',
    ARRAY['Flooding', 'Lack of customers and modern competition', 'Government demolition', 'High rent only'],
    1,
    7
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What literary device is most prominent in the opening?',
    ARRAY['Metaphor', 'Imagery', 'Alliteration', 'Hyperbole'],
    1,
    8
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Who is the likely intended audience of this essay?',
    ARRAY['Children', 'Policy makers only', 'Educated Nigerians and general readers', 'Book publishers'],
    2,
    9
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'What does the author suggest about the future of such bookshops?',
    ARRAY['They will thrive', 'They are irrelevant', 'Their survival is uncertain but worth fighting for', 'They should be replaced by libraries'],
    2,
    10
  );

-- ══════════════════════════════════════════════
-- REPLACE the UUID below with your real auth user id
-- Find it: Supabase Dashboard → Authentication → Users
-- ══════════════════════════════════════════════

-- ── Update user stats ──
-- (uncomment and replace YOUR_AUTH_USER_ID)
/*
update public.users
set total_points = 145, rounds_played = 2
where id = 'YOUR_AUTH_USER_ID';
*/

-- ── Submissions for closed rounds ──
-- (uncomment and replace YOUR_AUTH_USER_ID)
/*
insert into public.submissions (user_id, round_id, answers, score, rank, points_earned, submitted_at)
values
  (
    'YOUR_AUTH_USER_ID',
    'b1000000-0000-0000-0000-000000000001',
    '[1, 3, 0, 2, 1, 3, 2, 0, 1, 2]',
    8,
    3,
    60,
    now() - interval '29 days'
  ),
  (
    'YOUR_AUTH_USER_ID',
    'b1000000-0000-0000-0000-000000000002',
    '[2, 1, 3, 0, 2, 1, 0, 3, 2, 1]',
    9,
    1,
    85,
    now() - interval '15 days'
  );
*/
