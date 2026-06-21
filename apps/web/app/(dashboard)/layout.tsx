"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isInitialized, user } = useRequireAuth();

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-pulse text-brand-light">Loading...</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
