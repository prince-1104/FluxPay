import { prisma, Prisma } from '@settl/database';
import { PlanLimits } from '@settl/utils';
import { NotFoundError } from '../utils/errors.js';

export function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    const freePlan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { tier: 'FREE' } });
    return {
      tier: freePlan.tier,
      maxTrips: freePlan.maxTrips,
      maxMembersPerTrip: freePlan.maxMembersPerTrip,
      canScanReceipts: freePlan.canScanReceipts,
      canExport: freePlan.canExport,
      canCustomSplit: freePlan.canCustomSplit,
      canCurrencyConvert: freePlan.canCurrencyConvert,
      canAISettle: freePlan.canAISettle,
    };
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: subscription.planId },
  });

  if (!plan) {
    throw new NotFoundError('Subscription plan not found');
  }

  return {
    tier: plan.tier,
    maxTrips: plan.maxTrips,
    maxMembersPerTrip: plan.maxMembersPerTrip,
    canScanReceipts: plan.canScanReceipts,
    canExport: plan.canExport,
    canCustomSplit: plan.canCustomSplit,
    canCurrencyConvert: plan.canCurrencyConvert,
    canAISettle: plan.canAISettle,
  };
}

export async function countOwnedTrips(userId: string): Promise<number> {
  return prisma.trip.count({ where: { ownerId: userId, status: { not: 'ARCHIVED' } } });
}

export async function countTripMembers(tripId: string): Promise<number> {
  return prisma.tripMember.count({ where: { tripId, leftAt: null } });
}

export function serializeTrip(trip: {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  budget: unknown;
  currency: string;
  inviteCode: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...trip,
    budget: trip.budget != null ? decimalToNumber(trip.budget as never) : null,
  };
}

export function serializeExpense(expense: {
  id: string;
  tripId: string;
  paidByUserId: string;
  title: string;
  description: string | null;
  totalAmount: unknown;
  category: string;
  receiptUrl: string | null;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...expense,
    totalAmount: decimalToNumber(expense.totalAmount as never),
  };
}

export async function assertTripMember(tripId: string, userId: string) {
  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId, leftAt: null },
  });
  if (!member) throw new NotFoundError('Trip not found or access denied');
  return member;
}

export async function assertTripAdmin(tripId: string, userId: string) {
  const member = await assertTripMember(tripId, userId);
  if (!['OWNER', 'ADMIN'].includes(member.role)) {
    throw new NotFoundError('Insufficient permissions');
  }
  return member;
}
