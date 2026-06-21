"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Map, matchPrefix: true },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/notifications", label: "Alerts", icon: Bell, badge: true },
];

type MobileBottomNavProps = {
  unreadCount?: number;
};

export function MobileBottomNav({ unreadCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-white/10 bg-surface/95 backdrop-blur-xl pb-safe"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {items.map(({ href, label, icon: Icon, matchPrefix, badge }) => {
          const active =
            pathname === href ||
            (matchPrefix && pathname.startsWith(href) && href !== "/dashboard");
          const showBadge = badge && unreadCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors touch-manipulation",
                active ? "text-brand-light" : "text-neutral-500 active:text-neutral-300"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-brand/20" : "bg-transparent"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                {showBadge && (
                  <span className="absolute top-1.5 right-[calc(50%-1.25rem)] flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
