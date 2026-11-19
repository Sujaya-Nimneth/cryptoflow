import { describe, expect, it } from 'vitest';
import { computeAllocation, computeRows, computeStats } from './portfolio';
import type { PortfolioHolding } from '@/types';
import type { PortfolioQuote } from './portfolio';

const HOLDINGS: PortfolioHolding[] = [
  { id: 'a', cryptoId: 'bitcoin', quantity: 0.5, purchasePrice: 40000 },
  { id: 'b', cryptoId: 'ethereum', quantity: 5, purchasePrice: 2000 },
];

const QUOTES = new Map<string, PortfolioQuote>([
  ['bitcoin', { price: 80000, freshness: 'live', updatedAt: 100 }],
  ['ethereum', { price: 2500, freshness: 'live', updatedAt: 100 }],
]);

describe('computeRows', () => {
  it('values holdings at live prices and computes gain', () => {
    const rows = computeRows(HOLDINGS, QUOTES);
    expect(rows[0].value).toBe(40000);
    expect(rows[0].gainLoss).toBe(20000);
    expect(rows[0].gainLossPercent).toBe(100);
    expect(rows[1].gainLoss).toBe(2500);
  });

  it('never substitutes purchase price for an unavailable quote', () => {
    const rows = computeRows(HOLDINGS, new Map());
    expect(rows[0].currentPrice).toBeUndefined();
    expect(rows[0].value).toBeUndefined();
    expect(rows[0].gainLoss).toBeUndefined();
    expect(rows[0].quoteStatus).toBe('unavailable');
  });

  it('does not mutate the input order', () => {
    const holdings = [...HOLDINGS];
    computeAllocation(computeRows(holdings, QUOTES), 52500);
    expect(holdings.map((holding) => holding.id)).toEqual(['a', 'b']);
  });
});

describe('computeStats', () => {
  it('aggregates totals across holdings', () => {
    const stats = computeStats(computeRows(HOLDINGS, QUOTES));
    expect(stats.totalInvestment).toBe(30000);
    expect(stats.currentValue).toBe(52500);
    expect(stats.totalReturn).toBe(22500);
    expect(stats.returnPercentage).toBeCloseTo(75);
    expect(stats.complete).toBe(true);
    expect(stats.missingHoldings).toBe(0);
  });

  it('reports partial value without fabricating a total return', () => {
    const stats = computeStats(computeRows(HOLDINGS, new Map([['bitcoin', QUOTES.get('bitcoin')!]])));
    expect(stats.partialValue).toBe(40000);
    expect(stats.currentValue).toBeUndefined();
    expect(stats.totalReturn).toBeUndefined();
    expect(stats.returnPercentage).toBeUndefined();
    expect(stats.missingHoldings).toBe(1);
    expect(stats.complete).toBe(false);
  });

  it('keeps stale quotes visible and counts them', () => {
    const quotes = new Map(QUOTES);
    quotes.set('bitcoin', { price: 80000, freshness: 'stale', updatedAt: 50 });
    const stats = computeStats(computeRows(HOLDINGS, quotes));
    expect(stats.staleHoldings).toBe(1);
    expect(stats.complete).toBe(true);
  });

  it('never divides by zero on an empty portfolio', () => {
    const stats = computeStats([]);
    expect(stats.totalInvestment).toBe(0);
    expect(stats.returnPercentage).toBeUndefined();
  });
});

describe('computeAllocation', () => {
  it('sorts by value and reports each share', () => {
    const rows = computeRows(HOLDINGS, QUOTES);
    const allocation = computeAllocation(rows, 52500);
    expect(allocation[0].cryptoId).toBe('bitcoin');
    expect(allocation[0].share).toBeCloseTo(76.19, 1);
    expect(allocation[1].share).toBeCloseTo(23.81, 1);
  });

  it('returns zero shares when the portfolio is empty', () => {
    expect(computeAllocation([], 0)).toEqual([]);
  });
});
