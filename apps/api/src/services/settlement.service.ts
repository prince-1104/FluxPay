import { prisma } from '@settl/database';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { assertTripMember, decimalToNumber } from './subscription.service.js';
import { createNotification } from './notification.service.js';
import { getIo } from '../socket/index.js';

export async function listSettlements(tripId: string, userId: string) {
  await assertTripMember(tripId, userId);
  const settlements = await prisma.settlement.findMany({
    where: { tripId },
    include: {
      payer: { select: { id: true, name: true, username: true, avatarUrl: true } },
      payee: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return settlements.map((s) => ({
    ...s,
    amount: decimalToNumber(s.amount),
  }));
}

export async function createSettlement(
  tripId: string,
  userId: string,
  data: { payerId: string; payeeId: string; amount: number; method?: string }
) {
  await assertTripMember(tripId, userId);
  await assertTripMember(tripId, data.payerId);
  await assertTripMember(tripId, data.payeeId);

  if (data.payerId === data.payeeId) {
    throw new ForbiddenError('Payer and payee must be different');
  }

  const settlement = await prisma.settlement.create({
    data: {
      tripId,
      payerId: data.payerId,
      payeeId: data.payeeId,
      amount: data.amount,
      method: data.method,
    },
    include: {
      payer: { select: { id: true, name: true, username: true, avatarUrl: true } },
      payee: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  await createNotification({
    userId: data.payeeId,
    type: 'SETTLEMENT_CREATED',
    title: 'Settlement recorded',
    body: `You are owed ${data.amount}`,
    data: { tripId, settlementId: settlement.id },
  });

  try {
    getIo().to(`trip:${tripId}`).emit('settlement:created', { tripId, settlementId: settlement.id });
  } catch {
    // ignore
  }

  return { ...settlement, amount: decimalToNumber(settlement.amount) };
}

export async function updateSettlement(
  tripId: string,
  settlementId: string,
  userId: string,
  data: { status: 'PENDING' | 'COMPLETED' | 'REJECTED'; method?: string; txnRef?: string }
) {
  await assertTripMember(tripId, userId);
  const settlement = await prisma.settlement.findFirst({
    where: { id: settlementId, tripId },
  });
  if (!settlement) throw new NotFoundError('Settlement not found');

  const isParty = settlement.payerId === userId || settlement.payeeId === userId;
  const isAdmin = await prisma.tripMember.findFirst({
    where: { tripId, userId, role: { in: ['OWNER', 'ADMIN'] }, leftAt: null },
  });
  if (!isParty && !isAdmin) throw new ForbiddenError('Not authorized to update this settlement');

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: data.status,
      method: data.method,
      txnRef: data.txnRef,
      settledAt: data.status === 'COMPLETED' ? new Date() : null,
    },
    include: {
      payer: { select: { id: true, name: true, username: true, avatarUrl: true } },
      payee: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  if (data.status === 'COMPLETED') {
    await createNotification({
      userId: settlement.payerId,
      type: 'SETTLEMENT_COMPLETED',
      title: 'Settlement completed',
      body: `Payment of ${decimalToNumber(settlement.amount)} confirmed`,
      data: { tripId, settlementId },
    });
  }

  try {
    getIo().to(`trip:${tripId}`).emit('settlement:updated', { tripId, settlementId });
  } catch {
    // ignore
  }

  return { ...updated, amount: decimalToNumber(updated.amount) };
}

export async function generateSuggestedSettlements(tripId: string, userId: string) {
  const { getTripBalances } = await import('./trip.service.js');
  const { balances, suggestions } = await getTripBalances(tripId, userId);
  return { balances, suggestions };
}
