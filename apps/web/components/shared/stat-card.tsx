import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  valueClassName?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div className={cn("saas-card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
          <p className={cn("mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate", valueClassName)}>{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", trendUp ? "text-emerald-400" : "text-neutral-500")}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand-light">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
