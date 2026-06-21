"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type PremiumCtaButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: "default" | "lg";
  showSparkle?: boolean;
};

export function PremiumCtaButton({
  children,
  icon,
  size = "default",
  showSparkle = true,
  className,
  disabled,
  ...props
}: PremiumCtaButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "premium-cta group inline-flex",
        size === "lg" && "premium-cta-lg",
        disabled && "premium-cta-disabled",
        className
      )}
      {...props}
    >
      <span className="premium-cta-glow" aria-hidden />
      <span className="premium-cta-face">
        {icon && <span className="premium-cta-icon">{icon}</span>}
        <span>{children}</span>
        {showSparkle && (
          <Sparkles className="premium-cta-sparkle h-3.5 w-3.5 shrink-0 text-white/80" />
        )}
      </span>
    </button>
  );
}
