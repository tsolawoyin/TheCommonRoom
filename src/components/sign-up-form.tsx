"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/protected`,
          data: {
            full_name: fullName,
            phone,
          },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-center">
        <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-[#1a1a2e]/60">
          Sign up to start competing
        </p>
      </div>

      <form onSubmit={handleSignUp}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="full-name" className="text-[#1a1a2e]">
              Full name
            </Label>
            <Input
              id="full-name"
              type="text"
              placeholder="Your full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border-[#0a2463]/15 bg-white focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10"
            />
            <p className="text-xs text-[#1a1a2e]/40">
              Must match your bank account name for prize verification.
            </p>
          </div>

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

          <div className="grid gap-1.5">
            <Label htmlFor="phone" className="text-[#1a1a2e]">
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08012345678"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-[#0a2463]/15 bg-white focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-[#1a1a2e]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-[#0a2463]/15 bg-white focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password" className="text-[#1a1a2e]">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-[#1a1a2e]/60">
          Already have an account?{" "}
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
