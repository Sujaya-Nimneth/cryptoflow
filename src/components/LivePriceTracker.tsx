'use client';

import { useMemo } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { DEFAULT_COIN_IDS } from '@/lib/cryptoApi';
import { useMarketCoins } from '@/hooks/useMarketCoins';
import PriceCard from './PriceCard';
import { IconButton } from './ui/Button';
import { DataNotice, FreshnessLabel } from './ui/DataNotice';

export default function LivePriceTracker() {
  const ids = useMemo(() => [...DEFAULT_COIN_IDS], []);
  const { coins, loading, refreshing, error, updatedAt, freshness, refresh } = useMarketCoins(ids);
  const cryptos = [...coins.values()];

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
          <p className="text-sm text-slate-400">
            Auto-refreshes every 30 seconds · <FreshnessLabel updatedAt={updatedAt} stale={freshness === 'stale'} />
          </p>
        </div>
        <IconButton
          label="Refresh prices now"
          onClick={() => void refresh()}
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

      {error && <DataNotice message={error} onRetry={() => void refresh()} />}

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
