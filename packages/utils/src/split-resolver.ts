import { SplitType } from '@settl/types';

export type SplitInput = {
  userId: string;
  splitType: SplitType;
  amount?: number;
  percentage?: number;
};

export type ResolvedSplit = {
  userId: string;
  splitType: string;
  amount: number;
  percentage?: number;
};

/**
 * Resolves split amounts to ensure total split amount matches the total expense amount.
 * // TODO: Implement split resolver
 */
export function resolveSplits(totalAmount: number, splits: SplitInput[]): ResolvedSplit[] {
  return [];
}
