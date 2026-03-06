import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh bg-[#f5f0e8]">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden flex-1 flex-col justify-between bg-[#0a2463] p-10 lg:flex">
        <Link
          href="/"
          className="font-(family-name:--font-playfair) text-xl font-bold text-white"
        >
          TheCommonRoom
        </Link>
        <div>
          <p className="font-(family-name:--font-playfair) text-3xl leading-snug font-bold text-white">
            Reading should be
            <br />
            <span className="text-[#e8c547]">rewarded.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            Join a biweekly essay competition. Read carefully, score higher, and
            win cash prizes.
          </p>
        </div>
        <p className="text-xs text-white/40">
          &copy; 2026 TheCommonRoom. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-8 font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463] lg:hidden"
        >
          TheCommonRoom
        </Link>
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
