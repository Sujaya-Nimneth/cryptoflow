import type { ChartData } from '@/types';
import type { ChartDays } from './marketSchemas';

export function candleGranularity(days: ChartDays): string {
  const duration = Number(days);
  if (duration <= 2) return '30-minute candles';
  if (duration <= 30) return '4-hour candles';
  return '4-day candles';
}

export function candleGeometry(candles: readonly ChartData[]) {
  return {
    wicks: candles.map((candle) => ({ x: candle.timestamp, y: [candle.low, candle.high] as [number, number] })),
    bodies: candles.map((candle) => ({ x: candle.timestamp, y: [candle.open, candle.close] as [number, number] })),
  };
}

export function chartTickLabel(timestamp: number, days: ChartDays): string {
  const date = new Date(timestamp);
  if (days === '1') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (days === '365') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
