import { SubscriptionTier } from '@settl/types';

export class SubscriptionLimitError extends Error {
  constructor(
    message: string,
    public upgradeRequired = true,
    public requiredTier: SubscriptionTier = 'PRO'
  ) {
    super(message);
    this.name = 'SubscriptionLimitError';
  }
}

export type PlanLimits = {
  tier: SubscriptionTier;
  maxTrips: number;
  maxMembersPerTrip: number;
  canScanReceipts: boolean;
  canExport: boolean;
  canCustomSplit: boolean;
  canCurrencyConvert: boolean;
  canAISettle: boolean;
};

export type PremiumFeature =
  | 'scanReceipts'
  | 'export'
  | 'customSplit'
  | 'currencyConvert'
  | 'aiSettle';

const FEATURE_MAP: Record<PremiumFeature, keyof PlanLimits> = {
  scanReceipts: 'canScanReceipts',
  export: 'canExport',
  customSplit: 'canCustomSplit',
  currencyConvert: 'canCurrencyConvert',
  aiSettle: 'canAISettle',
};

const FEATURE_TIER: Record<PremiumFeature, SubscriptionTier> = {
  scanReceipts: 'PRO',
  export: 'PRO',
  customSplit: 'PRO',
  currencyConvert: 'PRO',
  aiSettle: 'PREMIUM',
};

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}

export function assertTripLimit(currentTripCount: number, plan: PlanLimits): void {
  if (isUnlimited(plan.maxTrips)) return;
  if (currentTripCount >= plan.maxTrips) {
    throw new SubscriptionLimitError(
      `You've reached your trip limit (${plan.maxTrips}). Upgrade to create more trips.`,
      true,
      'PRO'
    );
  }
}

export function assertMemberLimit(currentMemberCount: number, plan: PlanLimits): void {
  if (isUnlimited(plan.maxMembersPerTrip)) return;
  if (currentMemberCount >= plan.maxMembersPerTrip) {
    throw new SubscriptionLimitError(
      `This trip has reached the member limit (${plan.maxMembersPerTrip}). Upgrade to add more members.`,
      true,
      'PRO'
    );
  }
}

export function assertFeature(plan: PlanLimits, feature: PremiumFeature): void {
  const key = FEATURE_MAP[feature];
  if (!plan[key]) {
    throw new SubscriptionLimitError(
      `This feature requires a ${FEATURE_TIER[feature]} subscription.`,
      true,
      FEATURE_TIER[feature]
    );
  }
}
