/**
 * Formats a numeric amount into a localized currency string.
 * // TODO: Implement format currency
 */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return `${currency} ${amount.toFixed(2)}`;
}
