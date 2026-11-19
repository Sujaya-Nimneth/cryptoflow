import { describe, expect, it } from 'vitest';
import { candleGeometry, candleGranularity, chartTickLabel } from './chart';

const candles = [
  { timestamp: 100, open: 10, high: 15, low: 5, close: 12, volume: 0 },
  { timestamp: 200, open: 12, high: 14, low: 8, close: 9, volume: 0 },
];

describe('candlestick geometry', () => {
  it('shares exact x coordinates between each body and wick', () => {
    const geometry = candleGeometry(candles);
    expect(geometry.bodies.map((point) => point.x)).toEqual(geometry.wicks.map((point) => point.x));
    expect(geometry.bodies[0].y).toEqual([10, 12]);
    expect(geometry.wicks[0].y).toEqual([5, 15]);
  });

  it('discloses CoinGecko automatic granularity', () => {
    expect(candleGranularity('1')).toBe('30-minute candles');
    expect(candleGranularity('7')).toBe('4-hour candles');
    expect(candleGranularity('30')).toBe('4-hour candles');
    expect(candleGranularity('90')).toBe('4-day candles');
    expect(candleGranularity('365')).toBe('4-day candles');
  });

  it('formats intraday and long-range ticks differently', () => {
    const timestamp = Date.UTC(2026, 0, 15, 12);
    expect(chartTickLabel(timestamp, '1')).toMatch(/\d{2}:\d{2}/);
    expect(chartTickLabel(timestamp, '365')).toContain('26');
  });
});
