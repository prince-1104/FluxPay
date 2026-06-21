"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Map,
  Bell,
  Settings,
  Crown,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/pricing", label: "Billing", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    trips: "Trips",
    notifications: "Notifications",
    pricing: "Billing",
    settings: "Settings",
  };
  return segments.map((s, i) => ({
    label: labels[s] ?? (s.length > 20 ? "Trip details" : s),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumb();
  const { user, logout } = useAuthStore();

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await api.get("/users/subscription");
      return data.data as { plan: { tier: string } };
    },
  });

  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/unread-count");
      return data.data as { count: number };
    },
    refetchInterval: 30000,
  });

  const tier = subscription?.plan?.tier ?? "FREE";

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-col border-r border-white/10 bg-surface/80 backdrop-blur-xl">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-sm font-bold text-white shadow-lg shadow-brand/20">
              S
            </div>
            <div>
              <span className="text-lg font-bold gradient-text">Settl</span>
              <Badge variant="outline" className="ml-2 border-brand/30 text-[10px] text-brand-light px-1.5 py-0">
                {tier}
              </Badge>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand/15 text-brand-light shadow-inner shadow-brand/5"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (unread?.count ?? 0) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                    {unread!.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {tier === "FREE" && (
          <div className="mx-3 mb-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <div className="flex items-center gap-2 text-brand-light text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </div>
            <p className="mt-1 text-xs text-neutral-500">Unlock OCR, exports & custom splits</p>
            <Link href="/pricing">
              <Button size="sm" className="mt-3 w-full gradient-brand border-0 text-xs h-8">
                View plans
              </Button>
            </Link>
          </div>
        )}

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <Avatar className="h-10 w-10 ring-2 ring-brand/20">
              <AvatarFallback className="bg-brand/20 text-brand-light font-semibold">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">@{user?.username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-neutral-500 hover:text-white"
            onClick={() => logout().then(() => { window.location.href = "/"; })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-surface/60 backdrop-blur-xl px-4 md:px-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 min-w-0">
            <Link href="/dashboard" className="lg:hidden font-bold text-brand-light shrink-0">Settl</Link>
            <nav className="hidden sm:flex items-center gap-1 truncate">
              {breadcrumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1 shrink-0">
                  {crumb.href !== breadcrumbs[0]?.href && (
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
                  )}
                  {crumb.isLast ? (
                    <span className="text-white font-medium truncate">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-white truncate">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white">
              <Bell className="h-5 w-5" />
              {(unread?.count ?? 0) > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />
              )}
            </Link>
            <Link href="/settings" className="lg:hidden">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-brand/20 text-brand-light text-xs">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
