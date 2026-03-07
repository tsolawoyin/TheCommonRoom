import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QUIZ_DURATION_MS } from "@/types/database";
import type { Question } from "@/types/database";
import { computePoints } from "@/lib/scoring";

const GRACE_PERIOD_MS = 30 * 1000; // 30s grace for network latency

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Parse body — handle both fetch (JSON) and sendBeacon (possibly text/plain)
  let body: { submission_id: string; answers: number[] };
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    // sendBeacon sends as text/plain
    const text = await request.text();
    body = JSON.parse(text);
  }

  const { submission_id, answers } = body;

  if (!submission_id || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: "Missing submission_id or answers" },
      { status: 400 }
    );
  }

  // 3. Fetch submission via admin client (bypasses RLS for ownership check)
  const admin = createAdminClient();

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, user_id, round_id, answers, started_at")
    .eq("id", submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  // Verify ownership
  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Already submitted
  if (submission.answers !== null) {
    return NextResponse.json({ status: "already_submitted" });
  }

  // 4. Validate time: started_at + 15min + 30s grace > now()
  const startedAt = new Date(submission.started_at).getTime();
  const deadline = startedAt + QUIZ_DURATION_MS + GRACE_PERIOD_MS;

  if (Date.now() > deadline) {
    return NextResponse.json(
      { error: "Quiz time has expired" },
      { status: 400 }
    );
  }

  // 5. Fetch questions with correct_index via admin client
  const { data: questions, error: qError } = await admin
    .from("questions")
    .select("id, correct_index, position")
    .eq("round_id", submission.round_id)
    .order("position", { ascending: true });

  if (qError || !questions) {
    return NextResponse.json(
      { error: "Failed to load questions for grading" },
      { status: 500 }
    );
  }

  const typedQuestions = questions as Pick<Question, "id" | "correct_index" | "position">[];

  // 6. Grade: count matches. Unanswered (-1) = 0 points
  let score = 0;
  const total = typedQuestions.length;

  for (let i = 0; i < total; i++) {
    const userAnswer = answers[i] ?? -1;
    if (userAnswer >= 0 && userAnswer === typedQuestions[i].correct_index) {
      score++;
    }
  }

  // 7. Compute points
  const submittedAt = new Date().toISOString();
  const pointsEarned = computePoints({
    correct: score,
    totalQuestions: total,
    startedAt: submission.started_at,
    submittedAt,
  });

  // 8. Update submission with score and points
  const { error: updateError } = await admin
    .from("submissions")
    .update({
      answers,
      score,
      points_earned: pointsEarned,
      submitted_at: submittedAt,
    })
    .eq("id", submission_id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }

  // 9. Compute snapshot rank: count submissions with higher points in this round
  const { count: higherCount } = await admin
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("round_id", submission.round_id)
    .gt("points_earned", pointsEarned)
    .not("answers", "is", null);

  const rank = (higherCount ?? 0) + 1;

  await admin
    .from("submissions")
    .update({ rank })
    .eq("id", submission_id);

  // 10. Update user stats: increment total_points and rounds_played
  const { data: currentUser } = await admin
    .from("users")
    .select("total_points, rounds_played")
    .eq("id", user.id)
    .single();

  if (currentUser) {
    await admin
      .from("users")
      .update({
        total_points: (currentUser.total_points ?? 0) + pointsEarned,
        rounds_played: (currentUser.rounds_played ?? 0) + 1,
      })
      .eq("id", user.id);
  }

  // 11. Upsert season_standings
  const { data: round } = await admin
    .from("rounds")
    .select("season_id")
    .eq("id", submission.round_id)
    .single();

  if (round) {
    const { data: existing } = await admin
      .from("season_standings")
      .select("id, total_points, rounds_entered, best_rank")
      .eq("user_id", user.id)
      .eq("season_id", round.season_id)
      .maybeSingle();

    if (existing) {
      await admin
        .from("season_standings")
        .update({
          total_points: existing.total_points + pointsEarned,
          rounds_entered: existing.rounds_entered + 1,
          best_rank: existing.best_rank === null
            ? rank
            : Math.min(existing.best_rank, rank),
        })
        .eq("id", existing.id);
    } else {
      await admin
        .from("season_standings")
        .insert({
          user_id: user.id,
          season_id: round.season_id,
          total_points: pointsEarned,
          rounds_entered: 1,
          best_rank: rank,
        });
    }
  }

  return NextResponse.json({
    status: "submitted",
    score,
    total,
    points_earned: pointsEarned,
    rank,
  });
}
