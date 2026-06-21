"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileExpenseWidgetProps = {
  onClick: () => void;
  expenseCount?: number;
  className?: string;
};

export function MobileExpenseWidget({
  onClick,
  expenseCount = 0,
  className,
}: MobileExpenseWidgetProps) {
  return (
    <div
      className={cn(
        "fixed z-40 lg:hidden pointer-events-none",
        "right-3 mobile-fab-slot",
        className
      )}
      aria-hidden={false}
    >
      <button
        type="button"
        onClick={onClick}
        className="expense-fab pointer-events-auto touch-manipulation"
        aria-label={
          expenseCount > 0
            ? `Add expense (${expenseCount} logged)`
            : "Add expense"
        }
      >
        <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        {expenseCount > 0 && (
          <span className="expense-fab-badge" aria-hidden>
            {expenseCount > 99 ? "99+" : expenseCount}
          </span>
        )}
      </button>
    </div>
  );
}
