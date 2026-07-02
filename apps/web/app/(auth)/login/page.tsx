"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileAppDownloadButton } from "@/components/marketing/mobile-app-download-button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState("alice@settl.com");
  const [password, setPassword] = useState("Password123!");

  useEffect(() => {
    if (searchParams.get("reason") === "session-expired") {
      toast.message("Session expired. Please sign in again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-400">Sign in to manage your trips and settlements</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-surface border-white/10 h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-surface border-white/10 h-11" />
        </div>
        <Button type="submit" className="w-full h-11 gradient-brand border-0 shadow-lg shadow-brand/20" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        No account?{" "}
        <Link href="/register" className="text-brand-light hover:underline font-medium">Create one free</Link>
      </p>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-neutral-500">or</span>
        </div>
      </div>

      <MobileAppDownloadButton fullWidth size="lg" />
      <p className="text-center text-xs text-neutral-600">Download the FluxPay Android app</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-neutral-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
