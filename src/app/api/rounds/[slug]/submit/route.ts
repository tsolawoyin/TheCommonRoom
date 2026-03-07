import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Thin beacon proxy — only used by sendBeacon on tab close.
 * Normal submits go directly via supabase.rpc("submit_quiz").
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Parse body — sendBeacon may send as text/plain
  let body: { submission_id: string; answers: number[] };
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
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

  // Call the RPC via admin client, passing user_id for auth
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("submit_quiz", {
    p_submission_id: submission_id,
    p_answers: answers,
    p_user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
