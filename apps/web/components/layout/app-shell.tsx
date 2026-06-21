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
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileAppDownloadIcon } from "@/components/shared/mobile-app-download-icon";
import { MOBILE_APK_FILENAME, MOBILE_APK_URL } from "@/lib/mobile-app";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/pricing", label: "Billing", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  trips: "Trips",
  friends: "Friends",
  notifications: "Notifications",
  pricing: "Billing",
  settings: "Settings",
};

function usePageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "dashboard";
  if (first === "trips" && segments.length > 1) return "Trip details";
  return pageTitles[first] ?? "Settl";
}

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    trips: "Trips",
    friends: "Friends",
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
  const pageTitle = usePageTitle();
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
  const unreadCount = unread?.count ?? 0;
  const hasTripFab = /^\/trips\/[^/]+$/.test(pathname);

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-transparent">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-col border-r border-white/10 bg-surface/80 backdrop-blur-xl shrink-0">
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
                {badge && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
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
            <p className="mt-1 text-xs text-neutral-500">
              Your first trip includes Pro features free
            </p>
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

      {/* Main column — min-h-0 lets the inner main scroll on mobile */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-surface/80 backdrop-blur-xl px-4 md:px-6 pt-safe">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link href="/dashboard" className="lg:hidden font-bold text-brand-light shrink-0 text-lg">
              S
            </Link>
            <div className="min-w-0">
              <h1 className="lg:hidden text-sm font-semibold text-white truncate">{pageTitle}</h1>
              <nav className="hidden lg:flex items-center gap-1 text-sm text-neutral-500 truncate">
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
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={MOBILE_APK_URL}
              download={MOBILE_APK_FILENAME}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl p-2 text-neutral-400 transition-colors hover:bg-brand/10 touch-manipulation"
              aria-label="Download Android app"
              title="Download Android app"
            >
              <MobileAppDownloadIcon />
            </a>
            <Link
              href="/notifications"
              className="relative rounded-xl p-2.5 text-neutral-400 hover:bg-white/5 hover:text-white touch-manipulation lg:hidden"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand" />
              )}
            </Link>
            <Link href="/settings" className="lg:hidden touch-manipulation">
              <Avatar className="h-9 w-9 ring-2 ring-brand/10">
                <AvatarFallback className="bg-brand/20 text-brand-light text-xs">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="app-scroll-main min-h-0 flex-1">
          <div
            className={cn(
              "mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8 lg:pb-8",
              hasTripFab ? "pb-mobile-nav-fab" : "pb-mobile-nav"
            )}
          >
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav unreadCount={unreadCount} />
    </div>
  );
}
