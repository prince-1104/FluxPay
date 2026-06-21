"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Copy,
  Download,
  Plus,
  RefreshCw,
  Users,
  Wallet,
  Target,
  Utensils,
  Car,
  Home,
  Gamepad2,
  ShoppingBag,
  Zap,
  MoreHorizontal,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@settl/utils";
import type { ExpenseWithSplits, TripWithMembers } from "@settl/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";

const categoryIcons: Record<string, typeof Utensils> = {
  FOOD: Utensils,
  TRANSPORT: Car,
  ACCOMMODATION: Home,
  ACTIVITY: Gamepad2,
  SHOPPING: ShoppingBag,
  UTILITIES: Zap,
  OTHER: MoreHorizontal,
};

const statusStyle: Record<string, string> = {
  ACTIVE: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  PLANNING: "border-brand/30 text-brand-light bg-brand/10",
  SETTLING: "border-gold/30 text-gold bg-gold/10",
};

type BalancesData = {
  balances: Array<{ userId: string; name: string; net: number; totalPaid: number; totalOwed: number }>;
  suggestions: Array<{ payerId: string; payeeId: string; amount: number }>;
};

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const queryClient = useQueryClient();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: "", totalAmount: "", category: "OTHER" });
  const [submitting, setSubmitting] = useState(false);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const { data } = await api.get(`/trips/${tripId}`);
      return data.data as TripWithMembers;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const { data } = await api.get(`/trips/${tripId}/expenses`);
      return data.data as ExpenseWithSplits[];
    },
    enabled: !!tripId,
  });

  const { data: balancesData, refetch: refetchBalances } = useQuery({
    queryKey: ["balances", tripId],
    queryFn: async () => {
      const { data } = await api.get(`/trips/${tripId}/balances`);
      return data.data as BalancesData;
    },
    enabled: !!tripId,
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ["settlements", tripId],
    queryFn: async () => {
      const { data } = await api.get(`/trips/${tripId}/settlements`);
      return data.data;
    },
    enabled: !!tripId,
  });

  async function copyInviteCode() {
    if (!trip?.inviteCode) return;
    await navigator.clipboard.writeText(trip.inviteCode);
    toast.success("Invite code copied!");
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    setSubmitting(true);
    try {
      const memberIds = trip.members.map((m) => m.userId);
      await api.post(`/trips/${tripId}/expenses`, {
        title: expenseForm.title,
        totalAmount: parseFloat(expenseForm.totalAmount),
        category: expenseForm.category,
        splits: memberIds.map((userId) => ({ userId, splitType: "EQUAL" })),
      });
      toast.success("Expense added!");
      setExpenseOpen(false);
      setExpenseForm({ title: "", totalAmount: "", category: "OTHER" });
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      queryClient.invalidateQueries({ queryKey: ["balances", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function exportCsv() {
    try {
      const response = await api.get(`/premium/export/${tripId}/csv`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `trip-${trip?.name ?? tripId}.csv`;
      link.click();
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  if (isLoading || !trip) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const memberMap = Object.fromEntries(trip.members.map((m) => [m.userId, m.user?.name ?? m.displayName ?? "Member"]));
  const budgetUsed = trip.budget ? Math.min(100, ((trip.expenseTotal ?? 0) / trip.budget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand/20 via-surface-elevated to-surface p-6 md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold md:text-3xl">{trip.name}</h1>
              <Badge variant="outline" className={statusStyle[trip.status] ?? statusStyle.PLANNING}>
                {trip.status}
              </Badge>
            </div>
            {trip.description && <p className="mt-2 text-neutral-400 max-w-lg">{trip.description}</p>}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <div className="flex -space-x-2">
                {trip.members.slice(0, 5).map((m) => (
                  <Avatar key={m.id} className="h-8 w-8 border-2 border-surface-elevated">
                    <AvatarFallback className="bg-brand/20 text-brand-light text-xs">
                      {(m.displayName ?? m.user?.name ?? "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-neutral-500">{trip.memberCount} members</span>
              <button
                onClick={copyInviteCode}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-neutral-300 hover:bg-white/10 transition-colors"
              >
                {trip.inviteCode}
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <Button variant="outline" className="border-white/10 bg-white/5" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-brand border-0 shadow-lg shadow-brand/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Add expense
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/10 sm:max-w-md">
                <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} className="bg-surface border-white/10" placeholder="Dinner at beach shack" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ({trip.currency})</Label>
                    <Input type="number" step="0.01" value={expenseForm.totalAmount} onChange={(e) => setExpenseForm({ ...expenseForm, totalAmount: e.target.value })} className="bg-surface border-white/10" placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                      <SelectTrigger className="bg-surface border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(categoryIcons).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full gradient-brand border-0" disabled={submitting}>
                    {submitting ? "Adding…" : "Add expense"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {trip.budget && (
          <div className="relative mt-6">
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>Budget used</span>
              <span>{budgetUsed.toFixed(0)}% of {formatCurrency(trip.budget, trip.currency)}</span>
            </div>
            <Progress value={budgetUsed} className="h-2 bg-white/5" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total spent" value={formatCurrency(trip.expenseTotal ?? 0, trip.currency)} icon={Wallet} valueClassName="text-emerald-400" />
        <StatCard label="Members" value={trip.memberCount ?? 0} icon={Users} />
        <StatCard label="Budget" value={trip.budget ? formatCurrency(trip.budget, trip.currency) : "—"} icon={Target} />
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="glass h-auto p-1 flex-wrap">
          <TabsTrigger value="expenses" className="data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="balances" className="data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light">
            Balances
          </TabsTrigger>
          <TabsTrigger value="settlements" className="data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light">
            Settlements
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light">
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Add your first expense to start splitting costs with the group."
              action={{ label: "Add expense", onClick: () => setExpenseOpen(true) }}
            />
          ) : (
            <div className="space-y-2">
              {expenses.map((expense, i) => {
                const CatIcon = categoryIcons[expense.category] ?? MoreHorizontal;
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="saas-card flex items-center gap-4 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-light">
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{expense.title}</p>
                      <p className="text-xs text-neutral-500">
                        Paid by {expense.paidBy?.name} · {expense.category}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-400 shrink-0">
                      {formatCurrency(expense.totalAmount, trip.currency)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances">
          <div className="flex justify-end mb-3">
            <Button variant="ghost" size="sm" onClick={() => refetchBalances()} className="text-neutral-400">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {balancesData?.balances.map((b) => (
              <div key={b.userId} className="saas-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{b.name}</span>
                  <span className={`text-sm font-semibold ${b.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {b.net >= 0 ? "+" : ""}{formatCurrency(b.net, trip.currency)}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-neutral-500">
                  <span>Paid {formatCurrency(b.totalPaid, trip.currency)}</span>
                  <span>Owes {formatCurrency(b.totalOwed, trip.currency)}</span>
                </div>
              </div>
            ))}
          </div>
          {balancesData?.suggestions && balancesData.suggestions.length > 0 && (
            <div className="mt-6 glass-card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-brand-light" />
                Suggested settlements
              </h3>
              <div className="space-y-2">
                {balancesData.suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3 text-sm">
                    <span>
                      <span className="text-neutral-300">{memberMap[s.payerId]}</span>
                      <span className="text-neutral-600 mx-2">→</span>
                      <span className="text-neutral-300">{memberMap[s.payeeId]}</span>
                    </span>
                    <span className="font-semibold text-brand-light">{formatCurrency(s.amount, trip.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settlements">
          {settlements.length === 0 ? (
            <EmptyState icon={Wallet} title="No settlements" description="Record payments when members settle up." />
          ) : (
            <div className="space-y-2">
              {settlements.map((s: { id: string; payer: { name: string }; payee: { name: string }; amount: number; status: string }) => (
                <div key={s.id} className="saas-card flex items-center justify-between p-4">
                  <span className="text-sm">
                    {s.payer.name} <span className="text-neutral-600">→</span> {s.payee.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(s.amount, trip.currency)}</span>
                    <Badge variant="outline" className={s.status === "COMPLETED" ? "border-emerald-500/30 text-emerald-400" : ""}>
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members">
          <div className="grid gap-3 sm:grid-cols-2">
            {trip.members.map((m) => (
              <div key={m.id} className="saas-card flex items-center gap-4 p-4">
                <Avatar className="h-11 w-11 ring-2 ring-brand/10">
                  <AvatarFallback className="bg-brand/15 text-brand-light">
                    {(m.displayName ?? m.user?.name ?? "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{m.displayName ?? m.user?.name}</p>
                  <p className="text-xs text-neutral-500">@{m.user?.username}</p>
                </div>
                <Badge variant="outline" className="border-brand/20 text-brand-light">{m.role}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
