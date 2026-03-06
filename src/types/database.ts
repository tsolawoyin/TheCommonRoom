export type UserRole = "user" | "admin";

export type RoundStatus = "draft" | "active" | "closed";

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
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  season_id: string;
  title: string;
  slug: string;
  essay_body: string;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  prize_amount: number;
  starts_at: string;
  ends_at: string;
  status: RoundStatus;
  winner_id: string | null;
  created_at: string;
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
