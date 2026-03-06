"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/essays", label: "Essays", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#0a2463]/10 bg-[#f5f0e8]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "text-[#0a2463]"
                  : "text-[#1a1a2e]/40 hover:text-[#1a1a2e]/70"
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  active && "text-[#e8c547]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
