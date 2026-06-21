"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Link2 } from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@settl/utils";
import type { TripWithMembers } from "@settl/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trips</h1>
          <p className="text-neutral-400">Create or join group expense trips</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10">
                <Link2 className="h-4 w-4 mr-2" />
                Join
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface-elevated border-white/10">
              <DialogHeader>
                <DialogTitle>Join with invite code</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Invite Code</Label>
                  <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="bg-surface border-white/10" required />
                </div>
                <Button type="submit" className="w-full gradient-brand border-0" disabled={creating}>Join Trip</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brand border-0">
                <Plus className="h-4 w-4 mr-2" />
                New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface-elevated border-white/10">
              <DialogHeader>
                <DialogTitle>Create a trip</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Trip name</Label>
                  <Input value={newTrip.name} onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })} className="bg-surface border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newTrip.description} onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })} className="bg-surface border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Budget (optional)</Label>
                  <Input type="number" value={newTrip.budget} onChange={(e) => setNewTrip({ ...newTrip, budget: e.target.value })} className="bg-surface border-white/10" />
                </div>
                <Button type="submit" className="w-full gradient-brand border-0" disabled={creating}>Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <Card className="border-white/10 bg-surface-elevated hover:border-brand/40 transition-colors h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{trip.name}</CardTitle>
                    <Badge variant="outline" className="border-brand/30 text-brand-light">{trip.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {trip.description && <p className="text-sm text-neutral-400 mb-2 line-clamp-2">{trip.description}</p>}
                  <p className="text-sm text-neutral-500">{trip.memberCount} members</p>
                  <p className="text-emerald-400 font-medium mt-1">{formatCurrency(trip.expenseTotal ?? 0, trip.currency)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
