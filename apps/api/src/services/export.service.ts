import { prisma } from '@settl/database';
import { assertFeature, computeTripBalances, formatCurrency } from '@settl/utils';
import { NotFoundError } from '../utils/errors.js';
import { assertTripMember, getUserPlanLimits, decimalToNumber } from './subscription.service.js';

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportTripCsv(tripId: string, userId: string): Promise<string> {
  await assertTripMember(tripId, userId);
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { owner: true },
  });
  const ownerPlan = await getUserPlanLimits(trip.ownerId);
  assertFeature(ownerPlan, 'export');

  const expenses = await prisma.expense.findMany({
    where: { tripId },
    include: {
      paidBy: { select: { name: true } },
      splits: { include: { user: { select: { name: true } } } },
    },
    orderBy: { expenseDate: 'asc' },
  });

  const lines = [
    'Date,Title,Category,Paid By,Total,Split For,Split Amount',
  ];

  for (const expense of expenses) {
    for (const split of expense.splits) {
      lines.push([
        expense.expenseDate.toISOString().split('T')[0],
        expense.title,
        expense.category,
        expense.paidBy.name,
        decimalToNumber(expense.totalAmount),
        split.user.name,
        decimalToNumber(split.amount),
      ].map(escapeCsv).join(','));
    }
  }

  return lines.join('\n');
}

export async function exportTripSummary(tripId: string, userId: string) {
  await assertTripMember(tripId, userId);
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: {
      owner: true,
      members: {
        where: { leftAt: null },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      expenses: { include: { splits: true } },
      preContributions: true,
    },
  });

  const ownerPlan = await getUserPlanLimits(trip.ownerId);
  assertFeature(ownerPlan, 'export');

  const balances = computeTripBalances({
    members: trip.members.map((m) => ({
      userId: m.userId,
      name: m.displayName ?? m.user.name,
      avatarUrl: m.user.avatarUrl,
      preContribution: decimalToNumber(m.preContribution),
    })),
    expenses: trip.expenses.map((e) => ({
      paidByUserId: e.paidByUserId,
      totalAmount: decimalToNumber(e.totalAmount),
      splits: e.splits.map((s) => ({ userId: s.userId, amount: decimalToNumber(s.amount) })),
    })),
    preContributions: trip.preContributions.map((c) => ({
      fromUserId: c.fromUserId,
      toUserId: c.toUserId,
      amount: decimalToNumber(c.amount),
    })),
  });

  return {
    trip: { id: trip.id, name: trip.name, currency: trip.currency },
    balances: balances.map((b) => ({
      ...b,
      netFormatted: formatCurrency(b.net, trip.currency),
    })),
    totalExpenses: trip.expenses.reduce((sum, e) => sum + decimalToNumber(e.totalAmount), 0),
  };
}
