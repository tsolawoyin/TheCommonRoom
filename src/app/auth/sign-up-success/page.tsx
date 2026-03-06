import Link from "next/link";
import { Mail } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f5f0e8] px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-[#0a2463]">
          <Mail className="size-6 text-[#e8c547]" />
        </div>
        <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Check your email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1a1a2e]/60">
          We&apos;ve sent a confirmation link to your email address. Click it to
          activate your account and start competing.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm font-medium text-[#0a2463] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
