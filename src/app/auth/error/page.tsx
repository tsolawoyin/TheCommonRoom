"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f5f0e8] px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-red-100">
          <AlertTriangle className="size-6 text-red-600" />
        </div>
        <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1a1a2e]/60">
          {error || "An unspecified error occurred."}
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

export default function Page() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
