import { formatCurrency as formatAmount } from "@settl/utils";

/** Format amounts as USD across the web UI (display only). */
export function formatCurrency(amount: number, _currency?: string): string {
  return formatAmount(amount, "USD");
}
