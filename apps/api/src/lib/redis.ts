import Redis from 'ioredis';
import { env } from '../config/env.js';

let redis: Redis | null = null;
let redisEnabled = false;

function createRedisClient(): Redis {
  const useTls = env.redisUrl.startsWith('rediss://');
  return new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    ...(useTls ? { tls: {} } : {}),
  });
}

export async function initRedis(): Promise<boolean> {
  if (redisEnabled) return true;

  const client = createRedisClient();
  client.on('error', () => {
    // Handled via connect() catch — avoid unhandled error spam
  });

  try {
    await client.connect();
    await client.ping();
    redis = client;
    redisEnabled = true;
    return true;
  } catch {
    client.disconnect();
    redis = null;
    redisEnabled = false;
    return false;
  }
}

export function isRedisEnabled(): boolean {
  return redisEnabled;
}

export async function blacklistToken(token: string, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  await redis.setex(`blacklist:${token}`, ttlSeconds, '1');
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redis) return false;
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}
