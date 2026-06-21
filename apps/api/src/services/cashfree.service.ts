import { prisma } from '@settl/database';
import { SubscriptionTier } from '@settl/types';
import { env } from '../config/env.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { getUserPlanLimits, decimalToNumber } from './subscription.service.js';

export async function listPlans() {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
  return plans.map((p) => ({
    ...p,
    priceMonthly: decimalToNumber(p.priceMonthly),
    priceYearly: decimalToNumber(p.priceYearly),
  }));
}

export async function getCurrentSubscription(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({ where: { userId } });
  const planLimits = await getUserPlanLimits(userId);
  return { subscription, plan: planLimits };
}

export async function createCheckoutSession(userId: string, tier: SubscriptionTier, billing: 'monthly' | 'yearly') {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { tier } });
  if (!plan) throw new NotFoundError('Plan not found');
  if (tier === 'FREE') throw new AppError('Cannot checkout for free tier', 400);

  if (!env.cashfree.appId || !env.cashfree.secretKey) {
    return {
      mode: 'sandbox_stub',
      message: 'Cashfree credentials not configured. Use this stub to simulate upgrade in development.',
      checkoutUrl: `${env.clientUrl}/pricing?upgrade=${tier}&billing=${billing}`,
      orderId: `stub_${userId}_${Date.now()}`,
      amount: billing === 'monthly' ? decimalToNumber(plan.priceMonthly) : decimalToNumber(plan.priceYearly),
    };
  }

  const amount = billing === 'monthly' ? decimalToNumber(plan.priceMonthly) : decimalToNumber(plan.priceYearly);
  const orderId = `settl_${userId}_${Date.now()}`;

  return {
    mode: env.cashfree.env,
    checkoutUrl: `https://${env.cashfree.env === 'production' ? 'api' : 'sandbox'}.cashfree.com/pg/orders/${orderId}`,
    orderId,
    amount,
    planId: plan.id,
    tier,
    billing,
  };
}

export async function handleWebhook(payload: {
  orderId?: string;
  subscriptionId?: string;
  customerId?: string;
  status?: string;
  tier?: SubscriptionTier;
}) {
  if (!payload.orderId || !payload.tier) {
    throw new AppError('Invalid webhook payload', 400);
  }

  const userIdMatch = payload.orderId.match(/^settl_([^_]+)_/);
  if (!userIdMatch) return { received: true, processed: false };

  const userId = userIdMatch[1];
  const plan = await prisma.subscriptionPlan.findUnique({ where: { tier: payload.tier } });
  if (!plan) throw new NotFoundError('Plan not found');

  if (payload.status === 'ACTIVE' || payload.status === 'PAID') {
    await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        cashfreeOrderId: payload.orderId,
        cashfreeSubscriptionId: payload.subscriptionId,
        cashfreeCustomerId: payload.customerId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        cashfreeOrderId: payload.orderId,
        cashfreeSubscriptionId: payload.subscriptionId,
        cashfreeCustomerId: payload.customerId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return { received: true, processed: true };
}

export async function simulateUpgrade(userId: string, tier: SubscriptionTier) {
  if (env.nodeEnv === 'production') {
    throw new AppError('Simulate upgrade is disabled in production', 403);
  }
  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { tier } });
  await prisma.userSubscription.upsert({
    where: { userId },
    update: { planId: plan.id, status: 'ACTIVE' },
    create: { userId, planId: plan.id, status: 'ACTIVE' },
  });
  return getUserPlanLimits(userId);
}
