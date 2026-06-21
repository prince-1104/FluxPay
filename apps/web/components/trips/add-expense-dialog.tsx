"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveSplits, SplitValidationError } from "@settl/utils";
import { formatCurrency } from "@/lib/currency";
import type { SplitType, TripWithMembers } from "@settl/types";
import { api, getApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "ACCOMMODATION",
  "ACTIVITY",
  "SHOPPING",
  "UTILITIES",
  "OTHER",
] as const;

type SplitMode = "EQUAL" | "PERCENTAGE" | "EXACT";

type MemberRow = {
  userId: string;
  name: string;
  included: boolean;
  percentage: string;
  exactAmount: string;
};

type Props = {
  trip: TripWithMembers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function memberName(m: TripWithMembers["members"][number]) {
  return m.displayName ?? m.user?.name ?? "Member";
}

export function AddExpenseDialog({ trip, open, onOpenChange, onSuccess }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [category, setCategory] = useState<string>("OTHER");
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id ?? "");
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    if (!open) return;
    const rows = trip.members.map((m) => ({
      userId: m.userId,
      name: memberName(m),
      included: true,
      percentage: "",
      exactAmount: "",
    }));
    setMembers(rows);
    setPaidByUserId(currentUser?.id ?? trip.members[0]?.userId ?? "");
    setTitle("");
    setTotalAmount("");
    setCategory("OTHER");
    setSplitMode("EQUAL");
  }, [open, trip.id, currentUser?.id]);

  useEffect(() => {
    if (splitMode !== "PERCENTAGE") return;
    setMembers((prev) => {
      const included = prev.filter((m) => m.included);
      if (included.length === 0) return prev;
      const share = (100 / included.length).toFixed(2);
      const needsUpdate = included.some((m) => !m.percentage);
      if (!needsUpdate) return prev;
      return prev.map((m) =>
        m.included && !m.percentage ? { ...m, percentage: share } : m
      );
    });
  }, [splitMode]);

  const amountNum = parseFloat(totalAmount) || 0;

  const preview = useMemo(() => {
    if (amountNum <= 0) return null;
    try {
      const splits = buildSplits(members, splitMode);
      return resolveSplits(amountNum, splits);
    } catch {
      return null;
    }
  }, [amountNum, members, splitMode]);

  const previewError = useMemo(() => {
    if (amountNum <= 0) return null;
    try {
      buildSplits(members, splitMode);
      resolveSplits(amountNum, buildSplits(members, splitMode));
      return null;
    } catch (e) {
      return e instanceof SplitValidationError ? e.message : "Invalid split";
    }
  }, [amountNum, members, splitMode]);

  function toggleMember(userId: string) {
    setMembers((prev) => {
      const next = prev.map((m) =>
        m.userId === userId ? { ...m, included: !m.included } : m
      );
      if (splitMode !== "PERCENTAGE") return next;
      const included = next.filter((m) => m.included);
      if (included.length === 0) return next;
      const share = (100 / included.length).toFixed(2);
      return next.map((m) => (m.included ? { ...m, percentage: share } : m));
    });
  }

  function updateMember(userId: string, field: "percentage" | "exactAmount", value: string) {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amountNum <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const splits = buildSplits(members, splitMode);
      resolveSplits(amountNum, splits);
      await api.post(`/trips/${trip.id}/expenses`, {
        title,
        totalAmount: amountNum,
        category,
        paidByUserId,
        splits,
      });
      toast.success("Expense added!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error instanceof SplitValidationError) {
        toast.error(error.message);
      } else {
        toast.error(getApiError(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>What was it for?</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-surface border-white/10"
              placeholder="Dinner at beach shack"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount ({trip.currency})</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="bg-surface border-white/10 text-lg font-semibold"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-surface border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select
              value={paidByUserId || undefined}
              onValueChange={setPaidByUserId}
            >
              <SelectTrigger className="bg-surface border-white/10">
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {trip.members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.user?.name ?? m.displayName ?? "Member"}
                    {m.role === "OWNER" ? " (Owner)" : m.role === "ADMIN" ? " (Admin)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Split between</Label>
            <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as SplitMode)}>
              <TabsList className="glass h-auto p-1 w-full">
                <TabsTrigger value="EQUAL" className="flex-1 data-[state=active]:bg-brand/20">
                  Equally
                </TabsTrigger>
                <TabsTrigger value="PERCENTAGE" className="flex-1 data-[state=active]:bg-brand/20">
                  By %
                </TabsTrigger>
                <TabsTrigger value="EXACT" className="flex-1 data-[state=active]:bg-brand/20">
                  Exact
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2",
                    !m.included && "opacity-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={m.included}
                    onChange={() => toggleMember(m.userId)}
                    className="h-4 w-4 rounded accent-brand shrink-0"
                  />
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-brand/15 text-brand-light text-xs">
                      {m.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm truncate">{m.name}</span>

                  {splitMode === "PERCENTAGE" && m.included && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={m.percentage}
                        onChange={(e) => updateMember(m.userId, "percentage", e.target.value)}
                        className="w-16 h-8 bg-surface border-white/10 text-right text-sm"
                      />
                      <span className="text-xs text-neutral-500">%</span>
                    </div>
                  )}

                  {splitMode === "EXACT" && m.included && (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={m.exactAmount}
                      onChange={(e) => updateMember(m.userId, "exactAmount", e.target.value)}
                      className="w-24 h-8 bg-surface border-white/10 text-right text-sm shrink-0"
                      placeholder="0.00"
                    />
                  )}

                  {splitMode === "EQUAL" && m.included && preview && (
                    <span className="text-sm font-medium text-emerald-400 shrink-0">
                      {formatCurrency(
                        preview.find((p) => p.userId === m.userId)?.amount ?? 0,
                        trip.currency
                      )}
                    </span>
                  )}

                  {(splitMode === "PERCENTAGE" || splitMode === "EXACT") &&
                    m.included &&
                    preview && (
                      <span className="text-xs text-neutral-500 shrink-0 w-16 text-right">
                        {formatCurrency(
                          preview.find((p) => p.userId === m.userId)?.amount ?? 0,
                          trip.currency
                        )}
                      </span>
                    )}
                </div>
              ))}
            </div>

            {previewError && (
              <p className="text-xs text-red-400">{previewError}</p>
            )}
            {preview && !previewError && amountNum > 0 && (
              <p className="text-xs text-neutral-500">
                Total split:{" "}
                <span className="text-emerald-400 font-medium">
                  {formatCurrency(
                    preview.reduce((s, p) => s + p.amount, 0),
                    trip.currency
                  )}
                </span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-brand border-0"
            disabled={submitting || !!previewError || amountNum <= 0}
          >
            {submitting ? "Adding…" : "Add expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildSplits(
  members: MemberRow[],
  mode: SplitMode
): Array<{ userId: string; splitType: SplitType; amount?: number; percentage?: number }> {
  const result: Array<{
    userId: string;
    splitType: SplitType;
    amount?: number;
    percentage?: number;
  }> = [];

  for (const m of members) {
    if (!m.included) {
      result.push({ userId: m.userId, splitType: "EXCLUDE" });
      continue;
    }
    if (mode === "EQUAL") {
      result.push({ userId: m.userId, splitType: "EQUAL" });
    } else if (mode === "PERCENTAGE") {
      result.push({
        userId: m.userId,
        splitType: "PERCENTAGE",
        percentage: parseFloat(m.percentage) || 0,
      });
    } else {
      result.push({
        userId: m.userId,
        splitType: "EXACT",
        amount: parseFloat(m.exactAmount) || 0,
      });
    }
  }
  return result;
}
