"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
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

interface EssayData extends Round {
  season_name: string;
}

export default function EssayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, supabase } = useApp();
  const [essay, setEssay] = useState<EssayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchEssay = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("rounds")
        .select("*, seasons!inner(name)")
        .eq("slug", slug)
        .lt("starts_at", new Date(Date.now() - ROUND_DURATION_MS).toISOString())
        .single();

      if (data) {
        setEssay({
          ...(data as unknown as Round),
          season_name: (data.seasons as { name: string }).name,
        });
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [supabase, slug]);

  useEffect(() => {
    fetchEssay();
  }, [fetchEssay]);

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

      <main className="mx-auto max-w-2xl px-6 pb-24 md:px-12">
        {/* Back link */}
        <Link
          href="/essays"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a2463]/50 hover:text-[#0a2463]"
        >
          <ArrowLeft className="size-3.5" />
          All essays
        </Link>

        {loading ? (
          <div className="mt-8 animate-pulse space-y-4">
            <div className="h-3 w-32 rounded bg-[#0a2463]/10" />
            <div className="h-10 w-3/4 rounded bg-[#0a2463]/10" />
            <div className="mt-8 space-y-3">
              <div className="h-4 w-full rounded bg-[#0a2463]/10" />
              <div className="h-4 w-full rounded bg-[#0a2463]/10" />
              <div className="h-4 w-5/6 rounded bg-[#0a2463]/10" />
              <div className="h-4 w-full rounded bg-[#0a2463]/10" />
              <div className="h-4 w-4/6 rounded bg-[#0a2463]/10" />
            </div>
          </div>
        ) : notFound ? (
          <div className="mt-16 text-center">
            <p className="font-(family-name:--font-playfair) text-xl font-semibold text-[#0a2463]/50">
              Essay not found.
            </p>
            <p className="mt-2 text-sm text-[#1a1a2e]/40">
              It may not be available yet or the link is incorrect.
            </p>
          </div>
        ) : essay ? (
          <article className="mt-8">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0a2463]/40"
            >
              {essay.season_name} &middot;{" "}
              {new Date(essay.starts_at).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </motion.p>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-(family-name:--font-playfair) text-3xl font-bold leading-tight tracking-tight text-[#0a2463] md:text-4xl"
            >
              {essay.title}
            </motion.h1>

            {essay.sponsor_name && (
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="mt-3 text-sm text-[#1a1a2e]/50"
              >
                Sponsored by {essay.sponsor_name}
              </motion.p>
            )}

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-8 whitespace-pre-line text-base leading-relaxed text-[#1a1a2e]/80"
            >
              {essay.essay_body}
            </motion.div>
          </article>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
