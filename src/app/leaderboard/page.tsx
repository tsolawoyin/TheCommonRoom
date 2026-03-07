"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Trophy, ArrowLeft } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { BottomNav } from "@/components/bottom-nav";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

interface SeasonInfo {
  name: string;
  prize_pool: number;
}

interface StandingRow {
  rank: number;
  user_id: string;
  full_name: string;
  total_points: number;
  rounds_entered: number;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#0a2463]/10 ${className ?? ""}`}
    />
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#0a2463]/5 px-6 py-4 last:border-0"
        >
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#e8c547] text-sm font-bold text-[#0a2463]">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-gray-300 text-sm font-bold text-gray-700">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-amber-700/80 text-sm font-bold text-white">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex size-8 items-center justify-center text-sm font-medium text-[#1a1a2e]/50">
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const { user, supabase } = useApp();

  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      // Parallel: season info + leaderboard RPC
      const [seasonRes, leaderboardRes] = await Promise.all([
        supabase
          .from("seasons")
          .select("name, prize_pool")
          .eq("is_active", true)
          .order("start_date", { ascending: false })
          .limit(1)
          .single(),
        supabase.rpc("get_season_leaderboard"),
      ]);

      if (seasonRes.error) {
        setError("No active season found");
        return;
      }
      setSeason(seasonRes.data as SeasonInfo);

      if (leaderboardRes.error) {
        setError("Failed to load leaderboard");
        return;
      }
      setStandings((leaderboardRes.data as StandingRow[]) ?? []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-svh bg-[#f5f0e8] text-[#1a1a2e]">
      {/* Nav */}
      <nav className="flex items-center gap-4 px-6 py-5 md:px-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-[#0a2463] hover:text-[#0a2463]/70 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </nav>

      <main className="mx-auto max-w-2xl px-6 pb-24">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="pb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0a2463]">
              <Trophy className="size-4 text-[#e8c547]" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#1a1a2e]/40">
                Season Leaderboard
              </p>
              <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-48" />
                ) : (
                  season?.name ?? "Leaderboard"
                )}
              </h1>
            </div>
          </div>

          {!loading && season && season.prize_pool > 0 && (
            <div className="mt-6 rounded-2xl bg-[#0a2463] p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-white/50">
                Season Prize
              </p>
              <p className="mt-1 font-(family-name:--font-playfair) text-2xl font-bold text-[#e8c547]">
                ₦{season.prize_pool.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Top player at end of season wins
              </p>
            </div>
          )}
        </motion.div>

        {error ? (
          <div className="rounded-2xl bg-white/60 p-8 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm text-[#1a1a2e]/60">{error}</p>
          </div>
        ) : loading ? (
          <TableSkeleton />
        ) : standings.length === 0 ? (
          <div className="rounded-2xl bg-white/60 p-8 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm text-[#1a1a2e]/50">
              No standings yet. Compete in a round to get on the board!
            </p>
          </div>
        ) : (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            {/* Participant count */}
            <p className="mb-4 text-sm text-[#1a1a2e]/50">
              {standings.length} player{standings.length !== 1 && "s"}
            </p>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm">
              {/* Desktop header */}
              <table className="hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-[#0a2463]/10 text-xs uppercase tracking-wider text-[#1a1a2e]/40">
                    <th className="px-6 py-3 font-medium w-16">Rank</th>
                    <th className="px-6 py-3 font-medium">Player</th>
                    <th className="px-6 py-3 font-medium text-right">Rounds</th>
                    <th className="px-6 py-3 font-medium text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry) => {
                    const isMe = user?.id === entry.user_id;
                    return (
                      <tr
                        key={entry.user_id}
                        className={`border-b border-[#0a2463]/5 last:border-0 ${
                          isMe ? "bg-[#e8c547]/10" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${isMe ? "text-[#0a2463]" : ""}`}>
                            {entry.full_name}
                          </span>
                          {isMe && (
                            <span className="ml-2 text-xs text-[#e8c547] font-medium">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums">
                          {entry.rounds_entered}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-[#e8c547] tabular-nums">
                          {entry.total_points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile list */}
              <div className="divide-y divide-[#0a2463]/5 md:hidden">
                {standings.map((entry) => {
                  const isMe = user?.id === entry.user_id;
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 px-5 py-4 ${
                        isMe ? "bg-[#e8c547]/10" : ""
                      }`}
                    >
                      <RankBadge rank={entry.rank} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${isMe ? "text-[#0a2463]" : ""}`}>
                          {entry.full_name}
                          {isMe && (
                            <span className="ml-2 text-xs text-[#e8c547] font-medium">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#1a1a2e]/40">
                          {entry.rounds_entered} round{entry.rounds_entered !== 1 && "s"}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[#e8c547] tabular-nums">
                        {entry.total_points} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
