"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  BookOpen,
  Trophy,
  Clock,
  ArrowRight,
  ChevronDown,
  Users,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/providers/app-provider";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const steps = [
  {
    icon: BookOpen,
    title: "Read the Essay",
    description:
      "A new long-form essay drops every week on a topic that matters.",
  },
  {
    icon: Clock,
    title: "Take the Quiz",
    description:
      "15 minutes. Multiple choice. The closer you read, the higher you score.",
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description:
      "Top the leaderboard and take home cash at the end of the season.",
  },
];

const faqItems = [
  {
    question: "How does the competition work?",
    answer:
      "Each week, a new essay is published. You read it, take a timed quiz, and earn points based on how well you understood the material. Points accumulate across all 10 rounds.",
  },
  {
    question: "How long does the competition last?",
    answer:
      "The competition lasts for 10 weeks.",
  },
   {
    question: "How are prizes distributed?",
    answer:
      "The \u20A6100,000 prize pool is distributed at the end of the season based on the final leaderboard standings. The more rounds you compete in, the better your chances.",
  },
  {
    question: "Do I need to participate in every round?",
    answer:
      "No, but participating in more rounds gives you more opportunities to earn points and climb the leaderboard. You can join at any time during the season.",
  },
  {
    question: "Is it free to participate?",
    answer:
      "Yes, TheCommonRoom is completely free to join and participate in. Just sign up and start reading.",
  },
];

/* ── Countdown Hook ── */

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

/* ── FAQ Accordion Item ── */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#0a2463]/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-(family-name:--font-playfair) text-base font-semibold text-[#0a2463] md:text-lg">
          {question}
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-[#0a2463]/40 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-[#1a1a2e]/60">
          {answer}
        </p>
      )}
    </div>
  );
}

/* ── Types ── */

interface SeasonInfo {
  name: string;
  prize_pool: number;
  start_date: string;
  end_date: string;
}

interface StandingRow {
  rank: number;
  user_id: string;
  full_name: string;
  total_points: number;
  rounds_entered: number;
}

/* ── Landing Page ── */

