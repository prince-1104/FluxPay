"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Receipt,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "./marketing-header";
import { MarketingFooter } from "./marketing-footer";
import { MobileAppDownloadButton } from "./mobile-app-download-button";
import { DashboardPreview3D } from "./dashboard-preview-3d";

const features = [
  {
    icon: Receipt,
    title: "Smart expense splits",
    desc: "Equal, percentage, exact, or custom splits — resolved automatically with paise-perfect accuracy.",
  },
  {
    icon: Zap,
    title: "One-tap settlements",
    desc: "Minimized payment suggestions so groups settle up in the fewest transactions possible.",
  },
  {
    icon: BarChart3,
    title: "Live trip analytics",
    desc: "Budget tracking, spending breakdowns, and balance sheets updated in real time.",
  },
  {
    icon: Users,
    title: "Invite & collaborate",
    desc: "Share invite codes, manage members, and keep everyone on the same page.",
  },
  {
    icon: Shield,
    title: "Enterprise-grade security",
    desc: "JWT auth, encrypted sessions, and subscription-tier access controls built in.",
  },
  {
    icon: Sparkles,
    title: "Pro features",
    desc: "Receipt OCR, CSV exports, multi-currency, and AI-powered settlement suggestions.",
  },
];

const plans = [
  { name: "Free", price: "₹0", desc: "2 trips · 1 Pro trip included", highlight: false },
  { name: "Pro", price: "₹29", desc: "10 trips · OCR & exports", highlight: true },
  { name: "Premium", price: "₹299", desc: "Unlimited · AI settle", highlight: false },
];

export function LandingPage() {
  return (
    <>
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-16 md:px-8 md:pt-24">
        <div className="glow-orb -top-32 left-1/4 h-96 w-96 bg-brand/30" />
        <div className="glow-orb top-20 right-1/4 h-64 w-64 bg-gold/20" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand-light">
              <Sparkles className="h-3.5 w-3.5" />
              First trip free with Pro features
            </span>
            <h1 className="mt-8 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
              Split trip costs{" "}
              <span className="gradient-text">fairly</span>, settle{" "}
              <span className="gradient-text">fast</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 md:text-xl">
              Settl helps friend groups and travel teams track shared expenses, calculate who owes what, and settle up — without the spreadsheet chaos.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href="/register" className="w-full sm:w-auto sm:shrink-0">
                <Button
                  size="lg"
                  className="group h-12 w-full rounded-full border-0 px-10 text-base font-semibold shadow-xl shadow-brand/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-brand/45 gradient-brand sm:w-auto"
                >
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto sm:shrink-0">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-full border border-white/20 bg-white/5 px-10 text-base font-medium backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:border-white/35 hover:bg-white/10 sm:w-auto"
                >
                  View demo
                </Button>
              </Link>
              <MobileAppDownloadButton size="lg" className="w-full sm:w-auto sm:shrink-0" />
            </div>
            <p className="mt-4 text-xs text-neutral-600">
              No credit card required · Free plan forever · First trip unlocks Pro features
            </p>
          </motion.div>

          <DashboardPreview3D />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Everything you need to split smart</h2>
            <p className="mt-4 text-neutral-400 max-w-xl mx-auto">
              From weekend getaways to month-long adventures — Settl handles the math so you can focus on the memories.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="saas-card-hover p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="border-t border-white/10 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-neutral-400">
              Start free — your first trip includes Pro features at no cost.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`saas-card p-6 ${plan.highlight ? "border-brand/40 ring-1 ring-brand/20 scale-[1.02]" : ""}`}
              >
                {plan.highlight && (
                  <span className="text-xs font-medium text-brand-light mb-2 block">Most popular</span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-neutral-500">/mo</span>
                </p>
                <p className="mt-2 text-sm text-neutral-400">{plan.desc}</p>
                {plan.name === "Free" && (
                  <p className="mt-3 rounded-lg border border-brand/25 bg-brand/10 px-3 py-2 text-xs text-brand-light">
                    Custom splits, OCR & exports on your first trip
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/pricing">
              <Button variant="outline" className="border-white/15">
                Compare all plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-3xl text-center glass-card p-12">
          <h2 className="text-3xl font-bold">Ready to settle up?</h2>
          <p className="mt-4 text-neutral-400">
            Join thousands of groups who never argue about money on trips again.
          </p>
          <Link href="/register" className="inline-block mt-8">
            <Button size="lg" className="gradient-brand border-0 px-10 shadow-xl shadow-brand/30">
              Create your first trip
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
