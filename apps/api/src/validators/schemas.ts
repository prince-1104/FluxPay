import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().min(10).max(15).nullable().optional(),
});

export const createTripSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).default('INR'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  coverImage: z.string().url().optional(),
});

export const updateTripSchema = createTripSchema.partial().extend({
  status: z.enum(['PLANNING', 'ACTIVE', 'SETTLING', 'SETTLED', 'ARCHIVED']).optional(),
});

export const joinTripSchema = z.object({
  inviteCode: z.string().min(1),
  displayName: z.string().max(50).optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  totalAmount: z.number().positive(),
  category: z.enum(['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ACTIVITY', 'SHOPPING', 'UTILITIES', 'OTHER']).default('OTHER'),
  expenseDate: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
  paidByUserId: z.string().uuid().optional(),
  splits: z.array(z.object({
    userId: z.string().uuid(),
    splitType: z.enum(['EQUAL', 'PERCENTAGE', 'EXACT', 'EXCLUDE']).default('EQUAL'),
    amount: z.number().nonnegative().optional(),
    percentage: z.number().min(0).max(100).optional(),
  })).min(1),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createSettlementSchema = z.object({
  payerId: z.string().uuid(),
  payeeId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.string().max(50).optional(),
});

export const updateSettlementSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'REJECTED']),
  method: z.string().max(50).optional(),
  txnRef: z.string().max(100).optional(),
});

export const preContributionSchema = z.object({
  toUserId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid(),
});
