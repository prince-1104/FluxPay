"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10 pt-safe">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-sm font-bold text-white">
            S
          </div>
          <span className="text-lg sm:text-xl font-bold gradient-text">Settl</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" className="text-neutral-300">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="gradient-brand border-0 text-white shadow-lg shadow-brand/25">
                Get started free
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button className="gradient-brand border-0">Open dashboard</Button>
            </Link>
          </Show>
        </div>

        <button
          type="button"
          className="md:hidden rounded-xl p-2.5 text-neutral-300 hover:bg-white/5 touch-manipulation"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-white/10 bg-surface/95 backdrop-blur-xl transition-all duration-200",
          open ? "max-h-80 pb-safe" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          <a href="#features" className="rounded-xl px-4 py-3 text-sm text-neutral-300 hover:bg-white/5" onClick={() => setOpen(false)}>
            Features
          </a>
          <a href="#pricing" className="rounded-xl px-4 py-3 text-sm text-neutral-300 hover:bg-white/5" onClick={() => setOpen(false)}>
            Pricing
          </a>
          <Link href="/login" className="rounded-xl px-4 py-3 text-sm text-neutral-300 hover:bg-white/5" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link href="/register" className="mt-2" onClick={() => setOpen(false)}>
            <Button className="w-full gradient-brand border-0 h-11">Get started free</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
