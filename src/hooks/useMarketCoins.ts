'use client';

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
  fetchMarketSnapshot,
  marketCacheKey,
  marketCacheOptions,
  marketCacheEntries,
  mergeMarketSnapshots,
  quoteFreshness,
  subscribeToMarketCache,
  type QuoteFreshness,
} from '@/lib/marketCache';
import type { Cryptocurrency } from '@/types';

interface MarketCoins {
  coins: Map<string, Cryptocurrency>;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  updatedAt?: number;
  freshness: QuoteFreshness;
  refresh: () => Promise<unknown>;
}

/**
 * Resolves current market data for the given coin ids so the portfolio, watchlist
 * and alert views stay in sync with live prices. Results are keyed by CoinGecko id.
 */
export function useMarketCoins(ids: readonly string[]): MarketCoins {
  const key = useMemo(() => marketCacheKey(ids), [ids]);
  const { cache } = useSWRConfig();
  const previousSnapshot = useRef<ReturnType<typeof mergeMarketSnapshots>>(undefined);
  const getSnapshot = useCallback(() => {
    const snapshot = mergeMarketSnapshots(ids, marketCacheEntries(cache));
    const previous = previousSnapshot.current;
    if (
      previous &&
      snapshot &&
      previous.updatedAt === snapshot.updatedAt &&
      previous.coins.size === snapshot.coins.size &&
      [...previous.coins].every(([id, coin]) => snapshot.coins.get(id) === coin)
    ) {
      return previous;
    }
    previousSnapshot.current = snapshot;
    return snapshot;
  }, [cache, ids]);
  const cachedData = useSyncExternalStore(subscribeToMarketCache, getSnapshot, () => undefined);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetchMarketSnapshot,
    marketCacheOptions
  );
  const emptyCoins = useMemo(() => new Map<string, Cryptocurrency>(), []);
  const snapshot = cachedData ?? data;

  return {
    coins: snapshot?.coins ?? emptyCoins,
    loading: isLoading,
    refreshing: isValidating,
    error: error instanceof Error ? error.message : error ? 'Failed to load prices' : null,
    updatedAt: snapshot?.updatedAt,
    freshness: quoteFreshness(snapshot?.updatedAt),
    refresh: mutate,
  };
}
