import { prisma, Prisma } from '@settl/database';
import { NotifType } from '@settl/types';
import { sendPushNotification } from './push.service.js';

export async function createNotification(input: {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data as Prisma.InputJsonValue | undefined,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { fcmToken: true },
  });

  if (user?.fcmToken) {
    await sendPushNotification(user.fcmToken, input.title, input.body, input.data);
  }

  return notification;
}

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) return null;
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, readAt: null },
  });
  return { count };
}
