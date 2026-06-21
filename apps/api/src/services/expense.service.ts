import { prisma } from '@settl/database';
import { resolveSplits, assertFeature } from '@settl/utils';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import {
  assertTripMember,
  getEffectivePlanForTrip,
  serializeExpense,
  decimalToNumber,
} from './subscription.service.js';
import { createNotification } from './notification.service.js';
import { getIo } from '../socket/index.js';

export async function listExpenses(tripId: string, userId: string) {
  await assertTripMember(tripId, userId);
  const expenses = await prisma.expense.findMany({
    where: { tripId },
    include: {
      splits: true,
      paidBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { expenseDate: 'desc' },
  });

  return expenses.map((e) => ({
    ...serializeExpense(e),
    splits: e.splits.map((s) => ({
      ...s,
      amount: decimalToNumber(s.amount),
      percentage: s.percentage != null ? decimalToNumber(s.percentage) : null,
    })),
    paidBy: e.paidBy,
  }));
}

export async function getExpense(tripId: string, expenseId: string, userId: string) {
  await assertTripMember(tripId, userId);
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId },
    include: {
      splits: true,
      paidBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });
  if (!expense) throw new NotFoundError('Expense not found');

  return {
    ...serializeExpense(expense),
    splits: expense.splits.map((s) => ({
      ...s,
      amount: decimalToNumber(s.amount),
      percentage: s.percentage != null ? decimalToNumber(s.percentage) : null,
    })),
    paidBy: expense.paidBy,
  };
}

export async function createExpense(
  tripId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    totalAmount: number;
    category?: string;
    expenseDate?: string;
    receiptUrl?: string;
    paidByUserId?: string;
    splits: Array<{
      userId: string;
      splitType: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'EXCLUDE';
      amount?: number;
      percentage?: number;
    }>;
  }
) {
  await assertTripMember(tripId, userId);
  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
  const ownerPlan = await getEffectivePlanForTrip(trip.ownerId, tripId);

  const hasCustomSplit = data.splits.some((s) => s.splitType !== 'EQUAL');
  if (hasCustomSplit) assertFeature(ownerPlan, 'customSplit');

  const payerId = data.paidByUserId ?? userId;
  await assertTripMember(tripId, payerId);

  const resolved = resolveSplits(data.totalAmount, data.splits);

  const expense = await prisma.expense.create({
    data: {
      tripId,
      paidByUserId: payerId,
      title: data.title,
      description: data.description,
      totalAmount: data.totalAmount,
      category: (data.category ?? 'OTHER') as never,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      receiptUrl: data.receiptUrl,
      splits: {
        create: resolved.map((s) => ({
          userId: s.userId,
          splitType: s.splitType,
          amount: s.amount,
          percentage: s.percentage,
        })),
      },
    },
    include: {
      splits: true,
      paidBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  const members = await prisma.tripMember.findMany({
    where: { tripId, leftAt: null, NOT: { userId } },
  });

  for (const member of members) {
    await createNotification({
      userId: member.userId,
      type: 'EXPENSE_ADDED',
      title: 'New expense added',
      body: `${expense.title} — ${data.totalAmount} ${trip.currency}`,
      data: { tripId, expenseId: expense.id },
    });
  }

  try {
    getIo().to(`trip:${tripId}`).emit('expense:created', { tripId, expenseId: expense.id });
  } catch {
    // ignore
  }

  return {
    ...serializeExpense(expense),
    splits: expense.splits.map((s) => ({
      ...s,
      amount: decimalToNumber(s.amount),
      percentage: s.percentage != null ? decimalToNumber(s.percentage) : null,
    })),
    paidBy: expense.paidBy,
  };
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    totalAmount: number;
    category: string;
    expenseDate: string;
    receiptUrl: string;
    paidByUserId: string;
    splits: Array<{
      userId: string;
      splitType: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'EXCLUDE';
      amount?: number;
      percentage?: number;
    }>;
  }>
) {
  await assertTripMember(tripId, userId);
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!existing) throw new NotFoundError('Expense not found');

  if (existing.paidByUserId !== userId) {
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, role: { in: ['OWNER', 'ADMIN'] }, leftAt: null },
    });
    if (!member) throw new ForbiddenError('Only the payer or trip admin can edit this expense');
  }

  const totalAmount = data.totalAmount ?? decimalToNumber(existing.totalAmount);
  let splitsUpdate = undefined;

  if (data.splits) {
    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
    const ownerPlan = await getEffectivePlanForTrip(trip.ownerId, tripId);
    const hasCustomSplit = data.splits.some((s) => s.splitType !== 'EQUAL');
    if (hasCustomSplit) assertFeature(ownerPlan, 'customSplit');

    const resolved = resolveSplits(totalAmount, data.splits);
    await prisma.expenseSplit.deleteMany({ where: { expenseId } });
    splitsUpdate = {
      create: resolved.map((s) => ({
        userId: s.userId,
        splitType: s.splitType,
        amount: s.amount,
        percentage: s.percentage,
      })),
    };
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      title: data.title,
      description: data.description,
      totalAmount: data.totalAmount,
      category: data.category as never,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
      receiptUrl: data.receiptUrl,
      paidByUserId: data.paidByUserId,
      ...(splitsUpdate ? { splits: splitsUpdate } : {}),
    },
    include: {
      splits: true,
      paidBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  try {
    getIo().to(`trip:${tripId}`).emit('expense:updated', { tripId, expenseId });
  } catch {
    // ignore
  }

  return {
    ...serializeExpense(expense),
    splits: expense.splits.map((s) => ({
      ...s,
      amount: decimalToNumber(s.amount),
      percentage: s.percentage != null ? decimalToNumber(s.percentage) : null,
    })),
    paidBy: expense.paidBy,
  };
}

export async function deleteExpense(tripId: string, expenseId: string, userId: string) {
  await assertTripMember(tripId, userId);
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!existing) throw new NotFoundError('Expense not found');

  if (existing.paidByUserId !== userId) {
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, role: { in: ['OWNER', 'ADMIN'] }, leftAt: null },
    });
    if (!member) throw new ForbiddenError('Only the payer or trip admin can delete this expense');
  }

  await prisma.expense.delete({ where: { id: expenseId } });

  try {
    getIo().to(`trip:${tripId}`).emit('expense:deleted', { tripId, expenseId });
  } catch {
    // ignore
  }

  return { success: true };
}
