import { SubscriptionLimitError, SplitValidationError } from '@settl/utils';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
    public meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export function mapError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof SubscriptionLimitError) {
    return new AppError(error.message, 403, 'SUBSCRIPTION_LIMIT', {
      upgradeRequired: error.upgradeRequired,
      requiredTier: error.requiredTier,
    });
  }
  if (error instanceof SplitValidationError) {
    return new ValidationError(error.message);
  }
  if (error instanceof Error) {
    return new AppError(error.message);
  }
  return new AppError('An unexpected error occurred');
}
