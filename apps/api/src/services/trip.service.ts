import { prisma } from '@settl/database';
import { assertTripLimit, assertMemberLimit, computeTripBalances, computeSettlements } from '@settl/utils';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import {
  assertTripMember,
  assertTripAdmin,
  countOwnedTrips,
  countTripMembers,
  getUserPlanLimits,
  getEffectivePlanForTrip,
  isProTrialTrip,
  serializeTrip,
  decimalToNumber,
} from './subscription.service.js';
import { createNotification } from './notification.service.js';
import { getIo } from '../socket/index.js';

export async function listTrips(userId: string) {
  const memberships = await prisma.tripMember.findMany({
    where: { userId, leftAt: null },
    include: {
      trip: {
        include: {
          members: {
            where: { leftAt: null },
            include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
          },
          expenses: { select: { totalAmount: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return Promise.all(
    memberships.map(async ({ trip }) => {
      const proTrial = await isProTrialTrip(trip.id, trip.ownerId);
      return {
        ...serializeTrip(trip),
        members: trip.members.map((m) => ({
          ...m,
          preContribution: decimalToNumber(m.preContribution),
        })),
        memberCount: trip.members.length,
        expenseTotal: trip.expenses.reduce((sum, e) => sum + decimalToNumber(e.totalAmount), 0),
        isProTrial: proTrial,
      };
    })
  );
}

export async function getTrip(tripId: string, userId: string) {
  await assertTripMember(tripId, userId);
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: {
      members: {
        where: { leftAt: null },
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      },
      expenses: { select: { totalAmount: true } },
    },
  });

  const proTrial = await isProTrialTrip(tripId, trip.ownerId);

  return {
    ...serializeTrip(trip),
    members: trip.members.map((m) => ({
      ...m,
      preContribution: decimalToNumber(m.preContribution),
    })),
    memberCount: trip.members.length,
    expenseTotal: trip.expenses.reduce((sum, e) => sum + decimalToNumber(e.totalAmount), 0),
    isProTrial: proTrial,
  };
}

export async function createTrip(
  userId: string,
  data: {
    name: string;
    description?: string;
    budget?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    coverImage?: string;
  }
) {
  const plan = await getUserPlanLimits(userId);
  const tripCount = await countOwnedTrips(userId);
  assertTripLimit(tripCount, plan);

  const trip = await prisma.trip.create({
    data: {
      name: data.name,
      description: data.description,
      budget: data.budget,
      currency: data.currency ?? 'INR',
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      coverImage: data.coverImage,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      },
    },
  });

  return serializeTrip(trip);
}

export async function updateTrip(
  tripId: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string;
    budget: number;
    currency: string;
    status: string;
    startDate: string;
    endDate: string;
    coverImage: string;
  }>
) {
  await assertTripAdmin(tripId, userId);
  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      name: data.name,
      description: data.description,
      budget: data.budget,
      currency: data.currency,
      status: data.status as never,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      coverImage: data.coverImage,
    },
  });
  return serializeTrip(trip);
}

export async function joinTrip(userId: string, inviteCode: string, displayName?: string) {
  const trip = await prisma.trip.findUnique({
    where: { inviteCode },
    include: { owner: true },
  });
  if (!trip) throw new NotFoundError('Invalid invite code');

  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId } },
  });
  if (existing && !existing.leftAt) {
    throw new ForbiddenError('Already a member of this trip');
  }

  const ownerPlan = await getEffectivePlanForTrip(trip.ownerId, trip.id);
  const memberCount = await countTripMembers(trip.id);
  assertMemberLimit(memberCount, ownerPlan);

  const member = existing
    ? await prisma.tripMember.update({
        where: { id: existing.id },
        data: { leftAt: null, displayName, joinedAt: new Date() },
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      })
    : await prisma.tripMember.create({
        data: { tripId: trip.id, userId, displayName },
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await createNotification({
    userId: trip.ownerId,
    type: 'MEMBER_JOINED',
    title: 'New member joined',
    body: `${user.name} joined ${trip.name}`,
    data: { tripId: trip.id, userId },
  });

  try {
    getIo().to(`trip:${trip.id}`).emit('member:joined', { tripId: trip.id, member });
  } catch {
    // Socket may not be initialized in tests
  }

  return member;
}

export async function leaveTrip(tripId: string, userId: string) {
  const member = await assertTripMember(tripId, userId);
  if (member.role === 'OWNER') throw new ForbiddenError('Trip owner cannot leave. Transfer ownership or delete the trip.');
  await prisma.tripMember.update({
    where: { id: member.id },
    data: { leftAt: new Date() },
  });
  return { success: true };
}

export async function deleteTrip(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new NotFoundError('Trip not found');
  if (trip.ownerId !== userId) throw new ForbiddenError('Only the owner can delete this trip');
  await prisma.trip.delete({ where: { id: tripId } });
  return { success: true };
}

export async function getTripBalances(tripId: string, userId: string) {
  await assertTripMember(tripId, userId);

  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: {
      members: {
        where: { leftAt: null },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      expenses: { include: { splits: true } },
      preContributions: true,
    },
  });

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
      splits: e.splits.map((s) => ({
        userId: s.userId,
        amount: decimalToNumber(s.amount),
      })),
    })),
    preContributions: trip.preContributions.map((c) => ({
      fromUserId: c.fromUserId,
      toUserId: c.toUserId,
      amount: decimalToNumber(c.amount),
    })),
  });

  const suggestions = computeSettlements(balances.map((b) => ({ userId: b.userId, net: b.net })));

  return { balances, suggestions };
}

