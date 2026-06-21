"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Map,
  Plus,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuthStore } from "@/stores/auth-store";
import type { TripWithMembers } from "@settl/types";

const CHART_COLORS = ["#7C3AED", "#A78BFA", "#F59E0B", "#10B981", "#EF4444"];

const statusColors: Record<string, string> = {
  ACTIVE: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  PLANNING: "border-brand/30 text-brand-light bg-brand/10",
  SETTLING: "border-gold/30 text-gold bg-gold/10",
  SETTLED: "border-neutral-500/30 text-neutral-400 bg-neutral-500/10",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await api.get("/users/subscription");
      return data.data as { plan: { tier: string }; proTrialAvailable?: boolean };
    },
  });

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data } = await api.get("/trips");
      return data.data as TripWithMembers[];
    },
  });

  const totalSpent = trips.reduce((sum, t) => sum + (t.expenseTotal ?? 0), 0);
  const activeTrips = trips.filter((t) => t.status === "ACTIVE").length;
  const totalMembers = trips.reduce((sum, t) => sum + (t.memberCount ?? 0), 0);

  const chartData = trips.slice(0, 6).map((t) => ({
    name: t.name.length > 12 ? t.name.slice(0, 12) + "…" : t.name,
    spent: t.expenseTotal ?? 0,
    budget: t.budget ?? 0,
  }));

  const pieData = trips
    .filter((t) => (t.expenseTotal ?? 0) > 0)
    .map((t) => ({ name: t.name, value: t.expenseTotal ?? 0 }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={`Hi, ${user?.name?.split(" ")[0] ?? "there"} 👋`}
        description="Here's what's happening across your trips."
      >
        <Link href="/trips">
          <Button className="gradient-brand border-0 shadow-lg shadow-brand/20">
            <Plus className="h-4 w-4 mr-2" />
            New trip
          </Button>
        </Link>
      </PageHeader>

      {subscription?.proTrialAvailable && (
        <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/10 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-light" />
          <div>
            <p className="text-sm font-medium text-brand-light">Your first trip unlocks Pro features free</p>
            <p className="mt-1 text-xs text-neutral-400">
              Custom splits, receipt OCR, and CSV exports — included on your first trip at no cost.
            </p>
            <Link href="/trips" className="mt-2 inline-block text-xs font-medium text-brand-light hover:underline">
              Create your Pro trial trip →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total spent" value={formatCurrency(totalSpent)} icon={Wallet} valueClassName="text-emerald-400" />
        <StatCard label="Active trips" value={activeTrips} icon={Map} trend={`${trips.length} total`} />
        <StatCard label="Group members" value={totalMembers} icon={Users} />
        <StatCard label="Avg per trip" value={formatCurrency(trips.length ? totalSpent / trips.length : 0)} icon={TrendingUp} valueClassName="text-brand-light" />
      </div>

      {trips.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-light" />
              Spending by trip
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="spent" stroke="#7C3AED" fill="url(#spentGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="font-semibold mb-4">Expense breakdown</h3>
            {pieData.length > 0 ? (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-20 text-center">Add expenses to see breakdown</p>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your trips</h2>
          <Link href="/trips" className="text-sm text-brand-light hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="saas-card h-36 animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Map}
            title="No trips yet"
            description="Create your first group trip and start splitting expenses with friends."
            action={{ label: "Create trip", onClick: () => { window.location.href = "/trips"; } }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trips.slice(0, 6).map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/trips/${trip.id}`}>
                  <div className="saas-card-hover p-5 h-full group">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-brand-light transition-colors">{trip.name}</h3>
                      <Badge variant="outline" className={statusColors[trip.status] ?? statusColors.PLANNING}>
                        {trip.status}
                      </Badge>
                    </div>
                    {trip.description && (
                      <p className="mt-1 text-sm text-neutral-500 line-clamp-1">{trip.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {trip.memberCount ?? 0}
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(trip.expenseTotal ?? 0, trip.currency)}
                      </span>
                    </div>
                    {trip.budget && (
                      <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-brand transition-all"
                          style={{ width: `${Math.min(100, ((trip.expenseTotal ?? 0) / trip.budget) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
