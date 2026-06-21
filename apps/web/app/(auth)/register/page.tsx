"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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
    <Card className="border-white/10 bg-surface-elevated">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Start splitting trip expenses with your group</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required className="bg-surface border-white/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={form.username} onChange={(e) => update("username", e.target.value)} required className="bg-surface border-white/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className="bg-surface border-white/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required className="bg-surface border-white/10" />
            <p className="text-xs text-neutral-500">Min 8 chars, uppercase, lowercase, and number</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full gradient-brand border-0" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create account"}
          </Button>
          <p className="text-sm text-neutral-500 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-light hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
