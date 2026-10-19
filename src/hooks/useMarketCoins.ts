'use client';

import { useEffect, useState } from 'react';
import { getCryptocurrencies } from '@/lib/cryptoApi';
import type { Cryptocurrency } from '@/types';

interface MarketCoins {
  coins: Map<string, Cryptocurrency>;
  loading: boolean;
  error: string | null;
}

/**
 * Resolves current market data for the given coin ids so the portfolio, watchlist
 * and alert views stay in sync with live prices. Results are keyed by CoinGecko id.
 */
export function useMarketCoins(ids: readonly string[]): MarketCoins {
  const [coins, setCoins] = useState<Map<string, Cryptocurrency>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = ids.join(',');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (key === '') {
        setCoins(new Map());
        setLoading(false);
        return;
      }

      try {
        const data = await getCryptocurrencies(key.split(','), 'usd', controller.signal);
        if (cancelled) return;
        setCoins(new Map(data.map((coin) => [coin.id, coin])));
        setError(null);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load prices');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return { coins, loading, error };
}
