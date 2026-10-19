import { describe, expect, it } from 'vitest';
import {
  formatCompactCurrency,
  formatPercent,
  formatPrice,
  formatQuantity,
  formatSignedPrice,
  trendBgClass,
  trendClass,
} from './format';

describe('formatPrice', () => {
  it('formats whole dollars with two decimals', () => {
    expect(formatPrice(82619)).toBe('$82,619.00');
  });

  it('keeps precision for sub-cent coins instead of rounding to $0.00', () => {
    expect(formatPrice(0.00001234)).toBe('$0.000012');
  });

  it('formats exact cents without extra precision', () => {
    expect(formatPrice(0.22)).toBe('$0.22');
  });

  it('returns a placeholder for non-finite input', () => {
    expect(formatPrice(Number.NaN)).toBe('—');
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatCompactCurrency', () => {
  it('abbreviates trillions and billions', () => {
    expect(formatCompactCurrency(1_661_031_779_532)).toBe('$1.66T');
    expect(formatCompactCurrency(296_426_911_092)).toBe('$296.43B');
  });

  it('returns a placeholder for non-finite input', () => {
    expect(formatCompactCurrency(Number.NaN)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('adds a plus sign for gains', () => {
    expect(formatPercent(1.234)).toBe('+1.23%');
  });

  it('keeps the minus sign for losses', () => {
    expect(formatPercent(-2.5)).toBe('-2.50%');
  });

  it('does not sign zero', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });
});

describe('formatSignedPrice', () => {
  it('prefixes positive and negative amounts', () => {
    expect(formatSignedPrice(21_323.5)).toBe('+$21,323.50');
    expect(formatSignedPrice(-500)).toBe('-$500.00');
    expect(formatSignedPrice(0)).toBe('$0.00');
  });
});

describe('formatQuantity', () => {
  it('trims trailing zeros', () => {
    expect(formatQuantity(0.5)).toBe('0.5');
    expect(formatQuantity(5)).toBe('5');
  });
});

describe('trend helpers', () => {
  it('maps gains, losses and flat values to distinct classes', () => {
    expect(trendClass(1)).toBe('text-emerald-400');
    expect(trendClass(-1)).toBe('text-rose-400');
    expect(trendClass(0)).toBe('text-slate-400');
    expect(trendBgClass(1)).toBe('bg-emerald-500/10');
    expect(trendBgClass(-1)).toBe('bg-rose-500/10');
    expect(trendBgClass(0)).toBe('bg-slate-500/10');
  });
});