export default function LandingPage() {
  const { user, authLoading, supabase } = useApp();
  const router = useRouter();

  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [topPlayers, setTopPlayers] = useState<StandingRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [seasonRes, leaderboardRes] = await Promise.all([
        supabase
          .from("seasons")
          .select("name, prize_pool, start_date, end_date")
          .eq("is_active", true)
          .order("start_date", { ascending: false })
          .limit(1)
          .single(),
        supabase.rpc("get_season_leaderboard"),
      ]);

      if (!seasonRes.error && seasonRes.data) {
        setSeason(seasonRes.data as SeasonInfo);
      }

      if (!leaderboardRes.error && leaderboardRes.data) {
        setTopPlayers((leaderboardRes.data as StandingRow[]).slice(0, 5));
      }
    } catch {
      // Silently fail — page still renders with placeholder content
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  if (authLoading || user) {
    return <div className="min-h-svh bg-[#f5f0e8]" />;
  }

  const seasonName = season?.name ?? "Season 1";
  const countdownTarget = season?.start_date ?? "2026-04-01T00:00:00Z";

  const now = Date.now();
  const startTime = new Date(countdownTarget).getTime();
  const endTime = season?.end_date
    ? new Date(season.end_date).getTime()
    : Infinity;
  const seasonState: "upcoming" | "live" | "ended" =
    now < startTime ? "upcoming" : now <= endTime ? "live" : "ended";

  return (
    <div className="min-h-svh bg-[#f5f0e8] text-[#1a1a2e]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-(family-name:--font-playfair) text-xl font-bold tracking-tight text-[#0a2463]">
          TheCommonRoom
        </span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="bg-[#0a2463] text-white hover:bg-[#0a2463]/90"
          >
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-20 pb-16 text-center md:pt-32 md:pb-24">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-4 rounded-full border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-1.5 text-sm font-medium text-[#0a2463]"
        >
          {seasonName} —{" "}
          {seasonState === "upcoming"
            ? "Coming Soon"
            : seasonState === "live"
              ? "Live Now"
              : "Ended"}
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="font-(family-name:--font-playfair) text-4xl leading-tight font-bold tracking-tight text-[#0a2463] md:text-6xl md:leading-tight"
        >
          Reading should be
          <br />
          <span className="text-[#e8c547]">rewarded.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-5 max-w-md text-base leading-relaxed text-[#1a1a2e]/70 md:text-lg"
        >
          A weekly essay competition. 10 rounds, {"\u20A6"}100,000 prize pool.
          Read carefully, answer questions, climb the leaderboard, and win.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-8 flex items-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="bg-[#0a2463] text-white hover:bg-[#0a2463]/90"
          >
            <Link href="/auth/sign-up">
              Join Season 1
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Season 1 Info Card with Countdown */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-[#0a2463] p-8 text-center text-white shadow-lg md:p-12"
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#e8c547]">
            {seasonName}
          </p>
          <h2 className="font-(family-name:--font-playfair) text-2xl font-bold md:text-3xl">
            {"\u20A6"}100,000 Prize Pool
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            10 weekly rounds. Read essays, take quizzes, and compete for the top
            of the leaderboard. Prizes distributed at end of season.
          </p>

          <div className="my-8">
            {seasonState === "upcoming" && (
              <>
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
                  Season starts in
                </p>
                <CountdownDisplay target={countdownTarget} />
              </>
            )}
            {seasonState === "live" && (
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-green-500" />
                </span>
                <span className="text-lg font-semibold text-green-400">
                  Live
                </span>
              </div>
            )}
            {seasonState === "ended" && (
              <p className="text-sm font-medium text-white/50">
                This season has ended. Stay tuned for the next one!
              </p>
            )}
          </div>

          <Button
            asChild
            size="lg"
            className="mt-2 bg-[#e8c547] text-[#0a2463] hover:bg-[#e8c547]/90"
          >
            <Link href="/auth/sign-up">
              Join Season 1
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="mb-12 text-center font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463] md:text-3xl"
        >
          How it works
        </motion.h2>

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 1}
              className="flex flex-col items-center rounded-2xl bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#0a2463]">
                <step.icon className="size-5 text-[#e8c547]" />
              </div>
              <h3 className="mb-1.5 font-(family-name:--font-playfair) text-lg font-semibold text-[#0a2463]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#1a1a2e]/60">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="mb-2 text-center font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463] md:text-3xl"
        >
          Leaderboard
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
          className="mb-8 text-center text-sm text-[#1a1a2e]/50"
        >
          Top players this season
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={2}
          className="mx-auto max-w-lg"
        >
          {dataLoading ? (
            <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-[#0a2463]/5 px-6 py-4 last:border-0"
                >
                  <div className="h-4 w-8 animate-pulse rounded-md bg-[#0a2463]/10" />
                  <div className="h-4 w-32 animate-pulse rounded-md bg-[#0a2463]/10" />
                  <div className="ml-auto h-4 w-14 animate-pulse rounded-md bg-[#0a2463]/10" />
                </div>
              ))}
            </div>
          ) : topPlayers.length === 0 ? (
            <div className="rounded-2xl bg-white/60 p-8 text-center shadow-sm backdrop-blur-sm">
              <Users className="mx-auto mb-3 size-8 text-[#0a2463]/20" />
              <p className="text-sm text-[#1a1a2e]/50">
                Leaderboard opens when {seasonName} begins.
              </p>
              <p className="mt-1 text-xs text-[#1a1a2e]/30">
                Sign up now to be ready for round one.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm">
              {topPlayers.map((player) => (
                <div
                  key={player.user_id}
                  className="flex items-center gap-3 border-b border-[#0a2463]/5 px-5 py-4 last:border-0"
                >
                  {player.rank <= 3 ? (
                    <span
                      className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                        player.rank === 1
                          ? "bg-[#e8c547] text-[#0a2463]"
                          : player.rank === 2
                            ? "bg-gray-300 text-gray-700"
                            : "bg-amber-700/80 text-white"
                      }`}
                    >
                      {player.rank}
                    </span>
                  ) : (
                    <span className="inline-flex size-8 items-center justify-center text-sm font-medium text-[#1a1a2e]/50">
                      {player.rank}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {player.full_name}
                  </span>
                  <span className="text-sm font-medium text-[#e8c547] tabular-nums">
                    {player.total_points} pts
                  </span>
                </div>
              ))}

              <Link
                href="/auth/sign-up"
                className="block border-t border-[#0a2463]/10 px-5 py-3 text-center text-sm font-medium text-[#0a2463] transition-colors hover:bg-[#0a2463]/5"
              >
                Sign up to compete
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      {/* The sponsor part can be modified later... We good to go bruv. Sharp instinct. Nice and easy. */}
      {/* Sponsors */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="mb-2 text-center font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463] md:text-3xl"
        >
          Our Sponsors
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
          className="mb-10 text-center text-sm text-[#1a1a2e]/50"
        >
          Partnering with organizations that value knowledge
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={2}
          className="mx-auto grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm"
            >
              <Handshake className="mb-2 size-8 text-[#0a2463]/20" />
              <span className="text-xs font-medium text-[#1a1a2e]/30">
                Sponsor
              </span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="mb-8 text-center font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463] md:text-3xl"
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
          className="mx-auto max-w-xl rounded-2xl bg-white/60 px-6 shadow-sm backdrop-blur-sm"
        >
          {faqItems.map((item) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0a2463]/10 px-6 py-8 text-center text-sm text-[#1a1a2e]/50">
        <span className="font-(family-name:--font-playfair) font-semibold text-[#0a2463]">
          TheCommonRoom
        </span>{" "}
        &copy; 2026. Reading is worth rewarding.
      </footer>
    </div>
  );
}
