import type { Cryptocurrency } from '@/types';
import { getCryptocurrencies } from './cryptoApi';
import { canonicalMarketQuery, MARKET_REFRESH_MS, QUOTE_STALE_MS } from './marketSchemas';

export interface MarketSnapshot {
  coins: Map<string, Cryptocurrency>;
  updatedAt: number;
}

const snapshots = new Map<string, MarketSnapshot>();
const listeners = new Set<() => void>();

export function marketCacheKey(ids: readonly string[]): string | null {
  if (ids.length === 0) return null;
  return `/api/crypto/coins/markets?${canonicalMarketQuery(ids)}`;
}

export async function fetchMarketSnapshot(key: string): Promise<MarketSnapshot> {
  const url = new URL(key, 'http://cryptoflow.local');
  const ids = url.searchParams.get('ids')?.split(',') ?? [];
  const data = await getCryptocurrencies(ids);
  const previous = snapshots.get(key);
  const coins = new Map(previous?.coins);
  const changed = data.some((coin) => previous?.coins.get(coin.id) !== coin);
  if (previous && !changed) return previous;
  for (const coin of data) coins.set(coin.id, coin);
  const snapshot = { coins, updatedAt: Date.now() };
  snapshots.set(key, snapshot);
  for (const listener of listeners) listener();
  return snapshot;
}

export function mergeMarketSnapshots(
  ids: readonly string[],
  cached: Iterable<readonly [string, MarketSnapshot | undefined]>
): MarketSnapshot | undefined {
  const matches = new Map<string, { coin: Cryptocurrency; updatedAt: number }>();
  let updatedAt = 0;
  let complete = true;
  for (const id of new Set(ids)) {
    let matching: { coin: Cryptocurrency; updatedAt: number } | undefined;
    const entries = [...cached];
    for (const [, snapshot] of entries) {
      const coin = snapshot?.coins.get(id);
      if (coin && (!matching || snapshot!.updatedAt > matching.updatedAt)) {
        matching = { coin, updatedAt: snapshot!.updatedAt };
      }
    }
    if (!matching) {
      complete = false;
      continue;
    }
    matches.set(id, matching);
    updatedAt = updatedAt === 0 ? matching.updatedAt : Math.min(updatedAt, matching.updatedAt);
  }
  if (!complete || updatedAt === 0) return undefined;
  const merged = { coins: new Map([...matches].map(([id, match]) => [id, match.coin])), updatedAt };
  for (const [key, snapshot] of cached) {
    if (
      snapshot &&
      snapshot.updatedAt === updatedAt &&
      [...matches].every(([id, match]) => snapshot.coins.get(id) === match.coin)
    ) {
      return snapshots.get(key) ?? snapshot;
    }
  }
  return merged;
}

export type QuoteFreshness = 'live' | 'stale' | 'unavailable';

export function subscribeToMarketCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function marketCacheEntries(cache: {
  keys(): IterableIterator<string>;
  get(key: string): { data?: MarketSnapshot } | undefined;
}): Array<[string, MarketSnapshot | undefined]> {
  return [...cache.keys()]
    .filter((key) => key.startsWith('/api/crypto/coins/markets?'))
    .map((key) => [key, cache.get(key)?.data]);
}

export function quoteFreshness(updatedAt: number | undefined, now = Date.now()): QuoteFreshness {
  if (!updatedAt) return 'unavailable';
  return now - updatedAt <= QUOTE_STALE_MS ? 'live' : 'stale';
}

export const marketCacheOptions = {
  refreshInterval: MARKET_REFRESH_MS,
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5_000,
  keepPreviousData: true,
  errorRetryInterval: 5_000,
  errorRetryCount: 4,
};
