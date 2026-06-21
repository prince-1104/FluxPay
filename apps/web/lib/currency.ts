import { formatCurrency as formatAmount } from "@settl/utils";

/** Format amounts in INR (or trip currency) across the web UI. */
export function formatCurrency(amount: number, currency = "INR"): string {
  return formatAmount(amount, currency);
}
