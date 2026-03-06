"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Phone, CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { sanitizePhone } from "@/lib/phone";
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
  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "checking" | "valid" | "taken" | "invalid"
  >("idle");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const checkPhone = useCallback(async (value: string) => {
    const sanitized = sanitizePhone(value);
    if (!sanitized) {
      if (value.replace(/\D/g, "").length >= 7) {
        setPhoneStatus("invalid");
      } else {
        setPhoneStatus("idle");
      }
      return;
    }

    setPhoneStatus("checking");
    try {
      const res = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: value }),
      });
      const data = await res.json();
      setPhoneStatus(data.available ? "valid" : "taken");
    } catch {
      setPhoneStatus("idle");
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // Reset status while typing, debounce the check
    setPhoneStatus("idle");
    const stripped = value.replace(/\D/g, "");
    if (stripped.length >= 10) {
      // Enough digits to validate
      const timeout = setTimeout(() => checkPhone(value), 400);
      return () => clearTimeout(timeout);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const sanitized = sanitizePhone(phone);
    if (!sanitized) {
      setError("Please enter a valid Nigerian phone number.");
      setIsLoading(false);
      return;
    }

    if (phoneStatus === "taken") {
      setError(
        "This phone number is already registered. One account per person."
      );
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/protected`,
          data: {
            full_name: fullName,
            phone: sanitized,
          },
        },
      });
      if (error) throw error;
      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`);
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
          Sign up to start competing for cash prizes
        </p>
      </div>

      <form onSubmit={handleSignUp}>
        <div className="flex flex-col gap-4">
          {/* Full name */}
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
              Must match your bank account name — prizes are sent to verified
              names only.
            </p>
          </div>

          {/* Email */}
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

          {/* Phone */}
          <div className="grid gap-1.5">
            <Label htmlFor="phone" className="text-[#1a1a2e]">
              Phone number
            </Label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#1a1a2e]/30" />
              <Input
                id="phone"
                type="tel"
                placeholder="08012345678"
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={cn(
                  "border-[#0a2463]/15 bg-white pl-9 focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10",
                  phoneStatus === "valid" && "border-green-500",
                  (phoneStatus === "taken" || phoneStatus === "invalid") &&
                    "border-red-400"
                )}
              />
              {phoneStatus === "valid" && (
                <CheckCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-green-500" />
              )}
              {(phoneStatus === "taken" || phoneStatus === "invalid") && (
                <XCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-red-400" />
              )}
            </div>
            {phoneStatus === "taken" && (
              <p className="text-xs text-red-500">
                This phone number is already registered. One account per person.
              </p>
            )}
            {phoneStatus === "invalid" && (
              <p className="text-xs text-red-500">
                Enter a valid Nigerian phone number.
              </p>
            )}
            {phoneStatus !== "taken" && phoneStatus !== "invalid" && (
              <p className="text-xs text-[#e8c547]">
                Winners are contacted and verified by phone. Use a number you
                answer.
              </p>
            )}
          </div>

          {/* Password */}
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

          {/* Confirm password */}
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
            disabled={isLoading || phoneStatus === "taken" || phoneStatus === "invalid"}
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
