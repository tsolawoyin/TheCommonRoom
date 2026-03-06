export type UserRole = "user" | "admin";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  total_points: number;
  rounds_played: number;
  created_at: string;
}

export interface Season {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  prize_pool: number;
  created_at: string;
}

/** Round duration is always 24 hours from starts_at */
export const ROUND_DURATION_MS = 24 * 60 * 60 * 1000;

export interface Round {
  id: string;
  season_id: string;
  title: string;
  slug: string;
  essay_body: string;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  starts_at: string;
  winner_id: string | null;
  created_at: string;
}

/** Computed round state based on dates (ends 24h after starts_at) */
export type RoundState = "upcoming" | "active" | "closed";

export function getRoundEndsAt(round: Pick<Round, "starts_at">): string {
  return new Date(new Date(round.starts_at).getTime() + ROUND_DURATION_MS).toISOString();
}

export function getRoundState(round: Pick<Round, "starts_at">): RoundState {
  const now = Date.now();
  const start = new Date(round.starts_at).getTime();
  const end = start + ROUND_DURATION_MS;
  if (now < start) return "upcoming";
  if (now <= end) return "active";
  return "closed";
}

export interface Question {
  id: string;
  round_id: string;
  question_text: string;
  options: string[];
  correct_index: number; // Server-side only — NEVER return to client
  position: number;
}

/** Client-safe question — excludes correct_index */
export type ClientQuestion = Omit<Question, "correct_index">;

export interface Submission {
  id: string;
  user_id: string;
  round_id: string;
  answers: number[];
  score: number;
  rank: number | null;
  points_earned: number;
  submitted_at: string;
}

export interface SeasonStanding {
  id: string;
  user_id: string;
  season_id: string;
  total_points: number;
  rounds_entered: number;
  best_rank: number | null;
}
