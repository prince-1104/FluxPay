import { prisma } from '@settl/database';
import { AuthTokens, AuthUser } from '@settl/types';
import {
  generateRefreshTokenValue,
  getRefreshTokenExpiry,
  signAccessToken,
  getTokenTtlSeconds,
} from '../utils/jwt.js';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../utils/password.js';
import { sanitizeUser } from '../utils/serializers.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { blacklistToken } from '../lib/redis.js';

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isVerified: user.isVerified,
  };
}

function buildTokens(user: { id: string; email: string; role: string }, refreshToken: string): AuthTokens {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken,
    expiresIn: env.jwt.accessExpires,
  };
}

async function createSession(userId: string) {
  const refreshToken = generateRefreshTokenValue();
  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });
  return refreshToken;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  try {
    validatePasswordStrength(input.password);
  } catch (e) {
    throw new ValidationError((e as Error).message);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    throw new ConflictError(
      existing.email === input.email ? 'Email already registered' : 'Username already taken'
    );
  }

  const passwordHash = await hashPassword(input.password);
  const freePlan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { tier: 'FREE' } });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      username: input.username,
      passwordHash,
      isVerified: true,
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'ACTIVE',
        },
      },
    },
  });

  const refreshToken = await createSession(user.id);

  return {
    user: toAuthUser(user),
    tokens: buildTokens(user, refreshToken),
  };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user?.passwordHash) throw new UnauthorizedError('Invalid email or password');

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const refreshToken = await createSession(user.id);

  return {
    user: toAuthUser(user),
    tokens: buildTokens(user, refreshToken),
  };
}

export async function refresh(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw new UnauthorizedError('User not found');

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const newRefreshToken = await createSession(user.id);

  return {
    user: toAuthUser(user),
    tokens: buildTokens(user, newRefreshToken),
  };
}

export async function logout(userId: string, accessToken?: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  if (accessToken) {
    await blacklistToken(accessToken, getTokenTtlSeconds(env.jwt.accessExpires));
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('User not found');
  return toAuthUser(user);
}

export { sanitizeUser };
