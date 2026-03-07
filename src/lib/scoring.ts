import { QUIZ_DURATION_MS } from "@/types/database";

interface ComputePointsInput {
  correct: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string;
}

/**
 * Compute round points (0–150).
 *
 * base_score  = (correct / total) × 100          → max 100
 * speed_bonus = (time_remaining / duration) × (correct / total) × 50  → max 50
 *
 * Grace-period submits (time > quiz duration) get 0 speed bonus.
 */
export function computePoints({
  correct,
  totalQuestions,
  startedAt,
  submittedAt,
}: ComputePointsInput): number {
  if (totalQuestions === 0) return 0;

  const accuracy = correct / totalQuestions;
  const baseScore = accuracy * 100;

  const elapsed = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
  const timeRemaining = Math.max(0, QUIZ_DURATION_MS - elapsed);
  const speedBonus = (timeRemaining / QUIZ_DURATION_MS) * accuracy * 50;

  return Math.round(baseScore + speedBonus);
}
