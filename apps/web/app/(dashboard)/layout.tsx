"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white font-bold text-lg animate-pulse">
        S
      </div>
      <p className="text-sm text-neutral-500">Loading your workspace…</p>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isInitialized, user } = useRequireAuth();

  if (!isInitialized || !user) {
    return <LoadingScreen />;
  }

  return <AppShell>{children}</AppShell>;
}
