export type MemberBalance = {
  userId: string;
  name: string;
  avatarUrl?: string;
  net: number; // positive = owed money, negative = owes money
  totalPaid: number;
  totalOwed: number;
  preContribution: number;
};

/**
 * Computes balances for a trip.
 * // TODO: Implement balance calculator
 */
export async function computeTripBalances(tripId: string): Promise<MemberBalance[]> {
  return [];
}
