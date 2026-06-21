"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bell,
  Settings,
  Crown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/pricing", label: "Pricing", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-surface p-4">
        <Link href="/dashboard" className="mb-8 px-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
            Settl
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith(href)
                  ? "bg-brand/20 text-brand-light"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-brand/30 text-brand-light">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">@{user?.username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-neutral-400 hover:text-white"
            onClick={() => logout().then(() => { window.location.href = "/login"; })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="md:hidden flex items-center justify-between border-b border-white/10 p-4 bg-surface">
          <Link href="/dashboard" className="text-xl font-bold text-brand-light">Settl</Link>
        </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
