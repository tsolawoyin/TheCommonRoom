import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f5f0e8] px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center font-(family-name:--font-playfair) text-xl font-bold text-[#0a2463]"
        >
          TheCommonRoom
        </Link>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
