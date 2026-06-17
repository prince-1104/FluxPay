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

/**
 * Asserts whether a user is within their active trip creation limit.
 * // TODO: Implement subscription guard
 */
export async function assertTripLimit(userId: string): Promise<void> {
  // TODO: Implement trip limit check
}

/**
 * Asserts whether a trip is within the member counts allowed by owner's tier.
 * // TODO: Implement subscription guard
 */
export async function assertMemberLimit(userId: string, tripId: string): Promise<void> {
  // TODO: Implement member limit check
}

/**
 * Asserts whether the user has access to a specific premium feature.
 * // TODO: Implement subscription guard
 */
export async function assertFeature(userId: string, feature: string): Promise<void> {
  // TODO: Implement feature check
}
