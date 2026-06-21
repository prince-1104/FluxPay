"use client";

import Link from "next/link";
import { useRedirectIfAuth } from "@/hooks/use-auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useRedirectIfAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <Link href="/" className="mb-8 text-3xl font-bold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
        Settl
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
