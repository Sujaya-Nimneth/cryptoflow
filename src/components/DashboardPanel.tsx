'use client';

import { useState } from 'react';
import LivePriceTracker from './LivePriceTracker';
import MarketOverview from './MarketOverview';
import CandleStickChart from './CandleStickChart';
import { COINS } from '@/lib/coins';

const CHART_COINS = COINS.filter((coin) =>
  ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'].includes(coin.id)
);

export default function DashboardPanel() {
  const [chartCoin, setChartCoin] = useState('bitcoin');

  return (
    <div className="space-y-8">
      <LivePriceTracker />

      <MarketOverview />

      <section aria-label="Price chart" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">Chart</h2>
          <label htmlFor="chart-coin" className="sr-only">
            Choose a cryptocurrency to chart
          </label>
          <select
            id="chart-coin"
            value={chartCoin}
            onChange={(event) => setChartCoin(event.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            {CHART_COINS.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol})
              </option>
            ))}
          </select>
        </div>

        <CandleStickChart cryptoId={chartCoin} />
      </section>
    </div>
  );
}
