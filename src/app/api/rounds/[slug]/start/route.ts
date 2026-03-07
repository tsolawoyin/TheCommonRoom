import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoundState, QUIZ_DURATION_MS } from "@/types/database";
import type { Round, ClientQuestion } from "@/types/database";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Lookup round by slug
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("*")
    .eq("slug", slug)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const typedRound = round as Round;

  // 3. Verify round is active
  const state = getRoundState(typedRound);
  if (state !== "active") {
    return NextResponse.json(
      { error: `Round is ${state}, not active` },
      { status: 400 }
    );
  }

  // 4. Check for existing submission
  const { data: existingSubmission } = await supabase
    .from("submissions")
    .select("id, answers, started_at")
    .eq("user_id", user.id)
    .eq("round_id", typedRound.id)
    .maybeSingle();

  if (existingSubmission && existingSubmission.answers !== null) {
    return NextResponse.json({ status: "already_submitted" });
  }

  let submissionId: string;
  let startedAt: string;

  if (existingSubmission) {
    // Resume: submission exists with answers === null
    submissionId = existingSubmission.id;
    startedAt = existingSubmission.started_at;
  } else {
    // Use admin client to bypass RLS for the insert — auth and round
    // state are already verified above.
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data: newSub, error: insertError } = await admin
      .from("submissions")
      .insert({
        user_id: user.id,
        round_id: typedRound.id,
        started_at: now,
        answers: null,
        score: null,
      })
      .select("id, started_at")
      .single();

    if (insertError || !newSub) {
      console.error("Insert submission error:", insertError);
      return NextResponse.json(
        { error: "Failed to start quiz" },
        { status: 500 }
      );
    }

    submissionId = newSub.id;
    startedAt = newSub.started_at;
  }

  // 5. Calculate remaining time
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const remainingMs = Math.max(0, QUIZ_DURATION_MS - elapsed);

  // 6. Fetch questions (excluding correct_index via select)
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, round_id, question_text, options, position")
    .eq("round_id", typedRound.id)
    .order("position", { ascending: true });

  if (questionsError) {
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "quiz_active",
    round: {
      id: typedRound.id,
      title: typedRound.title,
      slug: typedRound.slug,
      essay_body: typedRound.essay_body,
    },
    questions: questions as ClientQuestion[],
    submission_id: submissionId,
    remaining_ms: remainingMs,
  });
}
