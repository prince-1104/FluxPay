"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@settl/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Plan = {
  id: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  maxTrips: number;
  maxMembersPerTrip: number;
  canScanReceipts: boolean;
  canExport: boolean;
  canCustomSplit: boolean;
};

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/users/plans");
      return data.data as Plan[];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await api.get("/users/subscription");
      return data.data;
    },
  });

  async function handleUpgrade(tier: string) {
    setLoading(tier);
    try {
      if (process.env.NODE_ENV === "development") {
        await api.post("/premium/simulate-upgrade", { tier });
        toast.success(`Upgraded to ${tier}!`);
        window.location.reload();
        return;
      }
      const { data } = await api.post("/premium/checkout", { tier, billing: "monthly" });
      if (data.data.checkoutUrl) window.location.href = data.data.checkoutUrl;
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(null);
    }
  }

  const currentTier = subscription?.plan?.tier ?? "FREE";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="text-neutral-400">Choose the plan that fits your group travel needs</p>
        <p className="text-sm text-brand-light mt-2">Current plan: {currentTier}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`border-white/10 bg-surface-elevated ${plan.tier === "PRO" ? "border-brand/40 ring-1 ring-brand/20" : ""}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{plan.tier}</CardTitle>
                {currentTier === plan.tier && <Badge className="gradient-brand border-0">Current</Badge>}
              </div>
              <CardDescription>
                {plan.maxTrips < 0 ? "Unlimited trips" : `${plan.maxTrips} trips`} ·{" "}
                {plan.maxMembersPerTrip < 0 ? "Unlimited members" : `${plan.maxMembersPerTrip} members/trip`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(plan.priceMonthly)}<span className="text-sm font-normal text-neutral-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-400">
                {plan.canScanReceipts && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Receipt scanning</li>}
                {plan.canExport && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> CSV export</li>}
                {plan.canCustomSplit && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Custom splits</li>}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.tier !== "FREE" && currentTier !== plan.tier && (
                <Button
                  className="w-full gradient-brand border-0"
                  disabled={loading === plan.tier}
                  onClick={() => handleUpgrade(plan.tier)}
                >
                  {loading === plan.tier ? "Processing..." : `Upgrade to ${plan.tier}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
