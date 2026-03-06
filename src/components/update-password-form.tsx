"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-[#0a2463]">
          <Lock className="size-6 text-[#e8c547]" />
        </div>
        <h1 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-[#1a1a2e]/60">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleUpdatePassword}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-[#1a1a2e]">
              New password
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
              Confirm new password
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
            {isLoading ? "Saving..." : "Save new password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
