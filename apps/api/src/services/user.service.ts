import { prisma } from '@settl/database';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { getMe } from './auth.service.js';

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
