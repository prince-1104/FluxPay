import { prisma } from '@settl/database';
import type { UserSearchResult } from '@settl/types';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { getMe } from './auth.service.js';
import { getFriendRelationForUsers } from './friend.service.js';

const userSelect = { id: true, name: true, username: true, avatarUrl: true } as const;

export async function searchUsers(userId: string, query: string): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      NOT: { id: userId },
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: userSelect,
    take: 20,
    orderBy: [{ username: 'asc' }],
  });

  const relationMap = await getFriendRelationForUsers(
    userId,
    users.map((u) => u.id)
  );

  return users.map((user) => {
    const rel = relationMap.get(user.id) ?? { status: 'NONE' as const };
    return {
      ...user,
      friendshipStatus: rel.status,
      friendshipId: rel.friendshipId,
    };
  });
}

export async function updateProfile(
  userId: string,
  data: { name?: string; username?: string; avatarUrl?: string | null; phone?: string | null }
) {
  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: userId } },
    });
    if (existing) throw new ConflictError('Username already taken');
  }

  if (data.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone, NOT: { id: userId } },
    });
    if (existing) throw new ConflictError('Phone number already in use');
  }

  await prisma.user.update({ where: { id: userId }, data });
  return getMe(userId);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, avatarUrl: true, email: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
