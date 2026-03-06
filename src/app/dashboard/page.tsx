"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Trophy, Hash, Star } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { getRoundState, getRoundEndsAt, ROUND_DURATION_MS } from "@/types/database";
import type { Round, Season, Submission, RoundState } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ── Skeleton primitives ── */

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#0a2463]/10 ${className ?? ""}`}
    />
  );
}

function RoundCardSkeleton() {
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-[#0a2463] p-8 text-center md:p-12">
      <Skeleton className="mx-auto mb-3 h-4 w-32 !bg-white/10" />
      <Skeleton className="mx-auto mb-6 h-8 w-64 !bg-white/10" />
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <Skeleton className="mx-auto mb-1 h-8 w-12 !bg-white/10" />
            <Skeleton className="mx-auto h-3 w-8 !bg-white/10" />
          </div>
        ))}
      </div>
      <Skeleton className="mx-auto mt-5 h-6 w-28 !bg-[#e8c547]/20" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm">
      <Skeleton className="mb-3 size-10 rounded-xl" />
      <Skeleton className="mb-2 h-7 w-12" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#0a2463]/5 px-6 py-4 last:border-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

/* ── Data types ── */

interface RoundData {
  round: Round | null;
  season: Season | null;
  roundNumber: number;
  state: RoundState | null;
  hasSubmitted: boolean;
  prizePerRound: number;
}

/* ── Countdown ── */

