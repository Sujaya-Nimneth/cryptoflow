'use client';

import { useEffect, useState } from 'react';
import { getCryptocurrencies } from '@/lib/cryptoApi';

interface MarketPrices {
  prices: Map<string, number>;
  loading: boolean;
  error: string | null;
}

/**
 * Resolves current USD prices for the given coin ids so the portfolio and alert
 * views stay in sync with the market. Prices are keyed by CoinGecko coin id.
 */
export function useMarketPrices(ids: readonly string[]): MarketPrices {
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = ids.join(',');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (key === '') {
        setPrices(new Map());
        setLoading(false);
        return;
      }

      try {
        const data = await getCryptocurrencies(key.split(','), 'usd', controller.signal);
        if (cancelled) return;
        setPrices(new Map(data.map((coin) => [coin.id, coin.current_price])));
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

  return { prices, loading, error };
}
