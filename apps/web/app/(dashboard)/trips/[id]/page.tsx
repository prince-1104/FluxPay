"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Plus, RefreshCw } from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@settl/utils";
import type { ExpenseWithSplits, TripWithMembers } from "@settl/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    return <div className="animate-pulse text-neutral-500">Loading trip...</div>;
  }

  const memberMap = Object.fromEntries(trip.members.map((m) => [m.userId, m.user?.name ?? m.displayName ?? "Member"]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{trip.name}</h1>
            <Badge variant="outline" className="border-brand/30 text-brand-light">{trip.status}</Badge>
          </div>
          {trip.description && <p className="text-neutral-400">{trip.description}</p>}
          <div className="flex items-center gap-2 mt-3">
            <code className="text-sm bg-surface px-2 py-1 rounded border border-white/10">{trip.inviteCode}</code>
            <Button size="sm" variant="ghost" onClick={copyInviteCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="border-white/10" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brand border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface-elevated border-white/10">
              <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} className="bg-surface border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" value={expenseForm.totalAmount} onChange={(e) => setExpenseForm({ ...expenseForm, totalAmount: e.target.value })} className="bg-surface border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                    <SelectTrigger className="bg-surface border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["FOOD", "TRANSPORT", "ACCOMMODATION", "ACTIVITY", "SHOPPING", "UTILITIES", "OTHER"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gradient-brand border-0" disabled={submitting}>Add</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-surface-elevated">
          <CardHeader><CardTitle className="text-sm text-neutral-400">Total Spent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-400">{formatCurrency(trip.expenseTotal ?? 0, trip.currency)}</p></CardContent>
        </Card>
        <Card className="border-white/10 bg-surface-elevated">
          <CardHeader><CardTitle className="text-sm text-neutral-400">Members</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{trip.memberCount}</p></CardContent>
        </Card>
        <Card className="border-white/10 bg-surface-elevated">
          <CardHeader><CardTitle className="text-sm text-neutral-400">Budget</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{trip.budget ? formatCurrency(trip.budget, trip.currency) : "—"}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="bg-surface border border-white/10">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4 space-y-3">
          {expenses.length === 0 ? (
            <p className="text-neutral-500">No expenses yet</p>
          ) : expenses.map((expense) => (
            <Card key={expense.id} className="border-white/10 bg-surface-elevated">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{expense.title}</p>
                  <p className="text-sm text-neutral-500">Paid by {expense.paidBy?.name} · {expense.category}</p>
                </div>
                <p className="font-semibold text-emerald-400">{formatCurrency(expense.totalAmount, trip.currency)}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="balances" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => refetchBalances()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
          {balancesData?.balances.map((b) => (
            <Card key={b.userId} className="border-white/10 bg-surface-elevated">
              <CardContent className="p-4 flex justify-between items-center">
                <span>{b.name}</span>
                <span className={b.net >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {b.net >= 0 ? "gets back " : "owes "}{formatCurrency(Math.abs(b.net), trip.currency)}
                </span>
              </CardContent>
            </Card>
          ))}
          {balancesData?.suggestions && balancesData.suggestions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Suggested Settlements</h3>
              {balancesData.suggestions.map((s, i) => (
                <Card key={i} className="border-white/10 bg-surface-elevated mb-2">
                  <CardContent className="p-4 text-sm">
                    {memberMap[s.payerId] ?? s.payerId} pays {memberMap[s.payeeId] ?? s.payeeId}{" "}
                    <span className="text-brand-light font-medium">{formatCurrency(s.amount, trip.currency)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settlements" className="mt-4 space-y-3">
          {settlements.length === 0 ? (
            <p className="text-neutral-500">No settlements recorded</p>
          ) : settlements.map((s: { id: string; payer: { name: string }; payee: { name: string }; amount: number; status: string }) => (
            <Card key={s.id} className="border-white/10 bg-surface-elevated">
              <CardContent className="p-4 flex justify-between items-center">
                <span className="text-sm">{s.payer.name} → {s.payee.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(s.amount, trip.currency)}</span>
                  <Badge variant="outline">{s.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-3">
          {trip.members.map((m) => (
            <Card key={m.id} className="border-white/10 bg-surface-elevated">
              <CardContent className="p-4 flex justify-between items-center">
                <span>{m.displayName ?? m.user?.name}</span>
                <Badge variant="outline">{m.role}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
