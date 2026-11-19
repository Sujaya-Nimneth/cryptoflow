'use client';

import { useGlobalMarket } from '@/hooks/useGlobalMarket';
import { formatCompactCurrency, formatPercent, trendClass } from '@/lib/format';
import { StatTile } from './ui/StatTile';
import { DataNotice } from './ui/DataNotice';

export default function MarketOverview() {
  const { data, error, isLoading, mutate } = useGlobalMarket();

  if (error) {
    return (
      <DataNotice message="Global market data is unavailable right now." onRetry={() => void mutate()} />
    );
  }

  const marketCap = data?.total_market_cap.usd;
  const volume = data?.total_volume.usd;
  const capChange = data?.market_cap_change_percentage_24h_usd;
  const dominance = data?.market_cap_percentage.btc;

  return (
    <section aria-label="Global market overview" aria-busy={isLoading} className="space-y-3">
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
