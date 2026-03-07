-- Season standings: cumulative points per user per season
create table if not exists season_standings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  total_points integer not null default 0,
  rounds_entered integer not null default 0,
  best_rank integer,
  unique (user_id, season_id)
);

-- RLS: public read, writes handled via admin client (service role bypasses RLS)
alter table season_standings enable row level security;

create policy "Anyone can read season standings"
  on season_standings for select
  using (true);
