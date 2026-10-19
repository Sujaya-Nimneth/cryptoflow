'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getCryptocurrencyChart } from '@/lib/cryptoApi';
import { formatPrice } from '@/lib/format';
import type { ChartData } from '@/types';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

const TIMEFRAMES = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number]['value'];

interface CandleStickChartProps {
  cryptoId: string;
  days?: Timeframe;
}

const UP = '#34d399';
const DOWN = '#fb7185';

export default function CandleStickChart({ cryptoId, days = '7' }: CandleStickChartProps) {
  const [candles, setCandles] = useState<ChartData[]>([]);
  const [selectedDays, setSelectedDays] = useState<Timeframe>(days);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const data = await getCryptocurrencyChart(cryptoId, selectedDays, 'usd', controller.signal);
        setCandles(data);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
        setCandles([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [cryptoId, selectedDays]);

  const formatLabel = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp);
      if (selectedDays === '1') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      if (selectedDays === '365') {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    [selectedDays]
  );

  const labels = candles.map((candle) => formatLabel(candle.timestamp));
  const closes = candles.map((candle) => candle.close);

  // A candlestick body is drawn as a floating bar from open to close,
  // with a second dataset spanning low to high for the wick.
  const bodyData = candles.map((candle) => [candle.open, candle.close] as [number, number]);
  const wickData = candles.map((candle) => [candle.low, candle.high] as [number, number]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Range',
        data: wickData,
        backgroundColor: 'transparent',
        borderColor: (ctx: ScriptableContext<'bar'>) => {
          const candle = candles[ctx.dataIndex];
          return candle && candle.close >= candle.open ? UP : DOWN;
        },
        borderWidth: 1,
        barPercentage: 0.12,
        categoryPercentage: 0.9,
        order: 2,
      },
      {
        label: 'Body',
        data: bodyData,
        backgroundColor: (ctx: ScriptableContext<'bar'>) => {
          const candle = candles[ctx.dataIndex];
          return candle && candle.close >= candle.open ? UP : DOWN;
        },
        borderColor: 'transparent',
        borderWidth: 0,
        barPercentage: 0.7,
        categoryPercentage: 0.9,
        order: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        callbacks: {
          label: (item) => {
            const candle = candles[item.dataIndex];
            if (!candle) return '';
            return [
              `Open ${formatPrice(candle.open)}`,
              `High ${formatPrice(candle.high)}`,
              `Low  ${formatPrice(candle.low)}`,
              `Close ${formatPrice(candle.close)}`,
            ];
          },
          labelColor: (item) => {
            const candle = candles[item.dataIndex];
            return {
              borderColor: 'transparent',
              backgroundColor: candle && candle.close >= candle.open ? UP : DOWN,
            };
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', maxTicksLimit: 8, maxRotation: 0 },
        grid: { display: false },
        border: { color: '#334155' },
      },
      y: {
        position: 'right',
        beginAtZero: false,
        grace: '5%',
        ticks: {
          color: '#94a3b8',
          callback: (value) => formatPrice(Number(value)),
        },
        grid: { color: 'rgba(51, 65, 85, 0.6)' },
        border: { display: false },
      },
    },
  };

  return (
    <section className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Price Chart</h3>
          <p className="text-sm text-slate-400">
            {candles.length > 0 ? `${candles.length} candles · ${closes.at(-1) ? formatPrice(closes.at(-1)!) : ''}` : 'OHLC data'}
          </p>
        </div>
        <div role="group" aria-label="Chart timeframe" className="flex gap-1 rounded-lg bg-slate-900/60 p-1">
          {TIMEFRAMES.map((frame) => (
            <button
              key={frame.value}
              type="button"
              onClick={() => setSelectedDays(frame.value)}
              aria-pressed={selectedDays === frame.value}
              className={`rounded-md px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                selectedDays === frame.value
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {frame.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        {loading && (
          <div className="flex h-full items-center justify-center text-slate-400" role="status">
            Loading chart data…
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-rose-300">{error}</p>
            <p className="text-xs text-slate-500">CoinGecko may be rate limiting. Try again in a minute.</p>
          </div>
        )}

        {!loading && !error && candles.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            No chart data available.
          </div>
        )}

        {!loading && !error && candles.length > 0 && <Bar data={data} options={options} />}
      </div>
    </section>
  );
}
