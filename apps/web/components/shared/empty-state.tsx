"use client";

import { LucideIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PremiumCtaButton } from "@/components/shared/premium-cta-button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; premium?: boolean };
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand-light">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">{description}</p>
      {action && (
        action.premium ? (
          <PremiumCtaButton
            size="lg"
            onClick={action.onClick}
            icon={<Plus className="h-4 w-4" strokeWidth={2.5} />}
            className="mt-6"
          >
            {action.label}
          </PremiumCtaButton>
        ) : (
          <Button onClick={action.onClick} className="mt-6 gradient-brand border-0">
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
