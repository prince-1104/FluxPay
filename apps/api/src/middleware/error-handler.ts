import { Request, Response, NextFunction } from 'express';
import { AppError, mapError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const error = mapError(err);
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  if (env.nodeEnv !== 'production' && statusCode >= 500) {
    console.error('[API Error]', err);
  }

  res.status(statusCode).json({
    error: error.message,
    code: error.code,
    ...(error.meta ?? {}),
    ...(env.nodeEnv !== 'production' && statusCode >= 500 ? { stack: error.stack } : {}),
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
}
