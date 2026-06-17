export type Balance = { userId: string; net: number };

export type Settlement = { payerId: string; payeeId: string; amount: number };

/**
 * Computes a minimized set of settlements to resolve all balances.
 * // TODO: Implement settlement engine
 */
export function computeSettlements(balances: Balance[]): Settlement[] {
  return [];
}
