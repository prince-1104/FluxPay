import { prisma } from '@settl/database';
import type { FriendRelationStatus, UserPublic } from '@settl/types';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { createNotification } from './notification.service.js';

const userSelect = { id: true, name: true, username: true, avatarUrl: true } as const;

function toPublicUser(user: UserPublic): UserPublic {
  return user;
}

async function getFriendshipBetween(userId: string, otherUserId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: userId },
      ],
    },
  });
}

function relationStatus(
  userId: string,
  friendship: { id: string; requesterId: string; addresseeId: string; status: string } | null
): { status: FriendRelationStatus; friendshipId?: string } {
  if (!friendship) return { status: 'NONE' };
  if (friendship.status === 'ACCEPTED') {
    return { status: 'FRIENDS', friendshipId: friendship.id };
  }
  if (friendship.status === 'PENDING') {
    if (friendship.requesterId === userId) {
      return { status: 'PENDING_SENT', friendshipId: friendship.id };
    }
    return { status: 'PENDING_RECEIVED', friendshipId: friendship.id };
  }
  return { status: 'NONE' };
}

export async function listFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return friendships.map((f) => ({
    id: f.id,
    user: toPublicUser(f.requesterId === userId ? f.addressee : f.requester),
    since: f.updatedAt,
  }));
}

export async function listPendingRequests(userId: string) {
  const incoming = await prisma.friendship.findMany({
    where: { addresseeId: userId, status: 'PENDING' },
    include: { requester: { select: userSelect } },
    orderBy: { createdAt: 'desc' },
  });

  const outgoing = await prisma.friendship.findMany({
    where: { requesterId: userId, status: 'PENDING' },
    include: { addressee: { select: userSelect } },
    orderBy: { createdAt: 'desc' },
  });

  return {
    incoming: incoming.map((f) => ({
      id: f.id,
      user: toPublicUser(f.requester),
      createdAt: f.createdAt,
    })),
    outgoing: outgoing.map((f) => ({
      id: f.id,
      user: toPublicUser(f.addressee),
      createdAt: f.createdAt,
    })),
  };
}

export async function sendFriendRequest(userId: string, target: { userId?: string; username?: string }) {
  let targetUser;
  if (target.userId) {
    targetUser = await prisma.user.findUnique({ where: { id: target.userId }, select: userSelect });
  } else if (target.username) {
    targetUser = await prisma.user.findUnique({
      where: { username: target.username },
      select: userSelect,
    });
  }
  if (!targetUser) throw new NotFoundError('User not found');
  if (targetUser.id === userId) throw new ConflictError('Cannot add yourself as a friend');

  const existing = await getFriendshipBetween(userId, targetUser.id);
  if (existing) {
    if (existing.status === 'ACCEPTED') throw new ConflictError('Already friends');
    if (existing.status === 'PENDING') {
      if (existing.requesterId === userId) throw new ConflictError('Friend request already sent');
      // They sent us a request — auto-accept
      return acceptFriendRequest(userId, existing.id);
    }
    // Previously rejected — allow re-request by updating
    const updated = await prisma.friendship.update({
      where: { id: existing.id },
      data: { requesterId: userId, addresseeId: targetUser.id, status: 'PENDING' },
      include: { addressee: { select: userSelect } },
    });
    const requester = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });
    await createNotification({
      userId: targetUser.id,
      type: 'FRIEND_REQUEST',
      title: 'New friend request',
      body: `${requester.name} sent you a friend request`,
      data: { friendshipId: updated.id, userId },
    });
    return { id: updated.id, user: toPublicUser(updated.addressee), status: 'PENDING_SENT' as const };
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: targetUser.id },
    include: { addressee: { select: userSelect } },
  });

  const requester = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });
  await createNotification({
    userId: targetUser.id,
    type: 'FRIEND_REQUEST',
    title: 'New friend request',
    body: `${requester.name} sent you a friend request`,
    data: { friendshipId: friendship.id, userId },
  });

  return { id: friendship.id, user: toPublicUser(friendship.addressee), status: 'PENDING_SENT' as const };
}

export async function acceptFriendRequest(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new NotFoundError('Friend request not found');
  if (friendship.addresseeId !== userId) throw new ForbiddenError('Not authorized to accept this request');
  if (friendship.status !== 'PENDING') throw new ConflictError('Request is no longer pending');

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'ACCEPTED' },
    include: { requester: { select: userSelect } },
  });

  const accepter = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });
  await createNotification({
    userId: updated.requesterId,
    type: 'FRIEND_ACCEPTED',
    title: 'Friend request accepted',
    body: `${accepter.name} accepted your friend request`,
    data: { friendshipId: updated.id, userId },
  });

  return { id: updated.id, user: toPublicUser(updated.requester), status: 'FRIENDS' as const };
}

export async function rejectFriendRequest(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new NotFoundError('Friend request not found');
  if (friendship.addresseeId !== userId && friendship.requesterId !== userId) {
    throw new ForbiddenError('Not authorized');
  }
  if (friendship.status !== 'PENDING') throw new ConflictError('Request is no longer pending');

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'REJECTED' },
  });
  return { success: true };
}

export async function removeFriend(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new NotFoundError('Friendship not found');
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
    throw new ForbiddenError('Not authorized');
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
  return { success: true };
}

export async function getFriendRelationForUsers(userId: string, otherUserIds: string[]) {
  if (otherUserIds.length === 0) return new Map<string, { status: FriendRelationStatus; friendshipId?: string }>();

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, addresseeId: { in: otherUserIds } },
        { addresseeId: userId, requesterId: { in: otherUserIds } },
      ],
    },
  });

  const map = new Map<string, { status: FriendRelationStatus; friendshipId?: string }>();
  for (const otherId of otherUserIds) {
    const f = friendships.find(
      (x) =>
        (x.requesterId === userId && x.addresseeId === otherId) ||
        (x.requesterId === otherId && x.addresseeId === userId)
    );
    map.set(otherId, relationStatus(userId, f ?? null));
  }
  return map;
}
