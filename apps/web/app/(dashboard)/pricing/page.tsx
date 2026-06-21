"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

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
  canCurrencyConvert: boolean;
  canAISettle: boolean;
};

const tierIcons: Record<string, typeof Sparkles> = {
  FREE: Sparkles,
  PRO: Zap,
  PREMIUM: Crown,
};

const allFeatures = (plan: Plan) => [
  plan.maxTrips < 0 ? "Unlimited trips" : `${plan.maxTrips} active trips`,
  plan.maxMembersPerTrip < 0 ? "Unlimited members" : `${plan.maxMembersPerTrip} members per trip`,
  "Equal expense splits",
  ...(plan.canCustomSplit ? ["Custom & percentage splits"] : []),
  ...(plan.canScanReceipts ? ["Receipt OCR scanning"] : []),
  ...(plan.canExport ? ["CSV export & reports"] : []),
  ...(plan.canCurrencyConvert ? ["Multi-currency support"] : []),
  ...(plan.canAISettle ? ["AI settlement suggestions"] : []),
];

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

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
      await api.post("/premium/simulate-upgrade", { tier });
      toast.success(`Upgraded to ${tier}!`);
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(null);
    }
  }

  const currentTier = subscription?.plan?.tier ?? "FREE";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & plans"
        description="Upgrade to unlock pro features for your group."
      >
        <Badge variant="outline" className="border-brand/30 text-brand-light">
          Current: {currentTier}
        </Badge>
      </PageHeader>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setYearly(false)}
          className={cn("rounded-lg px-4 py-2 text-sm transition-colors", !yearly ? "bg-brand/20 text-brand-light" : "text-neutral-500")}
        >
          Monthly
        </button>
        <button
          onClick={() => setYearly(true)}
          className={cn("rounded-lg px-4 py-2 text-sm transition-colors", yearly ? "bg-brand/20 text-brand-light" : "text-neutral-500")}
        >
          Yearly <span className="text-emerald-400 text-xs ml-1">Save 30%</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = tierIcons[plan.tier] ?? Sparkles;
          const isCurrent = currentTier === plan.tier;
          const isPopular = plan.tier === "PRO";
          const price = yearly ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={cn(
                "saas-card relative flex flex-col p-6",
                isPopular && "border-brand/40 ring-1 ring-brand/20 lg:scale-105",
                isCurrent && "ring-1 ring-emerald-500/30"
              )}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-brand px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand-light">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{plan.tier}</h3>
                  {isCurrent && <span className="text-xs text-emerald-400">Your plan</span>}
                </div>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(price)}
                <span className="text-sm font-normal text-neutral-500">/{yearly ? "yr" : "mo"}</span>
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {allFeatures(plan).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-400">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.tier === "FREE" ? (
                  <Button variant="outline" className="w-full border-white/10" disabled={isCurrent}>
                    {isCurrent ? "Current plan" : "Downgrade"}
                  </Button>
                ) : (
                  <Button
                    className={cn("w-full border-0", isPopular ? "gradient-brand shadow-lg shadow-brand/20" : "bg-white/10 hover:bg-white/15")}
                    disabled={loading === plan.tier || isCurrent}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {isCurrent ? "Current plan" : loading === plan.tier ? "Processing…" : `Upgrade to ${plan.tier}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
