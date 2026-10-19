'use client';

import { useEffect, useState } from 'react';
import { getGlobalMarketData } from '@/lib/cryptoApi';
import { formatCompactCurrency, formatPercent, trendClass } from '@/lib/format';
import type { GlobalMarketData } from '@/types';
import { StatTile } from './ui/StatTile';

export default function MarketOverview() {
  const [data, setData] = useState<GlobalMarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const result = await getGlobalMarketData(controller.signal);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled && !controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load market data');
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-4 text-sm text-slate-400">
        Global market data is unavailable right now.
      </p>
    );
  }

  const marketCap = data?.total_market_cap?.usd;
  const volume = data?.total_volume?.usd;
  const capChange = data?.market_cap_change_percentage_24h_usd;
  const volumeChange = data?.volume_change_percentage_24h_usd;
  const dominance = data?.market_cap_percentage?.btc;

  return (
    <section aria-label="Global market overview" className="space-y-3">
      <h2 className="text-2xl font-bold text-white">Market overview</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile
          label="Global market cap"
          value={marketCap === undefined ? <Skeleton /> : formatCompactCurrency(marketCap)}
          hint={
            capChange === undefined ? undefined : (
              <span className={trendClass(capChange)}>{formatPercent(capChange)} 24h</span>
            )
          }
        />
        <StatTile
          label="24h volume"
          value={volume === undefined ? <Skeleton /> : formatCompactCurrency(volume)}
          hint={
            volumeChange === undefined ? undefined : (
              <span className={trendClass(volumeChange)}>{formatPercent(volumeChange)} 24h</span>
            )
          }
        />
        <StatTile
          label="Bitcoin dominance"
          value={dominance === undefined ? <Skeleton /> : `${dominance.toFixed(1)}%`}
        />
      </div>
    </section>
  );
}

function Skeleton() {
  return <span className="inline-block h-7 w-24 animate-pulse rounded bg-slate-700" aria-hidden="true" />;
}
