"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface QuestionInput {
  question_text: string;
  options: [string, string, string, string];
  correct_index: number;
}

interface CreateRoundInput {
  title: string;
  slug: string;
  season_id: string;
  essay_body: string;
  starts_at: string;
  sponsor_name?: string;
  sponsor_logo_url?: string;
  questions: QuestionInput[];
}

export async function createRound(input: CreateRoundInput) {
  // Verify caller is admin via session
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!userData || userData.role !== "admin") {
    return { error: "Unauthorized" };
  }

  // Validate input
  if (!input.title.trim()) return { error: "Title is required" };
  if (!input.slug.trim()) return { error: "Slug is required" };
  if (!input.season_id) return { error: "Season is required" };
  if (!input.essay_body.trim()) return { error: "Essay body is required" };
  if (!input.starts_at) return { error: "Start time is required" };
  if (input.questions.length === 0)
    return { error: "At least one question is required" };

  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    if (!q.question_text.trim())
      return { error: `Question ${i + 1} text is required` };
    if (q.options.some((o) => !o.trim()))
      return { error: `All options for question ${i + 1} are required` };
    if (q.correct_index < 0 || q.correct_index > 3)
      return { error: `Invalid correct answer for question ${i + 1}` };
  }

  // Use admin client to bypass RLS
  const admin = createAdminClient();

  // Insert round
  const { data: round, error: roundError } = await admin
    .from("rounds")
    .insert({
      title: input.title.trim(),
      slug: input.slug.trim(),
      season_id: input.season_id,
      essay_body: input.essay_body.trim(),
      starts_at: input.starts_at,
      sponsor_name: input.sponsor_name?.trim() || null,
      sponsor_logo_url: input.sponsor_logo_url?.trim() || null,
    })
    .select("id")
    .single();

  if (roundError) {
    if (roundError.code === "23505") {
      return { error: "A round with this slug already exists" };
    }
    return { error: roundError.message };
  }

  // Insert questions
  const questions = input.questions.map((q, i) => ({
    round_id: round.id,
    question_text: q.question_text.trim(),
    options: q.options.map((o) => o.trim()),
    correct_index: q.correct_index,
    position: i + 1,
  }));

  const { error: questionsError } = await admin
    .from("questions")
    .insert(questions);

  if (questionsError) {
    // Clean up the round if questions fail
    await admin.from("rounds").delete().eq("id", round.id);
    return { error: `Failed to create questions: ${questionsError.message}` };
  }

  return { success: true, roundId: round.id };
}
