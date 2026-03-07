"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import type { ClientQuestion } from "@/types/database";

/* ── Types ── */

type PageState =
  | "loading"
  | "error"
  | "already_submitted"
  | "quiz_active"
  | "submitting"
  | "submitted";

interface QuizData {
  round: { id: string; title: string; slug: string; essay_body: string };
  questions: ClientQuestion[];
  submission_id: string;
  remaining_ms: number;
}

interface SubmitResult {
  score: number;
  total: number;
  points_earned: number;
  rank: number;
}

/* ── Timer Hook ── */

function useQuizTimer(remainingMs: number | null, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const expireCbRef = useRef(onExpire);
  expireCbRef.current = onExpire;

  useEffect(() => {
    if (remainingMs === null) return;

    deadlineRef.current = Date.now() + remainingMs;
    setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current! - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        expireCbRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingMs]);

  return secondsLeft;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ── Quiz Page ── */

export default function QuizPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { supabase } = useApp();
  const slug = params.slug;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  const submittedRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);
  const answersRef = useRef<number[]>([]);
  answersRef.current = answers;

  // ── Start quiz ──
  useEffect(() => {
    let cancelled = false;

    async function startQuiz() {
      try {
        const { data, error } = await supabase.rpc("start_quiz", {
          p_slug: slug,
        });

        if (cancelled) return;

        if (error) {
          setErrorMsg(error.message ?? "Failed to start quiz");
          setPageState("error");
          return;
        }

        if (data.status === "already_submitted") {
          setPageState("already_submitted");
          return;
        }

        const quiz = data as QuizData;
        setQuizData(quiz);
        setAnswers(new Array(quiz.questions.length).fill(-1));
        submissionIdRef.current = quiz.submission_id;
        setPageState("quiz_active");
      } catch {
        if (!cancelled) {
          setErrorMsg("Network error. Please try again.");
          setPageState("error");
        }
      }
    }

    startQuiz();
    return () => { cancelled = true; };
  }, [slug, supabase]);

  // ── Submit handler ──
  const doSubmit = useCallback(
    async (useBeacon = false) => {
      if (submittedRef.current || !submissionIdRef.current) return;
      submittedRef.current = true;

      // Beacon fallback for tab close — can't set auth headers, uses thin API route
      if (useBeacon) {
        const payload = JSON.stringify({
          submission_id: submissionIdRef.current,
          answers: answersRef.current,
        });
        navigator.sendBeacon(
          `/api/rounds/${slug}/submit`,
          new Blob([payload], { type: "application/json" })
        );
        return;
      }

      setPageState("submitting");

      try {
        const { data, error } = await supabase.rpc("submit_quiz", {
          p_submission_id: submissionIdRef.current,
          p_answers: answersRef.current,
        });

        if (error) {
          setErrorMsg(error.message ?? "Submit failed");
          setPageState("error");
          return;
        }

        if (data.status === "already_submitted") {
          setPageState("already_submitted");
          return;
        }

        if (data.status === "submitted") {
          setSubmitResult({
            score: data.score,
            total: data.total,
            points_earned: data.points_earned,
            rank: data.rank,
          });
          setPageState("submitted");
        } else {
          setErrorMsg("Submit failed");
          setPageState("error");
        }
      } catch {
        setErrorMsg("Failed to submit. Your answers may have been saved.");
        setPageState("error");
      }
    },
    [slug, supabase]
  );

  // ── Timer expiry ──
  const handleTimerExpire = useCallback(() => {
    doSubmit(false);
  }, [doSubmit]);

  const secondsLeft = useQuizTimer(
    quizData?.remaining_ms ?? null,
    handleTimerExpire
  );

  // ── Anti-cheat: visibility change → blur ──
  useEffect(() => {
    if (pageState !== "quiz_active") return;

    function handleVisibility() {
      setIsBlurred(document.hidden);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [pageState]);

  // ── Anti-cheat: beforeunload + pagehide → sendBeacon ──
  useEffect(() => {
    if (pageState !== "quiz_active") return;

    function handleUnload() {
      doSubmit(true);
    }

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [pageState, doSubmit]);

  // ── Prevent copy/paste/right-click on essay ──
  function preventCopy(e: React.SyntheticEvent) {
    e.preventDefault();
  }

  // ── Set answer ──
  function selectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
    setShowConfirm(false);
  }

  const answeredCount = answers.filter((a) => a >= 0).length;
  const totalQuestions = quizData?.questions.length ?? 0;
  const unansweredCount = totalQuestions - answeredCount;

  /* ── Render states ── */

  if (pageState === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f5f0e8]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-[#0a2463] border-t-transparent" />
          <p className="text-sm text-[#1a1a2e]/60">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#f5f0e8] px-6">
        <div className="max-w-md text-center">
          <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-[#1a1a2e]/60">{errorMsg}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-[#0a2463] px-6 py-2.5 text-sm font-medium text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === "already_submitted") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#f5f0e8] px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#0a2463]/10">
            <CheckCircle2 className="size-8 text-[#0a2463]" />
          </div>
          <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
            Already Submitted
          </h1>
          <p className="mt-3 text-sm text-[#1a1a2e]/60">
            You&apos;ve already submitted your answers for this round.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/leaderboard"
              className="inline-block rounded-lg bg-[#0a2463] px-6 py-2.5 text-sm font-medium text-white"
            >
              View Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg border border-[#0a2463]/20 px-6 py-2.5 text-sm font-medium text-[#0a2463]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "submitting") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f5f0e8]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-[#0a2463] border-t-transparent" />
          <p className="text-sm text-[#1a1a2e]/60">Submitting your answers...</p>
        </div>
      </div>
    );
  }

  if (pageState === "submitted" && submitResult) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#f5f0e8] px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-10 text-green-600" />
          </div>
          <h1 className="font-(family-name:--font-playfair) text-3xl font-bold text-[#0a2463]">
            Quiz Submitted!
          </h1>

          {/* Score + Points + Rank */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-[#1a1a2e]/40">
                Score
              </p>
              <p className="mt-1 font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
                {submitResult.score}/{submitResult.total}
              </p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-[#1a1a2e]/40">
                Points
              </p>
              <p className="mt-1 font-(family-name:--font-playfair) text-2xl font-bold text-[#e8c547]">
                {submitResult.points_earned}
              </p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-[#1a1a2e]/40">
                Rank
              </p>
              <p className="mt-1 font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
                #{submitResult.rank}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-[#1a1a2e]/60">
            Your rank may change as more players submit.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/leaderboard"
              className="inline-block rounded-lg bg-[#0a2463] px-6 py-2.5 text-sm font-medium text-white"
            >
              View Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg border border-[#0a2463]/20 px-6 py-2.5 text-sm font-medium text-[#0a2463]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Active quiz ── */
  const quiz = quizData!;
  const isLowTime = (secondsLeft ?? 0) < 120;
  const isCritical = (secondsLeft ?? 0) < 30;

  return (
    <div className="min-h-svh bg-[#f5f0e8] text-[#1a1a2e]">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-50 border-b border-[#0a2463]/10 bg-[#f5f0e8]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <h1 className="font-(family-name:--font-playfair) text-lg font-bold text-[#0a2463] truncate mr-4">
            {quiz.round.title}
          </h1>
          <div
            className={cn(
              "font-mono text-xl font-bold tabular-nums shrink-0",
              isCritical
                ? "animate-pulse text-red-600"
                : isLowTime
                  ? "text-red-600"
                  : "text-[#0a2463]"
            )}
          >
            {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
          </div>
        </div>
      </header>

      {/* Blur overlay for tab switch */}
      {isBlurred && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#f5f0e8]/80 backdrop-blur-lg">
          <p className="font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463]">
            Return to this tab to continue
          </p>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-6 pb-32 pt-8">
        {/* Essay */}
        <section
          className="select-none rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm md:p-8"
          onCopy={preventCopy}
          onCut={preventCopy}
          onPaste={preventCopy}
          onContextMenu={preventCopy}
        >
          <h2 className="mb-4 font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463]">
            Essay
          </h2>
          <div className="prose prose-sm max-w-none text-[#1a1a2e]/80 leading-relaxed whitespace-pre-line">
            {quiz.round.essay_body}
          </div>
        </section>

        {/* Questions */}
        <section className="mt-8 space-y-6">
          <h2 className="font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463]">
            Questions
          </h2>

          {quiz.questions.map((q, qi) => (
            <div
              key={q.id}
              className="rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm"
            >
              <p className="mb-4 font-medium text-[#0a2463]">
                <span className="mr-2 text-[#e8c547]">{qi + 1}.</span>
                {q.question_text}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oi) => {
                  const isSelected = answers[qi] === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => selectAnswer(qi, oi)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-[#0a2463] bg-[#0a2463]/5"
                          : "border-transparent bg-[#f5f0e8]/60 hover:border-[#0a2463]/20"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isSelected
                            ? "border-[#0a2463] bg-[#0a2463]"
                            : "border-[#0a2463]/30"
                        )}
                      >
                        {isSelected && (
                          <span className="size-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span className={isSelected ? "text-[#0a2463] font-medium" : ""}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Submit area */}
        <div className="mt-10">
          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="w-full rounded-xl bg-[#0a2463] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2463]/90"
            >
              Submit Answers
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-[#0a2463]/20 bg-white/60 p-6 text-center backdrop-blur-sm">
              <p className="text-sm text-[#1a1a2e]/70">
                You&apos;ve answered{" "}
                <span className="font-bold text-[#0a2463]">
                  {answeredCount}/{totalQuestions}
                </span>{" "}
                questions.
                {unansweredCount > 0 && (
                  <span className="text-red-600">
                    {" "}
                    {unansweredCount} unanswered will score 0.
                  </span>
                )}
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-[#0a2463]/20 px-5 py-2 text-sm font-medium text-[#0a2463]"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => doSubmit(false)}
                  className="rounded-lg bg-[#0a2463] px-5 py-2 text-sm font-semibold text-white"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
