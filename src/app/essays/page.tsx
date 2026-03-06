"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, ArrowRight } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { LogoutButton } from "@/components/logout-button";
import { BottomNav } from "@/components/bottom-nav";
import { ROUND_DURATION_MS } from "@/types/database";
import type { Round } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

function EssayCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="animate-pulse">
        <div className="mb-2 h-3 w-28 rounded bg-[#0a2463]/10" />
        <div className="mb-3 h-6 w-3/4 rounded bg-[#0a2463]/10" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-[#0a2463]/10" />
          <div className="h-4 w-5/6 rounded bg-[#0a2463]/10" />
        </div>
      </div>
    </div>
  );
}

interface EssayWithSeason extends Round {
  season_name: string;
}

export default function EssaysPage() {
  const { user, supabase } = useApp();
  const [essays, setEssays] = useState<EssayWithSeason[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEssays = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("rounds")
        .select("*, seasons!inner(name)")
        .lt("starts_at", new Date(Date.now() - ROUND_DURATION_MS).toISOString())
        .order("starts_at", { ascending: false });

      if (data) {
        setEssays(
          data.map((r: Record<string, unknown>) => ({
            ...(r as unknown as Round),
            season_name: (r.seasons as { name: string }).name,
          }))
        );
      }
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEssays();
  }, [fetchEssays]);

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
          {user ? (
            <LogoutButton />
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[#0a2463]/70 hover:text-[#0a2463]"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pb-24 md:px-12">
        {/* Header */}
        <section className="pt-8 pb-10 md:pt-12 md:pb-14">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-2 flex items-center gap-2"
          >
            <BookOpen className="size-5 text-[#e8c547]" />
            <span className="text-sm font-medium uppercase tracking-widest text-[#0a2463]/50">
              Archive
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-(family-name:--font-playfair) text-3xl font-bold tracking-tight text-[#0a2463] md:text-4xl"
          >
            Past Essays
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-2 text-base text-[#1a1a2e]/60"
          >
            Revisit every essay from previous rounds.
          </motion.p>
        </section>

        {/* Essay List */}
        <section className="space-y-4">
          {loading ? (
            <>
              <EssayCardSkeleton />
              <EssayCardSkeleton />
              <EssayCardSkeleton />
            </>
          ) : essays.length === 0 ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="rounded-2xl bg-white/60 p-8 text-center shadow-sm backdrop-blur-sm"
            >
              <p className="text-sm text-[#1a1a2e]/50">
                No essays yet. Check back after the first round.
              </p>
            </motion.div>
          ) : (
            essays.map((essay, i) => (
              <motion.div
                key={essay.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i + 3}
              >
                <Link
                  href={`/essays/${essay.slug}`}
                  className="group block rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#0a2463]/40">
                    {essay.season_name} &middot;{" "}
                    {new Date(essay.starts_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <h2 className="font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463] group-hover:text-[#0a2463]/80">
                    {essay.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#1a1a2e]/60">
                    {essay.essay_body}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#e8c547]">
                    Read essay
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
