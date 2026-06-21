"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { User, Bell, Shield, CreditCard, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { api, getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/users/me", { name, username });
      useAuthStore.setState({ user: data.data });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account, preferences, and billing." />

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                active === id
                  ? "bg-brand/15 text-brand-light"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 whitespace-nowrap mt-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>

        <div className="saas-card p-6 md:p-8">
          {active === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                <Avatar className="h-16 w-16 ring-2 ring-brand/30">
                  <AvatarImage src={user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-brand/20 text-brand-light text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{user?.name}</p>
                  <p className="text-sm text-neutral-500">@{user?.username}</p>
                  <Badge variant="outline" className="mt-2 border-brand/30 text-brand-light text-xs">
                    {user?.subscriptionTier ?? "FREE"} plan
                  </Badge>
                </div>
              </div>
              <form onSubmit={handleSave} className="space-y-5 max-w-md">
                <div className="space-y-2">
                  <Label className="text-neutral-400">Email</Label>
                  <Input value={user?.email ?? ""} disabled className="bg-surface/50 border-white/10 opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400">Display name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-surface/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400">Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-surface/50 border-white/10" />
                </div>
                <Button type="submit" className="gradient-brand border-0" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </div>
          )}

          {active === "notifications" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Notification preferences</h2>
              <p className="text-sm text-neutral-500">Choose what updates you receive about your trips.</p>
              <div className="space-y-3 mt-6">
                {[
                  { label: "New expenses added", desc: "When someone adds an expense to your trip" },
                  { label: "Settlement reminders", desc: "When you owe or are owed money" },
                  { label: "Trip invitations", desc: "When you're invited to join a trip" },
                ].map(({ label, desc }) => (
                  <label key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04]">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-brand" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {active === "security" && (
            <div className="space-y-6 max-w-md">
              <h2 className="font-semibold text-lg">Security</h2>
              <div className="space-y-2">
                <Label className="text-neutral-400">Current password</Label>
                <Input type="password" placeholder="••••••••" className="bg-surface/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400">New password</Label>
                <Input type="password" placeholder="••••••••" className="bg-surface/50 border-white/10" />
              </div>
              <Button variant="outline" className="border-white/10">Update password</Button>
            </div>
          )}

          {active === "billing" && (
            <div className="space-y-6">
              <h2 className="font-semibold text-lg">Billing</h2>
              <p className="text-sm text-neutral-500">
                You&apos;re on the <span className="text-brand-light font-medium">{user?.subscriptionTier ?? "FREE"}</span> plan.
              </p>
              <Link href="/pricing">
                <Button className="gradient-brand border-0">View plans & upgrade</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
