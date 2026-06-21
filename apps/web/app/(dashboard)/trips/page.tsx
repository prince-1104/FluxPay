"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Link2, Map, Search, Users, Sparkles } from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { TripWithMembers } from "@settl/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

const statusStyle: Record<string, string> = {
  ACTIVE: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  PLANNING: "border-brand/30 text-brand-light bg-brand/10",
  SETTLING: "border-gold/30 text-gold bg-gold/10",
};

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newTrip, setNewTrip] = useState({ name: "", description: "", budget: "" });
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data } = await api.get("/trips");
      return data.data as TripWithMembers[];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await api.get("/users/subscription");
      return data.data as {
        plan: { tier: string };
        proTrialAvailable?: boolean;
        proTrialTripId?: string | null;
      };
    },
  });

  const isFreeTier = subscription?.plan?.tier === "FREE";
  const showProTrialBanner = isFreeTier && (subscription?.proTrialAvailable || trips.some((t) => t.isProTrial));

  const filtered = trips.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/trips", {
        name: newTrip.name,
        description: newTrip.description || undefined,
        budget: newTrip.budget ? parseFloat(newTrip.budget) : undefined,
      });
      toast.success("Trip created!");
      setCreateOpen(false);
      setNewTrip({ name: "", description: "", budget: "" });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/trips/join", { inviteCode });
      toast.success("Joined trip!");
      setJoinOpen(false);
      setInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Trips" description="Manage group expense trips and invite friends.">
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-white/10 bg-white/5">
              <Link2 className="h-4 w-4 mr-2" />
              Join
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader><DialogTitle>Join with invite code</DialogTitle></DialogHeader>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label>Invite code</Label>
                <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="bg-surface border-white/10 font-mono" required />
              </div>
              <Button type="submit" className="w-full gradient-brand border-0" disabled={creating}>Join trip</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand border-0 shadow-lg shadow-brand/20">
              <Plus className="h-4 w-4 mr-2" />
              New trip
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader><DialogTitle>Create a trip</DialogTitle></DialogHeader>
            {subscription?.proTrialAvailable && (
              <div className="flex items-start gap-2 rounded-lg border border-brand/25 bg-brand/10 px-3 py-2.5 text-xs text-brand-light">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Your first trip acts as <strong className="font-semibold">Pro</strong> — custom splits, OCR & exports included.
                </span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Trip name</Label>
                <Input value={newTrip.name} onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })} className="bg-surface border-white/10" placeholder="Goa Road Trip" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newTrip.description} onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })} className="bg-surface border-white/10" placeholder="Weekend getaway" />
              </div>
              <div className="space-y-2">
                <Label>Budget (optional)</Label>
                <Input type="number" value={newTrip.budget} onChange={(e) => setNewTrip({ ...newTrip, budget: e.target.value })} className="bg-surface border-white/10" placeholder="15000" />
              </div>
              <Button type="submit" className="w-full gradient-brand border-0" disabled={creating}>Create trip</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {showProTrialBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/10 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-light" />
          <div>
            <p className="text-sm font-medium text-brand-light">
              {subscription?.proTrialAvailable
                ? "Your first trip unlocks Pro features free"
                : "You have a Pro trial trip"}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {subscription?.proTrialAvailable
                ? "Create a trip to get custom splits, receipt OCR, and CSV exports at no extra cost."
                : "One of your trips includes Pro features — custom splits, OCR & exports."}
            </p>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trips…"
          className="pl-10 bg-surface/50 border-white/10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Map}
          title={search ? "No trips found" : "No trips yet"}
          description={search ? "Try a different search term." : "Create a trip or join one with an invite code."}
          action={!search ? { label: "Create trip", onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/trips/${trip.id}`}>
                <div className="saas-card-hover p-5 h-full group">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg group-hover:text-brand-light transition-colors">{trip.name}</h3>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {trip.isProTrial && (
                        <Badge variant="outline" className="border-brand/30 text-brand-light bg-brand/10 text-[10px]">
                          Pro trial
                        </Badge>
                      )}
                      <Badge variant="outline" className={statusStyle[trip.status] ?? statusStyle.PLANNING}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>
                  {trip.description && (
                    <p className="mt-1.5 text-sm text-neutral-500 line-clamp-2">{trip.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {trip.memberCount} members
                    </span>
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(trip.expenseTotal ?? 0, trip.currency)}
                    </span>
                  </div>
                  {trip.budget && (
                    <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-brand"
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
  );
}
