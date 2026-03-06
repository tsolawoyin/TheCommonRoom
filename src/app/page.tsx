"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, Trophy, Clock, ArrowRight } from "lucide-react";
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
    description: "A new long-form essay drops every two weeks on a topic that matters.",
  },
  {
    icon: Clock,
    title: "Take the Quiz",
    description: "20 minutes. Multiple choice. The closer you read, the higher you score.",
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description: "Top the leaderboard and take home cash. Every round, every time.",
  },
];

export default function LandingPage() {
  const { user, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return <div className="min-h-svh bg-[#f5f0e8]" />;
  }

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
          Season 1 is live
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
          A biweekly essay competition. Read carefully, answer questions, climb
          the leaderboard, and win cash prizes.
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
              Join the competition
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

      {/* Active Round Teaser */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-[#0a2463] p-8 text-center text-white shadow-lg md:p-12"
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#e8c547]">
            Current Round
          </p>
          <h2 className="font-(family-name:--font-playfair) text-2xl font-bold md:text-3xl">
            Round 3 is open
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            A new essay is waiting. Read it, take the quiz, and prove you belong
            on the leaderboard.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-[#e8c547] text-[#0a2463] hover:bg-[#e8c547]/90"
          >
            <Link href="/auth/sign-up">
              Enter now
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
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
