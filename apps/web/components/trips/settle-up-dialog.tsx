"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import type { TripWithMembers } from "@settl/types";
import { api, getApiError } from "@/lib/api";
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

type Props = {
  trip: TripWithMembers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initial?: { payerId: string; payeeId: string; amount: number };
};

function memberName(m: TripWithMembers["members"][number]) {
  return m.displayName ?? m.user?.name ?? "Member";
}

export function SettleUpDialog({ trip, open, onOpenChange, onSuccess, initial }: Props) {
  const [payerId, setPayerId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [markComplete, setMarkComplete] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPayerId(initial?.payerId ?? "");
    setPayeeId(initial?.payeeId ?? "");
    setAmount(initial?.amount ? String(initial.amount) : "");
    setMethod("UPI");
    setMarkComplete(true);
  }, [open, initial?.payerId, initial?.payeeId, initial?.amount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!payerId || !payeeId || amountNum <= 0) {
      toast.error("Fill in all fields");
      return;
    }
    if (payerId === payeeId) {
      toast.error("Payer and payee must be different");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/trips/${trip.id}/settlements`, {
        payerId,
        payeeId,
        amount: amountNum,
        method,
      });
      if (markComplete && data.data?.id) {
        await api.patch(`/trips/${trip.id}/settlements/${data.data.id}`, {
          status: "COMPLETED",
          method,
        });
      }
      toast.success(markComplete ? "Payment recorded & confirmed!" : "Settlement recorded");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  const memberMap = Object.fromEntries(
    trip.members.map((m) => [m.userId, memberName(m)])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settle up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Who is paying?</Label>
            <Select value={payerId || undefined} onValueChange={setPayerId}>
              <SelectTrigger className="bg-surface border-white/10">
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {trip.members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {memberName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Who receives?</Label>
            <Select value={payeeId || undefined} onValueChange={setPayeeId}>
              <SelectTrigger className="bg-surface border-white/10">
                <SelectValue placeholder="Select payee" />
              </SelectTrigger>
              <SelectContent>
                {trip.members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {memberName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount ({trip.currency})</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-surface border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="bg-surface border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["UPI", "Cash", "Bank transfer", "Other"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {payerId && payeeId && amount && (
            <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
              <span className="text-neutral-300">{memberMap[payerId]}</span>
              <span className="text-neutral-600 mx-2">pays</span>
              <span className="font-semibold text-brand-light">
                {formatCurrency(parseFloat(amount) || 0, trip.currency)}
              </span>
              <span className="text-neutral-600 mx-2">to</span>
              <span className="text-neutral-300">{memberMap[payeeId]}</span>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={markComplete}
              onChange={(e) => setMarkComplete(e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            Mark as completed immediately
          </label>

          <Button type="submit" className="w-full gradient-brand border-0" disabled={submitting}>
            {submitting ? "Recording…" : "Record payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
