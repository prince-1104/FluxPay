import { SplitType } from '@settl/types';
import { roundCurrency } from './format-currency';

export type SplitInput = {
  userId: string;
  splitType: SplitType;
  amount?: number;
  percentage?: number;
};

export type ResolvedSplit = {
  userId: string;
  splitType: SplitType;
  amount: number;
  percentage?: number;
};

export class SplitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SplitValidationError';
  }
}

export function resolveSplits(totalAmount: number, splits: SplitInput[]): ResolvedSplit[] {
  if (totalAmount <= 0) {
    throw new SplitValidationError('Total amount must be greater than zero');
  }
  if (splits.length === 0) {
    throw new SplitValidationError('At least one split is required');
  }

  const total = roundCurrency(totalAmount);
  const participants = splits.filter((s) => s.splitType !== 'EXCLUDE');

  if (participants.length === 0) {
    throw new SplitValidationError('At least one participant must be included in the split');
  }

  const resolved: ResolvedSplit[] = [];

  for (const split of splits) {
    if (split.splitType === 'EXCLUDE') {
      resolved.push({ userId: split.userId, splitType: 'EXCLUDE', amount: 0 });
    }
  }

  const exactSplits = participants.filter((s) => s.splitType === 'EXACT');
  const percentageSplits = participants.filter((s) => s.splitType === 'PERCENTAGE');
  const equalSplits = participants.filter((s) => s.splitType === 'EQUAL');

  if (exactSplits.length > 0) {
    let exactTotal = 0;
    for (const split of exactSplits) {
      const amount = roundCurrency(split.amount ?? 0);
      if (amount < 0) throw new SplitValidationError('Exact split amounts cannot be negative');
      exactTotal += amount;
      resolved.push({ userId: split.userId, splitType: 'EXACT', amount });
    }
    if (roundCurrency(exactTotal) !== total) {
      throw new SplitValidationError(`Exact splits must sum to ${total}, got ${roundCurrency(exactTotal)}`);
    }
    return resolved;
  }

  if (percentageSplits.length > 0) {
    let pctTotal = 0;
    for (const split of percentageSplits) {
      const pct = split.percentage ?? 0;
      if (pct < 0 || pct > 100) throw new SplitValidationError('Percentage must be between 0 and 100');
      pctTotal += pct;
    }
    if (roundCurrency(pctTotal) !== 100) {
      throw new SplitValidationError(`Percentages must sum to 100, got ${roundCurrency(pctTotal)}`);
    }
    for (const split of percentageSplits) {
      const amount = roundCurrency(total * ((split.percentage ?? 0) / 100));
      resolved.push({
        userId: split.userId,
        splitType: 'PERCENTAGE',
        amount,
        percentage: split.percentage,
      });
    }
    adjustRoundingDrift(resolved, total);
    return resolved;
  }

  const count = equalSplits.length || participants.length;
  const targetParticipants = equalSplits.length > 0 ? equalSplits : participants;
  const baseShare = roundCurrency(total / count);
  let assigned = 0;

  for (let i = 0; i < targetParticipants.length; i++) {
    const split = targetParticipants[i];
    const isLast = i === targetParticipants.length - 1;
    const amount = isLast ? roundCurrency(total - assigned) : baseShare;
    assigned += amount;
    resolved.push({ userId: split.userId, splitType: 'EQUAL', amount });
  }

  return resolved;
}

function adjustRoundingDrift(resolved: ResolvedSplit[], total: number): void {
  const sum = roundCurrency(resolved.reduce((acc, s) => acc + s.amount, 0));
  const drift = roundCurrency(total - sum);
  if (drift !== 0 && resolved.length > 0) {
    resolved[resolved.length - 1].amount = roundCurrency(resolved[resolved.length - 1].amount + drift);
  }
}
