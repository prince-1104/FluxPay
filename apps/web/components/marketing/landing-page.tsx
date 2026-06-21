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
  { name: "Free", price: "₹0", desc: "2 trips · 5 members", highlight: false },
  { name: "Pro", price: "₹299", desc: "10 trips · OCR & exports", highlight: true },
  { name: "Premium", price: "₹599", desc: "Unlimited · AI settle", highlight: false },
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
              Premium group expense splitting
            </span>
            <h1 className="mt-8 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
              Split trip costs{" "}
              <span className="gradient-text">fairly</span>, settle{" "}
              <span className="gradient-text">fast</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 md:text-xl">
              Settl helps friend groups and travel teams track shared expenses, calculate who owes what, and settle up — without the spreadsheet chaos.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/register">
                <Button size="lg" className="gradient-brand border-0 px-8 text-base shadow-xl shadow-brand/30">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/15 bg-white/5 px-8 text-base hover:bg-white/10">
                  View demo
                </Button>
              </Link>
              <MobileAppDownloadButton size="lg" />
            </div>
            <p className="mt-4 text-xs text-neutral-600">No credit card required · Free plan forever</p>
          </motion.div>

          {/* Dashboard preview mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="glass-card overflow-hidden p-1 animate-float">
              <div className="rounded-xl bg-surface p-6 text-left">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-gold/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Total spent", value: "₹12,450", color: "text-emerald-400" },
                    { label: "Active trips", value: "3", color: "text-brand-light" },
                    { label: "Pending settlements", value: "₹2,100", color: "text-gold" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-neutral-500">{s.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-32 rounded-lg border border-white/10 bg-gradient-to-r from-brand/10 via-transparent to-gold/10" />
              </div>
            </div>
          </motion.div>
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
            <p className="mt-4 text-neutral-400">Start free. Upgrade when your group grows.</p>
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
