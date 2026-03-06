"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("text-center", className)} {...props}>
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-[#0a2463]">
          <Mail className="size-6 text-[#e8c547]" />
        </div>
        <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Check your email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1a1a2e]/60">
          If an account exists for{" "}
          <span className="font-medium text-[#0a2463]">{email}</span>, we've
          sent password reset instructions.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm font-medium text-[#0a2463] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-center">
        <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-[#1a1a2e]/60">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleForgotPassword}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-[#1a1a2e]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-[#0a2463]/15 bg-white focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#0a2463] text-white hover:bg-[#0a2463]/90"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-[#1a1a2e]/60">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[#0a2463] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
