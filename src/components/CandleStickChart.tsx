'use client';

import { useMemo, useState } from 'react';
import {
  BarController,
  BarElement,
  Chart as ChartJS,
  LinearScale,
  TimeScale,
  Tooltip,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import useSWR from 'swr';
import { getCryptocurrencyChart } from '@/lib/cryptoApi';
import { formatPrice } from '@/lib/format';
import { candleGeometry, candleGranularity, chartTickLabel } from '@/lib/chart';
import { coinLabel } from '@/lib/coins';
import { OHLC_REFRESH_MS, type ChartDays } from '@/lib/marketSchemas';
import { Button } from './ui/Button';
import { DataNotice } from './ui/DataNotice';

ChartJS.register(BarController, BarElement, LinearScale, TimeScale, Tooltip);

const TIMEFRAMES = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
] as const;

type Timeframe = ChartDays;

interface CandleStickChartProps {
  cryptoId: string;
  days?: Timeframe;
}

const UP = '#34d399';
const DOWN = '#fb7185';

export default function CandleStickChart({ cryptoId, days = '7' }: CandleStickChartProps) {
  const [selectedDays, setSelectedDays] = useState<Timeframe>(days);
  const [showData, setShowData] = useState(false);
  const { data: candles = [], error, isLoading: loading, mutate } = useSWR(
    ['/api/crypto/ohlc', cryptoId, selectedDays] as const,
    ([, id, timeframe]) => getCryptocurrencyChart(id, timeframe),
    {
      refreshInterval: OHLC_REFRESH_MS,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 5_000,
      errorRetryCount: 4,
    }
  );

  const closes = candles.map((candle) => candle.close);
  const geometry = useMemo(() => candleGeometry(candles), [candles]);
  const granularity = candleGranularity(selectedDays);
  const first = candles[0];
  const last = candles.at(-1);
  const summary = first && last
    ? `${coinLabel(cryptoId)}: ${candles.length} ${granularity} from ${new Date(first.timestamp).toLocaleString()} to ${new Date(last.timestamp).toLocaleString()}. Latest close ${formatPrice(last.close)}.`
    : `${coinLabel(cryptoId)} OHLC chart. ${granularity}.`;

  const data = {
    datasets: [
      {
        label: 'Range',
        data: geometry.wicks,
        grouped: false,
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
        data: geometry.bodies,
        grouped: false,
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
    animation: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? false
      : { duration: 250 },
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
          title: (items) => {
            const candle = candles[items[0]?.dataIndex];
            return candle ? new Date(candle.timestamp).toLocaleString() : '';
          },
          label: (item) => {
            if (item.datasetIndex !== 1) return [];
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
        type: 'linear',
        min: first?.timestamp,
        max: last?.timestamp,
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 8,
          maxRotation: 0,
          callback: (value) => chartTickLabel(Number(value), selectedDays),
        },
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
          <h3 className="text-lg font-semibold text-white">Price chart</h3>
          <p className="text-sm text-slate-400">
            {candles.length > 0 ? `${candles.length} candles · ${formatPrice(closes.at(-1)!)} · ${granularity}` : granularity}
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
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-rose-300">{error}</p>
            <p className="text-xs text-slate-400">
              CoinGecko&apos;s free tier allows a limited number of requests per minute.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void mutate()}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && candles.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            No chart data available.
          </div>
        )}

        {!loading && !error && candles.length > 0 && (
          <Bar data={data} options={options} role="img" aria-label={summary} />
        )}
      </div>
      {error && candles.length > 0 && <DataNotice message="Showing the last successful chart while refresh fails." onRetry={() => void mutate()} />}
      {candles.length > 0 && (
        <>
          <p className="sr-only">{summary}</p>
          <Button variant="secondary" size="sm" className="mt-4" aria-expanded={showData} onClick={() => setShowData((open) => !open)}>
            {showData ? 'Hide chart data' : 'View chart data'}
          </Button>
          {showData && (
            <div className="mt-3 max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{summary}</caption>
                <thead>
                  <tr>{['Time', 'Open', 'High', 'Low', 'Close'].map((heading) => <th key={heading} scope="col" className="p-2 text-right text-slate-300 first:text-left">{heading}</th>)}</tr>
                </thead>
                <tbody>
                  {candles.map((candle) => (
                    <tr key={candle.timestamp}>
                      <td className="p-2 text-slate-300">{new Date(candle.timestamp).toLocaleString()}</td>
                      {[candle.open, candle.high, candle.low, candle.close].map((value, index) => <td key={index} className="p-2 text-right tabular-nums text-white">{formatPrice(value)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
