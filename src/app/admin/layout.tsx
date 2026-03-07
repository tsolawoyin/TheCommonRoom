"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex min-h-svh items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-svh bg-[#f5f0e8]">
      <nav className="flex items-center gap-4 border-b border-[#0a2463]/10 px-6 py-4">
        <Link
          href="/dashboard"
          className="text-sm text-[#0a2463]/60 hover:text-[#0a2463]"
        >
          &larr; Dashboard
        </Link>
        <span className="font-(family-name:--font-playfair) text-lg font-bold text-[#0a2463]">
          Admin
        </span>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
