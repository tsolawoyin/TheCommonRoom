"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Phone,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sanitizePhone } from "@/lib/phone";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function ProfilePage() {
  const { user, authLoading, supabase, refreshUser } = useApp();

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "checking" | "valid" | "taken" | "invalid" | "unchanged"
  >("unchanged");
  const phoneTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Initialize form with user data
  if (user && !initialized) {
    setFullName(user.full_name);
    setPhone(user.phone);
    setInitialized(true);
  }

  const checkPhone = useCallback(
    async (value: string) => {
      const sanitized = sanitizePhone(value);
      if (!sanitized) {
        if (value.replace(/\D/g, "").length >= 7) {
          setPhoneStatus("invalid");
        } else {
          setPhoneStatus("idle");
        }
        return;
      }

      // If the sanitized phone matches the current one, no need to check
      if (user && sanitized === user.phone) {
        setPhoneStatus("unchanged");
        return;
      }

      setPhoneStatus("checking");
      try {
        const { data, error } = await supabase.rpc("check_phone_available", {
          p_phone: sanitized,
        });
        if (error) {
          setPhoneStatus("idle");
          return;
        }
        setPhoneStatus(data ? "valid" : "taken");
      } catch {
        setPhoneStatus("idle");
      }
    },
    [supabase, user]
  );

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setPhoneStatus("idle");
    setProfileSuccess(false);
    if (phoneTimeoutRef.current) {
      clearTimeout(phoneTimeoutRef.current);
    }
    const stripped = value.replace(/\D/g, "");
    if (stripped.length >= 10) {
      phoneTimeoutRef.current = setTimeout(() => checkPhone(value), 400);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    const sanitized = sanitizePhone(phone);
    if (!sanitized) {
      setProfileError("Please enter a valid Nigerian phone number.");
      setProfileLoading(false);
      return;
    }

    if (phoneStatus === "taken") {
      setProfileError(
        "This phone number is already registered. One account per person."
      );
      setProfileLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          phone: sanitized,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshUser();
      setPhoneStatus("unchanged");
      setProfileSuccess(true);
    } catch (error: unknown) {
      setProfileError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (error: unknown) {
      setPasswordError(
        error instanceof Error ? error.message : "Failed to update password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-svh bg-[#f5f0e8]">
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <div className="h-7 w-40 animate-pulse rounded-md bg-[#0a2463]/10" />
        </nav>
        <main className="mx-auto max-w-lg px-6 pb-24">
          <div className="mt-8 space-y-6">
            <div className="h-8 w-32 animate-pulse rounded-md bg-[#0a2463]/10" />
            <div className="space-y-4 rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-[#0a2463]/10" />
                  <div className="h-9 w-full animate-pulse rounded-md bg-[#0a2463]/10" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const profileChanged =
    fullName.trim() !== user.full_name ||
    phoneStatus === "valid";

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
          <span className="hidden text-sm text-[#1a1a2e]/60 md:block">
            {user.full_name}
          </span>
          <LogoutButton />
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-lg px-6 pb-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex items-center gap-3 pt-8 pb-6 md:pt-12"
        >
          <Link
            href="/dashboard"
            className="flex size-8 items-center justify-center rounded-lg text-[#0a2463]/40 transition-colors hover:bg-[#0a2463]/5 hover:text-[#0a2463]"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="font-(family-name:--font-playfair) text-2xl font-bold tracking-tight text-[#0a2463] md:text-3xl">
            Profile
          </h1>
        </motion.div>

        {/* User summary */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mb-6 flex items-center gap-4 rounded-2xl bg-[#0a2463] p-5 text-white shadow-sm"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
            <User className="size-6 text-[#e8c547]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-(family-name:--font-playfair) text-lg font-bold">
              {user.full_name}
            </p>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Mail className="size-3" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {memberSince}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Profile form */}
        <motion.form
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          onSubmit={handleProfileSave}
          className="space-y-4 rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm"
        >
          <h2 className="font-(family-name:--font-playfair) text-lg font-semibold text-[#0a2463]">
            Personal Information
          </h2>

          <div className="grid gap-1.5">
            <Label htmlFor="full-name" className="text-[#1a1a2e]">
              Full name
            </Label>
            <Input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setProfileSuccess(false);
              }}
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
              value={user.email}
              disabled
              className="border-[#0a2463]/15 bg-[#0a2463]/5"
            />
            <p className="text-xs text-[#1a1a2e]/40">
              Email cannot be changed.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="phone" className="text-[#1a1a2e]">
              Phone number
            </Label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#1a1a2e]/30" />
              <Input
                id="phone"
                type="tel"
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
                This phone number is already registered.
              </p>
            )}
            {phoneStatus === "invalid" && (
              <p className="text-xs text-red-500">
                Enter a valid Nigerian phone number.
              </p>
            )}
          </div>

          {profileError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {profileError}
            </p>
          )}

          {profileSuccess && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
              Profile updated successfully.
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#0a2463] text-white hover:bg-[#0a2463]/90"
            disabled={
              profileLoading ||
              !profileChanged ||
              phoneStatus === "taken" ||
              phoneStatus === "invalid" ||
              phoneStatus === "checking"
            }
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </Button>
        </motion.form>

        {/* Password form */}
        <motion.form
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          onSubmit={handlePasswordChange}
          className="mt-6 space-y-4 rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm"
        >
          <h2 className="font-(family-name:--font-playfair) text-lg font-semibold text-[#0a2463]">
            Change Password
          </h2>

          <div className="grid gap-1.5">
            <Label htmlFor="new-password" className="text-[#1a1a2e]">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordSuccess(false);
              }}
              className="border-[#0a2463]/15 bg-white focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password" className="text-[#1a1a2e]">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordSuccess(false);
              }}
              className="border-[#0a2463]/15 bg-white focus-visible:border-[#0a2463] focus-visible:ring-[#0a2463]/10"
            />
          </div>

          {passwordError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
              Password updated successfully.
            </p>
          )}

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={passwordLoading || !newPassword || !confirmPassword}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </Button>
        </motion.form>

        {user.role === "admin" && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-6"
          >
            <Link
              href="/admin/rounds/new"
              className="flex items-center gap-3 rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/80"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#0a2463]">
                <Shield className="size-4 text-[#e8c547]" />
              </div>
              <div className="flex-1">
                <p className="font-(family-name:--font-playfair) text-sm font-semibold text-[#0a2463]">
                  Admin Panel
                </p>
                <p className="text-xs text-[#1a1a2e]/50">
                  Create rounds and manage content
                </p>
              </div>
              <ChevronRight className="size-4 text-[#0a2463]/30" />
            </Link>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
