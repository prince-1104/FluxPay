"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Map, Plus, Users, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@settl/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import type { TripWithMembers } from "@settl/types";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data } = await api.get("/trips");
      return data.data as TripWithMembers[];
    },
  });

  const totalSpent = trips.reduce((sum, t) => sum + (t.expenseTotal ?? 0), 0);
  const activeTrips = trips.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-neutral-400 mt-1">Manage your group trips and settlements</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-surface-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Active Trips</CardTitle>
            <Map className="h-4 w-4 text-brand-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-surface-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Total Trips</CardTitle>
            <Users className="h-4 w-4 text-brand-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trips.length}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-surface-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Trips</h2>
        <Link href="/trips">
          <Button variant="outline" className="border-white/10">
            <Plus className="h-4 w-4 mr-2" />
            View all
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-neutral-500">Loading trips...</p>
      ) : trips.length === 0 ? (
        <Card className="border-white/10 bg-surface-elevated p-8 text-center">
          <p className="text-neutral-400 mb-4">No trips yet. Create your first group trip!</p>
          <Link href="/trips">
            <Button className="gradient-brand border-0">Create Trip</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.slice(0, 6).map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <Card className="border-white/10 bg-surface-elevated hover:border-brand/40 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{trip.name}</CardTitle>
                    <Badge variant="outline" className="border-brand/30 text-brand-light">{trip.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400">{trip.memberCount ?? trip.members?.length ?? 0} members</p>
                  <p className="text-sm font-medium text-emerald-400 mt-1">
                    {formatCurrency(trip.expenseTotal ?? 0, trip.currency)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
