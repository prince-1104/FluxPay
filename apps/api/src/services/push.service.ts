import { env } from '../config/env.js';

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: boolean; mode: string }> {
  if (!env.firebaseServiceAccount) {
    console.log(`[Push Stub] ${title}: ${body}`, data);
    return { sent: false, mode: 'stub' };
  }

  try {
    const serviceAccount = JSON.parse(env.firebaseServiceAccount) as {
      project_id: string;
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getFirebaseAccessToken()}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            data: data
              ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
              : undefined,
          },
        }),
      }
    );

    return { sent: response.ok, mode: 'firebase' };
  } catch {
    return { sent: false, mode: 'error' };
  }
}

async function getFirebaseAccessToken(): Promise<string> {
  // In production, use google-auth-library with service account JWT.
  // Stub returns empty — configure FIREBASE_SERVICE_ACCOUNT_JSON for real push.
  return '';
}

export async function registerFcmToken(userId: string, fcmToken: string) {
  const { prisma } = await import('@settl/database');
  await prisma.user.update({ where: { id: userId }, data: { fcmToken } });
  return { success: true };
}
