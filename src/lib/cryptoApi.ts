import type { ChartData, Cryptocurrency, GlobalMarketData } from '@/types';
import {
  canonicalMarketQuery,
  cryptocurrenciesSchema,
  globalResponseSchema,
  ohlcQuerySchema,
  ohlcSchema,
  retryAfterSeconds,
  type ChartDays,
} from './marketSchemas';
import { coinIdSchema } from './coins';

/** All browser traffic goes through our own proxy so responses can be cached and CORS-safe. */
const API_URL = '/api/crypto';

export const DEFAULT_COIN_IDS = ['bitcoin', 'ethereum', 'cardano', 'solana', 'ripple'] as const;

async function request(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}?${params}`, {
    signal,
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    const retryAfter = retryAfterSeconds(response.headers.get('retry-after'));
    if (response.status === 429) {
      throw new Error(
        retryAfter !== null
          ? `Market data is rate limited. Try again in ${retryAfter}s.`
          : 'Market data is rate limited. Try again shortly.'
      );
    }
    throw new Error(`Market data request failed (${response.status}).`);
  }

  return response.json();
}

export async function getCryptocurrencies(
  ids: readonly string[] = DEFAULT_COIN_IDS,
  vsCurrency = 'usd',
  signal?: AbortSignal
): Promise<Cryptocurrency[]> {
  if (vsCurrency !== 'usd') throw new Error('Only USD quotes are supported');
  const data = await request(
    '/coins/markets',
    new URLSearchParams(canonicalMarketQuery(ids)),
    signal
  );
  return cryptocurrenciesSchema.parse(data);
}

export async function getGlobalMarketData(signal?: AbortSignal): Promise<GlobalMarketData> {
  const data = await request('/global', new URLSearchParams(), signal);
  return globalResponseSchema.parse(data).data;
}

export async function getCryptocurrencyChart(
  id: string,
  days: ChartDays = '1',
  vsCurrency = 'usd',
  signal?: AbortSignal
): Promise<ChartData[]> {
  const coinId = coinIdSchema.parse(id);
  if (vsCurrency !== 'usd') throw new Error('Only USD charts are supported');
  const query = ohlcQuerySchema.parse({ vs_currency: vsCurrency, days });
  const params = new URLSearchParams(query);
  const candles = ohlcSchema.parse(await request(`/coins/${coinId}/ohlc`, params, signal));

  return candles.map(([timestamp, open, high, low, close]) => ({
    timestamp,
    open,
    high,
    low,
    close,
    volume: 0,
  }));
}