function useCountdown(target: string | null) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!target) return;

    function update() {
      const diff = new Date(target!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return timeLeft;
}

function CountdownDisplay({ target }: { target: string }) {
  const timeLeft = useCountdown(target);
  if (!timeLeft) return null;

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {units.map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="font-(family-name:--font-playfair) text-2xl font-bold md:text-3xl">
            {String(unit.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-wider text-white/60">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Round Card ── */

function RoundCard({ data }: { data: RoundData }) {
  const { round, season, roundNumber, state, hasSubmitted, prizePerRound } =
    data;

  if (!round || !state) {
    return (
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-[#0a2463]/10 p-8 text-center md:p-12">
        <p className="font-(family-name:--font-playfair) text-xl font-semibold text-[#0a2463]/50">
          No round scheduled yet. Stay tuned.
        </p>
      </div>
    );
  }

  const subtitle = `Round ${roundNumber}${season ? ` · ${season.name}` : ""}`;
  const title = state === "upcoming" ? "To be revealed..." : round.title;
  const countdownTarget =
    state === "upcoming" ? round.starts_at : getRoundEndsAt(round);
  const countdownLabel =
    state === "upcoming" ? "Starts in" : "Time remaining";

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-[#0a2463] p-8 text-center text-white shadow-lg md:p-12">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#e8c547]">
        {subtitle}
      </p>

      <h2 className="font-(family-name:--font-playfair) text-2xl font-bold md:text-3xl">
        {title}
      </h2>

      <div className="mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
          {countdownLabel}
        </p>
        <CountdownDisplay target={countdownTarget} />
      </div>

      {prizePerRound > 0 && (
        <p className="mt-5 text-lg font-semibold text-[#e8c547]">
          ₦{prizePerRound.toLocaleString()} prize
        </p>
      )}

      {state === "active" && (
        <div className="mt-6">
          {hasSubmitted ? (
            <p className="text-sm font-medium text-white/60">
              Already submitted
            </p>
          ) : (
            <Button
              asChild
              size="lg"
              className="bg-[#e8c547] text-[#0a2463] hover:bg-[#e8c547]/90"
            >
              <Link href={`/rounds/${round.slug}`}>Enter Round</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ── */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#0a2463]">
        <Icon className="size-4 text-[#e8c547]" />
      </div>
      <p className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[#1a1a2e]/60">{label}</p>
    </div>
  );
}

/* ── Dashboard Page ── */

export default function DashboardPage() {
  const { user, authLoading, supabase } = useApp();
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [roundLoading, setRoundLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<
    (Submission & { round_title: string })[]
  >([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  const fetchRound = useCallback(async () => {
    try {
      // Find first round whose starts_at + 24h is in the future
      const cutoff = new Date(Date.now() - ROUND_DURATION_MS).toISOString();
      const { data: rounds } = await supabase
        .from("rounds")
        .select("*")
        .gt("starts_at", cutoff)
        .order("starts_at", { ascending: true })
        .limit(1);

      const round = (rounds?.[0] as Round) ?? null;

      if (!round) {
        setRoundData({
          round: null,
          season: null,
          roundNumber: 0,
          state: null,
          hasSubmitted: false,
          prizePerRound: 0,
        });
        return;
      }

      // Fetch season + round number in parallel
      const [seasonRes, countRes] = await Promise.all([
        supabase
          .from("seasons")
          .select("*")
          .eq("id", round.season_id)
          .single(),
        supabase
          .from("rounds")
          .select("id", { count: "exact", head: true })
          .eq("season_id", round.season_id)
          .lte("starts_at", round.starts_at),
      ]);

      const season = (seasonRes.data as Season) ?? null;
      const roundNumber = countRes.count ?? 1;
      const state = getRoundState(round);

      // Check if user already submitted
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

      const prizePerRound = season ? Math.round(season.prize_pool / 10) : 0;

      setRoundData({
        round,
        season,
        roundNumber,
        state,
        hasSubmitted,
        prizePerRound,
      });
    } catch {
      setRoundData({
        round: null,
        season: null,
        roundNumber: 0,
        state: null,
        hasSubmitted: false,
        prizePerRound: 0,
      });
    } finally {
      setRoundLoading(false);
    }
  }, [supabase, user]);

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissionsLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("submissions")
        .select("*, rounds!inner(title)")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(5);

      if (data) {
        setRecentSubmissions(
          data.map((s: Record<string, unknown>) => ({
            ...(s as unknown as Submission),
            round_title: (s.rounds as { title: string }).title,
          }))
        );
      }
    } catch {
      // leave empty
    } finally {
      setSubmissionsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (authLoading) return;
    fetchRound();
    fetchSubmissions();
  }, [authLoading, fetchRound, fetchSubmissions]);

  const greeting = user?.full_name
    ? `Welcome back, ${user.full_name.split(" ")[0]}`
    : "Welcome back";

  const subtitle =
    roundData?.state === "active"
      ? "A round is live — time to compete."
      : roundData?.state === "upcoming"
        ? "A new round is coming soon."
        : "Check back soon for the next round.";

  return (
    <div className="min-h-svh bg-[#f5f0e8] text-[#1a1a2e]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/"
          className="font-(family-name:--font-playfair) text-xl font-bold tracking-tight text-[#0a2463]"
        >
          TheCommonRoom
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-[#1a1a2e]/60 md:block">
              {user.full_name}
            </span>
          )}
          <LogoutButton />
        </div>
      </nav>

      {/* Content */}
      <main className="px-6 pb-24 md:px-12">
        {/* Greeting */}
        <section className="pt-8 pb-10 md:pt-12 md:pb-14">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="font-(family-name:--font-playfair) text-3xl font-bold tracking-tight text-[#0a2463] md:text-4xl"
          >
            {authLoading ? (
              <Skeleton className="h-10 w-72" />
            ) : (
              greeting
            )}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mt-2 text-base text-[#1a1a2e]/60"
          >
            {roundLoading ? (
              <Skeleton className="h-5 w-56" />
            ) : (
              subtitle
            )}
          </motion.p>
        </section>

        {/* Active Round Card */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          {roundLoading ? (
            <RoundCardSkeleton />
          ) : roundData ? (
            <RoundCard data={roundData} />
          ) : (
            <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-[#0a2463]/10 p-8 text-center md:p-12">
              <p className="font-(family-name:--font-playfair) text-xl font-semibold text-[#0a2463]/50">
                No round scheduled yet. Stay tuned.
              </p>
            </div>
          )}
        </motion.section>

        {/* Personal Stats */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mx-auto mt-12 max-w-2xl"
        >
          <h2 className="mb-6 font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463]">
            Your Stats
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {authLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  icon={Hash}
                  label="Rounds Played"
                  value={user?.rounds_played ?? 0}
                />
                <StatCard
                  icon={Trophy}
                  label="Total Points"
                  value={user?.total_points ?? 0}
                />
                <StatCard
                  icon={Star}
                  label="Best Rank"
                  value={
                    recentSubmissions.length > 0
                      ? Math.min(
                          ...recentSubmissions
                            .map((s) => s.rank)
                            .filter((r): r is number => r !== null)
                        ) || "—"
                      : "—"
                  }
                />
              </>
            )}
          </div>
        </motion.section>

        {/* Recent Performance */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mx-auto mt-12 max-w-2xl"
        >
          <h2 className="mb-6 font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463]">
            Recent Performance
          </h2>

          {submissionsLoading ? (
            <PerformanceSkeleton />
          ) : recentSubmissions.length === 0 ? (
            <div className="rounded-2xl bg-white/60 p-8 text-center shadow-sm backdrop-blur-sm">
              <p className="text-sm text-[#1a1a2e]/50">
                You haven&apos;t competed yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#0a2463]/10 text-xs uppercase tracking-wider text-[#1a1a2e]/40">
                    <th className="px-6 py-3 font-medium">Round</th>
                    <th className="px-6 py-3 font-medium">Score</th>
                    <th className="px-6 py-3 font-medium">Rank</th>
                    <th className="px-6 py-3 font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-[#0a2463]/5 last:border-0"
                    >
                      <td className="px-6 py-4 font-medium text-[#0a2463]">
                        {sub.round_title}
                      </td>
                      <td className="px-6 py-4">{sub.score}</td>
                      <td className="px-6 py-4">{sub.rank ?? "—"}</td>
                      <td className="px-6 py-4 font-medium text-[#e8c547]">
                        +{sub.points_earned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}
