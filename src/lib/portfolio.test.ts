import { describe, expect, it } from 'vitest';
import { computeAllocation, computeRows, computeStats } from './portfolio';
import type { PortfolioHolding } from '@/types';

const HOLDINGS: PortfolioHolding[] = [
  { id: 'a', cryptoId: 'bitcoin', quantity: 0.5, purchasePrice: 40000 },
  { id: 'b', cryptoId: 'ethereum', quantity: 5, purchasePrice: 2000 },
];

describe('computeRows', () => {
  it('values holdings at live prices and computes gain', () => {
    const rows = computeRows(HOLDINGS, new Map([['bitcoin', 80000], ['ethereum', 2500]]));
    expect(rows[0].value).toBe(40000);
    expect(rows[0].gainLoss).toBe(20000);
    expect(rows[0].gainLossPercent).toBe(100);
    expect(rows[1].gainLoss).toBe(2500);
  });

  it('falls back to the purchase price when no quote is available', () => {
    const rows = computeRows(HOLDINGS, new Map());
    expect(rows[0].currentPrice).toBe(40000);
    expect(rows[0].gainLoss).toBe(0);
  });

  it('does not mutate the input order', () => {
    const holdings = [...HOLDINGS];
    computeAllocation(computeRows(holdings, new Map()), 1);
    expect(holdings.map((holding) => holding.id)).toEqual(['a', 'b']);
  });
});

describe('computeStats', () => {
  it('aggregates totals across holdings', () => {
    const stats = computeStats(computeRows(HOLDINGS, new Map([['bitcoin', 80000], ['ethereum', 2500]])));
    expect(stats.totalInvestment).toBe(30000);
    expect(stats.currentValue).toBe(52500);
    expect(stats.totalReturn).toBe(22500);
    expect(stats.returnPercentage).toBeCloseTo(75);
  });

  it('never divides by zero on an empty portfolio', () => {
    const stats = computeStats([]);
    expect(stats.totalInvestment).toBe(0);
    expect(stats.returnPercentage).toBe(0);
  });
});

describe('computeAllocation', () => {
  it('sorts by value and reports each share', () => {
    const rows = computeRows(HOLDINGS, new Map([['bitcoin', 80000], ['ethereum', 2500]]));
    const allocation = computeAllocation(rows, 52500);
    expect(allocation[0].cryptoId).toBe('bitcoin');
    expect(allocation[0].share).toBeCloseTo(76.19, 1);
    expect(allocation[1].share).toBeCloseTo(23.81, 1);
  });

  it('returns zero shares when the portfolio is empty', () => {
    expect(computeAllocation([], 0)).toEqual([]);
  });
});