export async function addPreContribution(
  tripId: string,
  userId: string,
  data: { toUserId: string; amount: number; note?: string }
) {
  await assertTripMember(tripId, userId);
  await assertTripMember(tripId, data.toUserId);

  const contribution = await prisma.preContribution.create({
    data: {
      tripId,
      fromUserId: userId,
      toUserId: data.toUserId,
      amount: data.amount,
      note: data.note,
    },
  });

  return {
    ...contribution,
    amount: decimalToNumber(contribution.amount),
  };
}

export async function addTripMember(
  tripId: string,
  actorUserId: string,
  target: { userId?: string; username?: string }
) {
  await assertTripAdmin(tripId, actorUserId);

  let targetUser;
  if (target.userId) {
    targetUser = await prisma.user.findUnique({ where: { id: target.userId } });
  } else if (target.username) {
    targetUser = await prisma.user.findUnique({ where: { username: target.username } });
  }
  if (!targetUser) throw new NotFoundError('User not found');

  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { owner: true },
  });

  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: targetUser.id } },
  });
  if (existing && !existing.leftAt) {
    throw new ForbiddenError('User is already a member of this trip');
  }

  const ownerPlan = await getEffectivePlanForTrip(trip.ownerId, trip.id);
  const memberCount = await countTripMembers(tripId);
  assertMemberLimit(memberCount, ownerPlan);

  const member = existing
    ? await prisma.tripMember.update({
        where: { id: existing.id },
        data: { leftAt: null, joinedAt: new Date() },
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      })
    : await prisma.tripMember.create({
        data: { tripId, userId: targetUser.id },
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      });

  const actor = await prisma.user.findUniqueOrThrow({ where: { id: actorUserId } });
  await createNotification({
    userId: targetUser.id,
    type: 'TRIP_INVITE',
    title: 'Added to trip',
    body: `${actor.name} added you to ${trip.name}`,
    data: { tripId, userId: actorUserId },
  });

  try {
    getIo().to(`trip:${tripId}`).emit('member:joined', { tripId, member });
  } catch {
    // Socket may not be initialized in tests
  }

  return member;
}

export async function removeTripMember(tripId: string, actorUserId: string, targetUserId: string) {
  const actor = await assertTripAdmin(tripId, actorUserId);

  const target = await prisma.tripMember.findFirst({
    where: { tripId, userId: targetUserId, leftAt: null },
    include: { user: { select: { id: true, name: true, username: true } } },
  });
  if (!target) throw new NotFoundError('Member not found');
  if (target.role === 'OWNER') throw new ForbiddenError('Cannot remove the trip owner');
  if (target.role === 'ADMIN' && actor.role !== 'OWNER') {
    throw new ForbiddenError('Only the owner can remove admins');
  }

  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });

  await prisma.tripMember.update({
    where: { id: target.id },
    data: { leftAt: new Date() },
  });

  const actorUser = await prisma.user.findUniqueOrThrow({ where: { id: actorUserId } });
  await createNotification({
    userId: targetUserId,
    type: 'MEMBER_LEFT',
    title: 'Removed from trip',
    body: `${actorUser.name} removed you from ${trip.name}`,
    data: { tripId, userId: actorUserId },
  });

  try {
    getIo().to(`trip:${tripId}`).emit('member:left', { tripId, userId: targetUserId });
  } catch {
    // Socket may not be initialized in tests
  }

  return { success: true };
}
