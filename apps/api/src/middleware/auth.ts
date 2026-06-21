import { Request, Response, NextFunction } from 'express';
import { prisma } from '@settl/database';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { isTokenBlacklisted } from '../lib/redis.js';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    const token = header.slice(7);
    if (await isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Token has been revoked');
    }
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedError('User not found');
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (user.role !== 'ADMIN') {
    next(new UnauthorizedError('Admin access required'));
    return;
  }
  next();
}
