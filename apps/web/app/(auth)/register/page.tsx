"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register(form);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-400">Start splitting expenses in under a minute</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "name", label: "Full name", placeholder: "Alice Cooper" },
          { key: "username", label: "Username", placeholder: "alice_cooper" },
          { key: "email", label: "Email", type: "email", placeholder: "you@email.com" },
          { key: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type={type ?? "text"}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
              className="bg-surface border-white/10 h-11"
            />
          </div>
        ))}
        <ul className="text-xs text-neutral-500 space-y-1">
          {["Free forever plan", "Unlimited settlements on free tier", "No credit card"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> {t}
            </li>
          ))}
        </ul>
        <Button type="submit" className="w-full h-11 gradient-brand border-0 shadow-lg shadow-brand/20" disabled={isLoading}>
          {isLoading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-light hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}
