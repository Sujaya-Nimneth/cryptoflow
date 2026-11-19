'use client';

import { useId, useMemo } from 'react';
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
  const headingId = useId();

  if (loading) {
    return (
      <section aria-labelledby={headingId} aria-busy="true" className="space-y-4">
        <h2 id={headingId} className="text-xl font-semibold text-white">Live price tracking</h2>
        <p role="status" className="text-sm text-slate-400">Loading market quotes…</p>
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: ids.length }, (_, index) => (
            <div key={index} className="h-52 w-full rounded-lg bg-slate-800/70 sm:w-[calc(50%_-_0.5rem)] lg:w-[calc((100%_-_2rem)/3)]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-xl font-semibold text-white">Live price tracking</h2>
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
        <div className="flex flex-wrap justify-center gap-4">
          {cryptos.map((crypto) => (
            <PriceCard key={crypto.id} crypto={crypto} />
          ))}
        </div>
      )}
    </section>
  );
}
