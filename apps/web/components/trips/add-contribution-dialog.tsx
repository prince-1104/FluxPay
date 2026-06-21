"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@settl/utils";
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
};

function memberName(m: TripWithMembers["members"][number]) {
  return m.displayName ?? m.user?.name ?? "Member";
}

export function AddContributionDialog({ trip, open, onOpenChange, onSuccess }: Props) {
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setToUserId(trip.members[0]?.userId ?? "");
    setAmount("");
    setNote("");
  }, [open, trip.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!toUserId || amountNum <= 0) {
      toast.error("Enter a valid amount and recipient");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/trips/${trip.id}/contributions`, {
        toUserId,
        amount: amountNum,
        note: note || undefined,
      });
      toast.success("Contribution added!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add money</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500 -mt-2">
          Record upfront cash given to a member for the trip pool.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Given to</Label>
            <Select value={toUserId || undefined} onValueChange={setToUserId}>
              <SelectTrigger className="bg-surface border-white/10">
                <SelectValue placeholder="Select member" />
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
            <Label>Amount ({trip.currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-surface border-white/10 text-lg font-semibold"
              placeholder="5000.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-surface border-white/10"
              placeholder="Trip advance for bookings"
            />
          </div>

          {toUserId && amount && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-neutral-300">
              Adding{" "}
              <span className="font-semibold text-emerald-400">
                {formatCurrency(parseFloat(amount) || 0, trip.currency)}
              </span>{" "}
              for {memberName(trip.members.find((m) => m.userId === toUserId)!)}
            </div>
          )}

          <Button type="submit" className="w-full gradient-brand border-0" disabled={submitting}>
            {submitting ? "Adding…" : "Add money"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
