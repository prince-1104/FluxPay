"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  Banknote,
  HandCoins,
  ChevronDown,
  Check,
  Trash2,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { ExpenseWithSplits, TripWithMembers, SettlementWithUsers } from "@settl/types";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PremiumCtaButton } from "@/components/shared/premium-cta-button";
import { Progress } from "@/components/ui/progress";
import { AddExpenseDialog } from "@/components/trips/add-expense-dialog";
import { SettleUpDialog } from "@/components/trips/settle-up-dialog";
import { AddContributionDialog } from "@/components/trips/add-contribution-dialog";
import { AddMemberDialog } from "@/components/trips/add-member-dialog";
import { RemoveMemberDialog, canRemoveMember } from "@/components/trips/remove-member-dialog";
import { MobileExpenseWidget } from "@/components/trips/mobile-expense-widget";
import { cn } from "@/lib/utils";

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
  balances: Array<{
    userId: string;
    name: string;
    net: number;
    totalPaid: number;
    totalOwed: number;
    preContribution?: number;
  }>;
  suggestions: Array<{ payerId: string; payeeId: string; amount: number }>;
};

function memberName(m: TripWithMembers["members"][number]) {
  return m.displayName ?? m.user?.name ?? "Member";
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<TripWithMembers["members"][number] | null>(null);
  const [settleInitial, setSettleInitial] = useState<
    { payerId: string; payeeId: string; amount: number } | undefined
  >();
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("expenses");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
    queryClient.invalidateQueries({ queryKey: ["balances", tripId] });
    queryClient.invalidateQueries({ queryKey: ["settlements", tripId] });
  };

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
      return data.data as SettlementWithUsers[];
    },
    enabled: !!tripId,
  });

  async function copyInviteCode() {
    if (!trip?.inviteCode) return;
    await navigator.clipboard.writeText(trip.inviteCode);
    toast.success("Invite code copied!");
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

  async function deleteExpense(expenseId: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      toast.success("Expense deleted");
      invalidateAll();
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function confirmSettlement(settlementId: string) {
    try {
      await api.patch(`/trips/${tripId}/settlements/${settlementId}`, { status: "COMPLETED" });
      toast.success("Settlement confirmed!");
      invalidateAll();
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  function openSettleFromSuggestion(s: { payerId: string; payeeId: string; amount: number }) {
    setSettleInitial(s);
    setSettleOpen(true);
  }

  if (isLoading || !trip) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const memberMap = Object.fromEntries(trip.members.map((m) => [m.userId, memberName(m)]));
  const isTripAdmin = trip.members.some(
    (m) => m.userId === currentUser?.id && (m.role === "OWNER" || m.role === "ADMIN")
  );
  const currentMemberRole = trip.members.find((m) => m.userId === currentUser?.id)?.role;
  const budgetUsed = trip.budget ? Math.min(100, ((trip.expenseTotal ?? 0) / trip.budget) * 100) : 0;
  const pendingSettlements = settlements.filter((s) => s.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand/20 via-surface-elevated to-surface p-4 sm:p-6 md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold md:text-3xl">{trip.name}</h1>
              {trip.isProTrial && (
                <Badge variant="outline" className="border-brand/30 text-brand-light bg-brand/10">
                  Pro trial
                </Badge>
              )}
              <Badge variant="outline" className={statusStyle[trip.status] ?? statusStyle.PLANNING}>
                {trip.status}
              </Badge>
            </div>
            {trip.description && (
              <p className="mt-2 text-neutral-400 max-w-lg">{trip.description}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex -space-x-2">
                {trip.members.slice(0, 5).map((m) => (
                  <Avatar key={m.id} className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-surface-elevated">
                    <AvatarFallback className="bg-brand/20 text-brand-light text-xs">
                      {memberName(m).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-neutral-500">{trip.memberCount} members</span>
              <button
                onClick={copyInviteCode}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] sm:text-xs font-mono text-neutral-300 hover:bg-white/10 transition-colors truncate"
              >
                <span className="truncate">{trip.inviteCode}</span>
                <Copy className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Actions — grid on mobile, row on desktop */}
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap lg:items-center lg:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 h-10 touch-manipulation"
              onClick={() => setContributionOpen(true)}
              aria-label="Add money"
            >
              <Banknote className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline sm:ml-1.5 truncate">Add money</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 h-10 touch-manipulation"
              onClick={() => {
                setSettleInitial(undefined);
                setSettleOpen(true);
              }}
              aria-label="Settle up"
            >
              <HandCoins className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline sm:ml-1.5 truncate">Settle up</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 h-10 touch-manipulation"
              onClick={exportCsv}
              aria-label="Export CSV"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline sm:ml-1.5 truncate">Export</span>
            </Button>
            <div className="hidden lg:block w-px h-8 bg-white/10 mx-0.5" aria-hidden />
            <div className="hidden lg:contents">
              <PremiumCtaButton
                size="lg"
                onClick={() => setExpenseOpen(true)}
                icon={<Plus className="h-4 w-4" strokeWidth={2.5} />}
              >
                Add expense
              </PremiumCtaButton>
            </div>
          </div>
        </div>

        {trip.budget && (
          <div className="relative mt-6">
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>Budget used</span>
              <span>
                {budgetUsed.toFixed(0)}% of {formatCurrency(trip.budget, trip.currency)}
              </span>
            </div>
            <Progress value={budgetUsed} className="h-2 bg-white/5" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Total spent"
          value={formatCurrency(trip.expenseTotal ?? 0, trip.currency)}
          icon={Wallet}
          valueClassName="text-emerald-400"
        />
        <StatCard label="Members" value={trip.memberCount ?? 0} icon={Users} />
        <StatCard
          label="Budget"
          value={trip.budget ? formatCurrency(trip.budget, trip.currency) : "—"}
          icon={Target}
        />
      </div>

      {pendingSettlements.length > 0 && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 px-3 py-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <p className="text-sm text-gold">
            {pendingSettlements.length} pending settlement
            {pendingSettlements.length !== 1 ? "s" : ""} awaiting confirmation
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-gold/30 text-gold shrink-0"
            onClick={() => setActiveTab("settlements")}
          >
            Review
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass h-auto p-1 w-full flex flex-nowrap overflow-x-auto scroll-tabs justify-start">
          <TabsTrigger
            value="expenses"
            className="shrink-0 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light text-xs sm:text-sm px-3"
          >
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger
            value="balances"
            className="shrink-0 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light text-xs sm:text-sm px-3"
          >
            Balances
          </TabsTrigger>
          <TabsTrigger
            value="settlements"
            className="shrink-0 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light text-xs sm:text-sm px-3"
          >
            Settlements ({settlements.length})
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="shrink-0 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light text-xs sm:text-sm px-3"
          >
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Add your first expense to start splitting costs with the group."
              action={{ label: "Add expense", onClick: () => setExpenseOpen(true), premium: true }}
            />
          ) : (
            <div className="space-y-2">
              {expenses.map((expense, i) => {
                const CatIcon = categoryIcons[expense.category] ?? MoreHorizontal;
                const isExpanded = expandedExpense === expense.id;
                const canDelete =
                  expense.paidBy?.id === currentUser?.id ||
                  trip.members.some(
                    (m) =>
                      m.userId === currentUser?.id &&
                      (m.role === "OWNER" || m.role === "ADMIN")
                  );

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="saas-card overflow-hidden"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                      onClick={() =>
                        setExpandedExpense(isExpanded ? null : expense.id)
                      }
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-light">
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{expense.title}</p>
                        <p className="text-xs text-neutral-500">
                          Paid by {expense.paidBy?.name} · {expense.category} ·{" "}
                          {expense.splits.filter((s) => s.splitType !== "EXCLUDE").length}{" "}
                          people
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-400 shrink-0">
                        {formatCurrency(expense.totalAmount, trip.currency)}
                      </p>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-neutral-500 shrink-0 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <div className="px-4 pb-4 pt-3">
                            <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
                              Split breakdown
                            </p>
                            <div className="space-y-1.5">
                              {expense.splits
                                .filter((s) => s.splitType !== "EXCLUDE" && s.amount > 0)
                                .map((s) => (
                                  <div
                                    key={s.id}
                                    className="flex items-center justify-between text-sm rounded-lg bg-white/[0.02] px-3 py-2"
                                  >
                                    <span className="text-neutral-300">
                                      {memberMap[s.userId] ?? "Member"}
                                    </span>
                                    <span className="text-neutral-400">
                                      {formatCurrency(s.amount, trip.currency)}
                                      {s.splitType === "PERCENTAGE" && s.percentage != null && (
                                        <span className="text-neutral-600 ml-1">
                                          ({s.percentage}%)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => deleteExpense(expense.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete expense
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances">
          <div className="flex justify-end mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchBalances()}
              className="text-neutral-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>

          {balancesData?.balances.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No balances yet"
              description="Add expenses to see who owes whom."
              action={{ label: "Add expense", onClick: () => setExpenseOpen(true), premium: true }}
            />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {balancesData?.balances.map((b) => (
                  <div key={b.userId} className="saas-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-brand/15 text-brand-light text-sm">
                            {b.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{b.name}</span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          b.net >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {b.net >= 0 ? "+" : ""}
                        {formatCurrency(b.net, trip.currency)}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-neutral-500 pl-12">
                      <span>Paid {formatCurrency(b.totalPaid, trip.currency)}</span>
                      <span>Owes {formatCurrency(b.totalOwed, trip.currency)}</span>
                      {(b.preContribution ?? 0) > 0 && (
                        <span className="text-emerald-500">
                          +{formatCurrency(b.preContribution ?? 0, trip.currency)} advance
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {balancesData?.suggestions && balancesData.suggestions.length > 0 && (
                <div className="mt-6 glass-card p-5">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-brand-light" />
                    Suggested settlements
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    Minimum transfers to settle all balances
                  </p>
                  <div className="space-y-2">
                    {balancesData.suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white/[0.03] px-3 py-3 sm:px-4 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="text-neutral-300">{memberMap[s.payerId]}</span>
                          <span className="text-neutral-600 mx-2">→</span>
                          <span className="text-neutral-300">{memberMap[s.payeeId]}</span>
                        </span>
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="font-semibold text-brand-light">
                            {formatCurrency(s.amount, trip.currency)}
                          </span>
                          <Button
                            size="sm"
                            className="gradient-brand border-0 h-9 touch-manipulation"
                            onClick={() => openSettleFromSuggestion(s)}
                          >
                            Settle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="settlements">
          <div className="flex justify-end mb-3">
            <Button
              className="gradient-brand border-0"
              size="sm"
              onClick={() => {
                setSettleInitial(undefined);
                setSettleOpen(true);
              }}
            >
              <HandCoins className="h-4 w-4 mr-2" />
              Record payment
            </Button>
          </div>

          {settlements.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No settlements yet"
              description="Record payments when members settle up with each other."
              action={{
                label: "Settle up",
                onClick: () => {
                  setSettleInitial(undefined);
                  setSettleOpen(true);
                },
              }}
            />
          ) : (
            <div className="space-y-2">
              {settlements.map((s) => (
                <div key={s.id} className="saas-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                      <HandCoins className="h-4 w-4 text-brand-light" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        <span className="text-neutral-300">{s.payer.name}</span>
                        <span className="text-neutral-600 mx-1.5">→</span>
                        <span className="text-neutral-300">{s.payee.name}</span>
                      </p>
                      {s.method && (
                        <p className="text-xs text-neutral-500 mt-0.5">via {s.method}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-12 sm:pl-0">
                    <span className="font-semibold">
                      {formatCurrency(s.amount, trip.currency)}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        s.status === "COMPLETED"
                          ? "border-emerald-500/30 text-emerald-400"
                          : s.status === "PENDING"
                            ? "border-gold/30 text-gold"
                            : ""
                      }
                    >
                      {s.status}
                    </Badge>
                    {s.status === "PENDING" &&
                      (s.payerId === currentUser?.id ||
                        s.payeeId === currentUser?.id ||
                        trip.members.some(
                          (m) =>
                            m.userId === currentUser?.id &&
                            (m.role === "OWNER" || m.role === "ADMIN")
                        )) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 h-8"
                          onClick={() => confirmSettlement(s.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members">
          {isTripAdmin && (
            <div className="flex justify-end mb-3">
              <Button
                className="gradient-brand border-0"
                size="sm"
                onClick={() => setMemberOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add member
              </Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {trip.members.map((m) => {
              const balance = balancesData?.balances.find((b) => b.userId === m.userId);
              const showRemove = canRemoveMember(m, currentMemberRole);
              return (
                <div key={m.id} className="saas-card flex items-center gap-4 p-4">
                  <Avatar className="h-11 w-11 ring-2 ring-brand/10">
                    <AvatarFallback className="bg-brand/15 text-brand-light">
                      {memberName(m).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{memberName(m)}</p>
                    <p className="text-xs text-neutral-500">@{m.user?.username}</p>
                    {balance && (
                      <p
                        className={cn(
                          "text-xs mt-1 font-medium",
                          balance.net >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {balance.net >= 0 ? "Gets back" : "Owes"}{" "}
                        {formatCurrency(Math.abs(balance.net), trip.currency)}
                      </p>
                    )}
                    {(m.preContribution ?? 0) > 0 && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Advance: {formatCurrency(m.preContribution, trip.currency)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {showRemove && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                        aria-label={`Remove ${memberName(m)}`}
                        onClick={() => setRemoveMember(m)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                    <Badge variant="outline" className="border-brand/20 text-brand-light">
                      {m.role}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <AddExpenseDialog
        trip={trip}
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSuccess={invalidateAll}
      />
      <SettleUpDialog
        trip={trip}
        open={settleOpen}
        onOpenChange={setSettleOpen}
        onSuccess={invalidateAll}
        initial={settleInitial}
      />
      <AddContributionDialog
        trip={trip}
        open={contributionOpen}
        onOpenChange={setContributionOpen}
        onSuccess={invalidateAll}
      />
      <AddMemberDialog
        trip={trip}
        open={memberOpen}
        onOpenChange={setMemberOpen}
        onSuccess={invalidateAll}
      />
      <RemoveMemberDialog
        trip={trip}
        member={removeMember}
        open={!!removeMember}
        onOpenChange={(open) => !open && setRemoveMember(null)}
        onSuccess={invalidateAll}
      />

      <MobileExpenseWidget
        onClick={() => setExpenseOpen(true)}
        expenseCount={expenses.length}
      />
    </div>
  );
}
