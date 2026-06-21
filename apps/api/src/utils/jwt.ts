import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export type TokenPayload = {
  sub: string;
  email: string;
  role: string;
};

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
}

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function getRefreshTokenExpiry(): Date {
  const match = env.jwt.refreshExpires.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(Date.now() + value * (multipliers[unit] ?? 86400000));
}

export function getTokenTtlSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 86400;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 };
  return value * (multipliers[unit] ?? 86400);
}
