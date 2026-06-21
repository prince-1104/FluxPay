"use client";

import Link from "next/link";
import { useRedirectIfAuth } from "@/hooks/use-auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useRedirectIfAuth();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-surface border-r border-white/10">
        <div className="glow-orb top-0 left-0 h-64 w-64 bg-brand/30" />
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white font-bold">S</div>
            <span className="text-2xl font-bold gradient-text">Settl</span>
          </Link>
          <blockquote className="mt-16">
            <p className="text-2xl font-medium leading-relaxed text-neutral-300">
              &ldquo;Finally stopped being the person who tracks every rupee on trips. Settl just works.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-neutral-500">— Travel group admin, Mumbai</footer>
          </blockquote>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { v: "10K+", l: "Trips split" },
            { v: "₹2Cr+", l: "Settled" },
            { v: "4.9★", l: "Rating" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xl font-bold text-brand-light">{s.v}</p>
              <p className="text-xs text-neutral-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-12">
        <Link href="/" className="lg:hidden mb-8 text-2xl font-bold gradient-text">Settl</Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
