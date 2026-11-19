import { describe, expect, it } from 'vitest';
import { marketCacheKey, mergeMarketSnapshots, quoteFreshness } from './marketCache';
import { QUOTE_STALE_MS } from './marketSchemas';
import type { Cryptocurrency } from '@/types';

function quote(id: string): Cryptocurrency {
  return {
    id,
    name: id,
    symbol: id,
    current_price: 100,
    market_cap: 0,
    market_cap_rank: 0,
    total_volume: 0,
    high_24h: 100,
    low_24h: 100,
    price_change_percentage_24h: 0,
    circulating_supply: 0,
    image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  };
}

describe('shared market cache', () => {
  it('uses one canonical key regardless of id order or duplicates', () => {
    expect(marketCacheKey(['ethereum', 'bitcoin', 'bitcoin'])).toBe(marketCacheKey(['bitcoin', 'ethereum']));
    expect(marketCacheKey([])).toBeNull();
  });

  it('merges cached quote sets and exposes the oldest update boundary', () => {
    const first = { coins: new Map([['bitcoin', quote('bitcoin')]]), updatedAt: 100 };
    const second = { coins: new Map([['ethereum', quote('ethereum')]]), updatedAt: 200 };
    const cache = new Map([['first', first], ['second', second]]);
    expect(mergeMarketSnapshots(['bitcoin', 'ethereum'], cache)?.updatedAt).toBe(100);
    expect(mergeMarketSnapshots(['missing'], cache)).toBeUndefined();
  });

  it('distinguishes live, stale, and unavailable quotes', () => {
    expect(quoteFreshness(undefined, 1_000)).toBe('unavailable');
    expect(quoteFreshness(1_000, 1_000 + QUOTE_STALE_MS)).toBe('live');
    expect(quoteFreshness(1_000, 1_000 + QUOTE_STALE_MS + 1)).toBe('stale');
  });
});
