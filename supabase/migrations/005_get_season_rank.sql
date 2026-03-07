-- Get a single user's live season rank
create or replace function get_my_season_rank(p_user_id uuid)
returns integer as $$
  select r.rank::integer
  from (
    select user_id,
           dense_rank() over (order by total_points desc) as rank
    from season_standings
    where season_id = (
      select id from seasons
      where is_active = true
      order by start_date desc
      limit 1
    )
  ) r
  where r.user_id = p_user_id;
$$ language sql stable;

-- Full season leaderboard with dense ranks computed in Postgres
create or replace function get_season_leaderboard()
returns table (
  rank integer,
  user_id uuid,
  full_name text,
  total_points integer,
  rounds_entered integer
) as $$
  select
    dense_rank() over (order by ss.total_points desc)::integer as rank,
    ss.user_id,
    u.full_name,
    ss.total_points,
    ss.rounds_entered
  from season_standings ss
  join users u on u.id = ss.user_id
  where ss.season_id = (
    select id from seasons
    where is_active = true
    order by start_date desc
    limit 1
  )
  order by ss.total_points desc;
$$ language sql stable;
