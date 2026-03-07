-- Start quiz: looks up round, creates/resumes submission, returns quiz data
create or replace function start_quiz(p_slug text)
returns jsonb as $$
declare
  v_user_id uuid;
  v_round record;
  v_existing record;
  v_submission_id uuid;
  v_started_at timestamptz;
  v_remaining_ms integer;
  v_questions jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'PGRST';
  end if;

  select * into v_round from rounds where slug = p_slug;
  if not found then
    raise exception 'Round not found' using errcode = 'PGRST';
  end if;

  if now() < v_round.starts_at then
    raise exception 'Round is upcoming, not active' using errcode = 'PGRST';
  end if;
  if now() > v_round.starts_at + interval '24 hours' then
    raise exception 'Round is closed, not active' using errcode = 'PGRST';
  end if;

  select id, answers, started_at into v_existing
  from submissions
  where user_id = v_user_id and round_id = v_round.id
  limit 1;

  if found and v_existing.answers is not null then
    return jsonb_build_object('status', 'already_submitted');
  end if;

  if found then
    v_submission_id := v_existing.id;
    v_started_at := v_existing.started_at;
  else
    v_started_at := now();
    insert into submissions (user_id, round_id, started_at, answers, score)
    values (v_user_id, v_round.id, v_started_at, null, null)
    returning id into v_submission_id;
  end if;

  v_remaining_ms := greatest(0, extract(epoch from (v_started_at + interval '15 minutes' - now())) * 1000)::integer;

  select jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'round_id', q.round_id,
      'question_text', q.question_text,
      'options', to_jsonb(q.options),
      'position', q.position
    ) order by q.position
  ) into v_questions
  from questions q
  where q.round_id = v_round.id;

  return jsonb_build_object(
    'status', 'quiz_active',
    'round', jsonb_build_object(
      'id', v_round.id,
      'title', v_round.title,
      'slug', v_round.slug,
      'essay_body', v_round.essay_body
    ),
    'questions', coalesce(v_questions, '[]'::jsonb),
    'submission_id', v_submission_id,
    'remaining_ms', v_remaining_ms
  );
end;
$$ language plpgsql security definer;

-- Submit quiz: grades, computes points/rank, updates all stats
-- p_user_id is only used for beacon fallback (admin/service-role calls)
create or replace function submit_quiz(
  p_submission_id uuid,
  p_answers integer[],
  p_user_id uuid default null
)
returns jsonb as $$
declare
  v_user_id uuid;
  v_submission record;
  v_submitted_at timestamptz;
  v_q record;
  v_idx integer := 1;
  v_score integer := 0;
  v_total integer := 0;
  v_accuracy float;
  v_elapsed_ms float;
  v_time_remaining float;
  v_points_earned integer;
  v_rank integer;
  v_season_id uuid;
  v_existing_standing record;
begin
  v_user_id := coalesce(auth.uid(), p_user_id);
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'PGRST';
  end if;

  select * into v_submission from submissions where id = p_submission_id;
  if not found then
    raise exception 'Submission not found' using errcode = 'PGRST';
  end if;

  if v_submission.user_id != v_user_id then
    raise exception 'Not authorized' using errcode = 'PGRST';
  end if;

  if v_submission.answers is not null then
    return jsonb_build_object('status', 'already_submitted');
  end if;

  -- 15min + 30s grace
  if now() > v_submission.started_at + interval '15 minutes 30 seconds' then
    raise exception 'Quiz time has expired' using errcode = 'PGRST';
  end if;

  -- Grade
  v_submitted_at := now();
  for v_q in
    select correct_index from questions
    where round_id = v_submission.round_id
    order by position
  loop
    v_total := v_total + 1;
    if v_idx <= array_length(p_answers, 1) then
      if p_answers[v_idx] >= 0 and p_answers[v_idx] = v_q.correct_index then
        v_score := v_score + 1;
      end if;
    end if;
    v_idx := v_idx + 1;
  end loop;

  -- Compute points
  if v_total = 0 then
    v_points_earned := 0;
  else
    v_accuracy := v_score::float / v_total;
    v_elapsed_ms := extract(epoch from (v_submitted_at - v_submission.started_at)) * 1000;
    v_time_remaining := greatest(0, 900000 - v_elapsed_ms);
    v_points_earned := round(v_accuracy * 100 + (v_time_remaining / 900000) * v_accuracy * 50)::integer;
  end if;

  -- Update submission
  update submissions set
    answers = p_answers,
    score = v_score,
    points_earned = v_points_earned,
    submitted_at = v_submitted_at
  where id = p_submission_id;

  -- Rank
  select count(*) + 1 into v_rank
  from submissions
  where round_id = v_submission.round_id
    and points_earned > v_points_earned
    and answers is not null;

  update submissions set rank = v_rank where id = p_submission_id;

  -- User stats
  update users set
    total_points = total_points + v_points_earned,
    rounds_played = rounds_played + 1
  where id = v_user_id;

  -- Season standings
  select season_id into v_season_id from rounds where id = v_submission.round_id;
  if found then
    select * into v_existing_standing
    from season_standings
    where user_id = v_user_id and season_id = v_season_id;

    if found then
      update season_standings set
        total_points = v_existing_standing.total_points + v_points_earned,
        rounds_entered = v_existing_standing.rounds_entered + 1,
        best_rank = case
          when v_existing_standing.best_rank is null then v_rank
          else least(v_existing_standing.best_rank, v_rank)
        end
      where id = v_existing_standing.id;
    else
      insert into season_standings (user_id, season_id, total_points, rounds_entered, best_rank)
      values (v_user_id, v_season_id, v_points_earned, 1, v_rank);
    end if;
  end if;

  return jsonb_build_object(
    'status', 'submitted',
    'score', v_score,
    'total', v_total,
    'points_earned', v_points_earned,
    'rank', v_rank
  );
end;
$$ language plpgsql security definer;
