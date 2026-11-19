'use client';

import { useId, useState } from 'react';
import LivePriceTracker from './LivePriceTracker';
import MarketOverview from './MarketOverview';
import CandleStickChart from './CandleStickChart';
import { COINS } from '@/lib/coins';
import { Select } from './ui/Field';

const CHART_COINS = COINS.filter((coin) =>
  ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'].includes(coin.id)
);

export default function DashboardPanel() {
  const [chartCoin, setChartCoin] = useState('bitcoin');
  const chartHeadingId = useId();

  return (
    <div className="space-y-6">
      <LivePriceTracker />

      <MarketOverview />

      <section aria-labelledby={chartHeadingId} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={chartHeadingId} className="text-xl font-semibold text-white">Price history</h2>
          <label htmlFor="chart-coin" className="sr-only">
            Choose a cryptocurrency to chart
          </label>
          <Select
            id="chart-coin"
            value={chartCoin}
            onChange={(event) => setChartCoin(event.target.value)}
            name="chartCoin"
            autoComplete="off"
            className="w-auto min-w-44"
          >
            {CHART_COINS.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol})
              </option>
            ))}
          </Select>
        </div>

        <CandleStickChart cryptoId={chartCoin} />
      </section>
    </div>
  );
}
