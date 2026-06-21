import { roundCurrency } from './format-currency';

export type MemberBalance = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  net: number;
  totalPaid: number;
  totalOwed: number;
  preContribution: number;
};

export type TripBalanceInput = {
  members: Array<{
    userId: string;
    name: string;
    avatarUrl?: string | null;
    preContribution?: number;
  }>;
  expenses: Array<{
    paidByUserId: string;
    totalAmount: number;
    splits: Array<{ userId: string; amount: number }>;
  }>;
  preContributions?: Array<{
    fromUserId: string;
    toUserId: string;
    amount: number;
  }>;
};

export function computeTripBalances(input: TripBalanceInput): MemberBalance[] {
  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();
  const memberMeta = new Map<string, { name: string; avatarUrl?: string | null; preContribution: number }>();

  for (const member of input.members) {
    memberMeta.set(member.userId, {
      name: member.name,
      avatarUrl: member.avatarUrl,
      preContribution: member.preContribution ?? 0,
    });
    paidMap.set(member.userId, 0);
    owedMap.set(member.userId, 0);
  }

  for (const expense of input.expenses) {
    paidMap.set(
      expense.paidByUserId,
      roundCurrency((paidMap.get(expense.paidByUserId) ?? 0) + expense.totalAmount)
    );
    for (const split of expense.splits) {
      owedMap.set(split.userId, roundCurrency((owedMap.get(split.userId) ?? 0) + split.amount));
    }
  }

  const netAdjustments = new Map<string, number>();
  for (const member of input.members) {
    netAdjustments.set(member.userId, 0);
  }

  for (const contrib of input.preContributions ?? []) {
    netAdjustments.set(
      contrib.fromUserId,
      roundCurrency((netAdjustments.get(contrib.fromUserId) ?? 0) + contrib.amount)
    );
    netAdjustments.set(
      contrib.toUserId,
      roundCurrency((netAdjustments.get(contrib.toUserId) ?? 0) - contrib.amount)
    );
  }

  return input.members.map((member) => {
    const meta = memberMeta.get(member.userId)!;
    const totalPaid = paidMap.get(member.userId) ?? 0;
    const totalOwed = owedMap.get(member.userId) ?? 0;
    const adjustment = netAdjustments.get(member.userId) ?? 0;
    const net = roundCurrency(totalPaid - totalOwed + adjustment);

    return {
      userId: member.userId,
      name: meta.name,
      avatarUrl: meta.avatarUrl,
      net,
      totalPaid,
      totalOwed,
      preContribution: meta.preContribution,
    };
  });
}
