'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { getCryptocurrencies } from '@/lib/cryptoApi';
import type { Cryptocurrency } from '@/types';
import PriceCard from './PriceCard';
import { Button, IconButton } from './ui/Button';

const REFRESH_MS = 30_000;

interface LivePriceTrackerProps {
  onPricesLoaded?: (cryptos: Cryptocurrency[]) => void;
}

export default function LivePriceTracker({ onPricesLoaded }: LivePriceTrackerProps) {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef<AbortController | null>(null);
  const onLoadedRef = useRef(onPricesLoaded);

  useEffect(() => {
    onLoadedRef.current = onPricesLoaded;
  }, [onPricesLoaded]);

  const load = useCallback(
    async (isBackgroundRefresh: boolean) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      if (!isBackgroundRefresh) setRefreshing(true);

      try {
        const data = await getCryptocurrencies(undefined, 'usd', controller.signal);
        if (controller.signal.aborted) return;
        setCryptos(data);
        setError(null);
        onLoadedRef.current?.(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch cryptocurrency prices');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const initial = window.setTimeout(() => load(false), 0);

    // Pause polling while the tab is hidden to avoid burning the free API quota.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, REFRESH_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      requestRef.current?.abort();
    };
  }, [load]);

  if (loading) {
    return (
      <section aria-label="Live price tracking" aria-busy="true" className="space-y-4">
        <SkeletonHeader />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-800/70" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Live price tracking" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live price tracking</h2>
          <p className="text-sm text-slate-400">Auto-refreshes every 30 seconds</p>
        </div>
        <IconButton
          label="Refresh prices now"
          onClick={() => load(false)}
          disabled={refreshing}
          variant="secondary"
        >
          <FiRefreshCw
            className={refreshing ? 'animate-spin motion-reduce:animate-none' : ''}
            size={18}
            aria-hidden="true"
          />
        </IconButton>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => load(false)}>
            Retry
          </Button>
        </div>
      )}

      {cryptos.length === 0 && !error ? (
        <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-400">
          No market data available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cryptos.map((crypto) => (
            <PriceCard key={crypto.id} crypto={crypto} />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded bg-slate-800" />
        <div className="h-4 w-40 animate-pulse rounded bg-slate-800/70" />
      </div>
      <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-800" />
    </div>
  );
}
