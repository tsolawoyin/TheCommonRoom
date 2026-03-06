import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoundState, getRoundEndsAt, ROUND_DURATION_MS } from "@/types/database";
import type { Round, Season, RoundState } from "@/types/database";

export interface CurrentRoundResponse {
  round: Omit<Round, "essay_body"> | null;
  season: Pick<Season, "id" | "name" | "prize_pool" | "sponsor_name" | "sponsor_logo_url"> | null;
  round_number: number;
  state: RoundState | null;
  has_submitted: boolean;
  prize_per_round: number;
}

export async function GET() {
  const supabase = await createClient();

  // Get authenticated user (optional — dashboard works for logged-in users)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find the first round whose starts_at + 24h is in the future (active or upcoming),
  // ordered by starts_at so we get the earliest relevant one.
  const cutoff = new Date(Date.now() - ROUND_DURATION_MS).toISOString();
  const { data: rounds, error: roundError } = await supabase
    .from("rounds")
    .select("*")
    .gt("starts_at", cutoff)
    .order("starts_at", { ascending: true })
    .limit(1);

  if (roundError) {
    return NextResponse.json(
      { error: "Failed to fetch rounds." },
      { status: 500 }
    );
  }

  const round = (rounds?.[0] as Round) ?? null;

  if (!round) {
    return NextResponse.json<CurrentRoundResponse>({
      round: null,
      season: null,
      round_number: 0,
      state: null,
      has_submitted: false,
      prize_per_round: 0,
    });
  }

  // Fetch season
  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, prize_pool, sponsor_name, sponsor_logo_url")
    .eq("id", round.season_id)
    .single();

  // Determine round number within season
  const { count } = await supabase
    .from("rounds")
    .select("id", { count: "exact", head: true })
    .eq("season_id", round.season_id)
    .lte("starts_at", round.starts_at);

  const roundNumber = count ?? 1;

  const state = getRoundState(round);

  // Check if user has submitted for this round
  let hasSubmitted = false;
  if (user) {
    const { data: submission } = await supabase
      .from("submissions")
      .select("id, answers")
      .eq("user_id", user.id)
      .eq("round_id", round.id)
      .limit(1)
      .maybeSingle();

    hasSubmitted = !!submission?.answers;
  }

  // Strip essay_body from response; also strip title if upcoming
  const { essay_body: _, ...roundWithoutEssay } = round;
  const safeRound =
    state === "upcoming"
      ? { ...roundWithoutEssay, title: "To be revealed..." }
      : roundWithoutEssay;

  const prizePerRound = season ? Math.round(season.prize_pool / 10) : 0;

  return NextResponse.json<CurrentRoundResponse>({
    round: safeRound,
    season: (season as CurrentRoundResponse["season"]) ?? null,
    round_number: roundNumber,
    state,
    has_submitted: hasSubmitted,
    prize_per_round: prizePerRound,
  });
}
