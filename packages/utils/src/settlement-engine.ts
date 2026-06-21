import { roundCurrency } from './format-currency';

export type Balance = { userId: string; net: number };

export type SettlementSuggestion = { payerId: string; payeeId: string; amount: number };

const EPSILON = 0.01;

export function computeSettlements(balances: Balance[]): SettlementSuggestion[] {
  const creditors: Array<{ userId: string; amount: number }> = [];
  const debtors: Array<{ userId: string; amount: number }> = [];

  for (const balance of balances) {
    const net = roundCurrency(balance.net);
    if (net > EPSILON) creditors.push({ userId: balance.userId, amount: net });
    else if (net < -EPSILON) debtors.push({ userId: balance.userId, amount: -net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementSuggestion[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = roundCurrency(Math.min(creditors[ci].amount, debtors[di].amount));
    if (transfer > EPSILON) {
      settlements.push({
        payerId: debtors[di].userId,
        payeeId: creditors[ci].userId,
        amount: transfer,
      });
    }
    creditors[ci].amount = roundCurrency(creditors[ci].amount - transfer);
    debtors[di].amount = roundCurrency(debtors[di].amount - transfer);
    if (creditors[ci].amount <= EPSILON) ci++;
    if (debtors[di].amount <= EPSILON) di++;
  }

  return settlements;
}
