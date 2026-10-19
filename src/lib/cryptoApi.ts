import type { ChartData, Cryptocurrency, GlobalMarketData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_CRYPTO_API_URL || 'https://api.coingecko.com/api/v3';

export const DEFAULT_COIN_IDS = ['bitcoin', 'ethereum', 'cardano', 'solana', 'xrp'] as const;

/** CoinGecko requires at least one id, and per_page must cover every requested coin. */
function buildMarketsParams(ids: string[], vsCurrency: string) {
  return new URLSearchParams({
    vs_currency: vsCurrency,
    ids: ids.join(','),
    order: 'market_cap_desc',
    per_page: String(Math.max(ids.length, 1)),
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });
}

async function request<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}?${params}`, {
    signal,
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const suffix = retryAfter ? ` Retry after ${retryAfter}s.` : '';
    throw new Error(`CoinGecko request failed (${response.status}).${suffix}`);
  }

  return (await response.json()) as T;
}

export async function getCryptocurrencies(
  ids: readonly string[] = DEFAULT_COIN_IDS,
  vsCurrency = 'usd',
  signal?: AbortSignal
): Promise<Cryptocurrency[]> {
  const data = await request<Cryptocurrency[]>(
    '/coins/markets',
    buildMarketsParams([...ids], vsCurrency),
    signal
  );

  // CoinGecko omits or nulls these fields for brand-new listings.
  return data.map((coin) => ({
    ...coin,
    price_change_percentage_24h: coin.price_change_percentage_24h ?? 0,
    high_24h: coin.high_24h ?? coin.current_price,
    low_24h: coin.low_24h ?? coin.current_price,
  }));
}

export async function getGlobalMarketData(signal?: AbortSignal): Promise<GlobalMarketData> {
  const data = await request<{ data: GlobalMarketData }>('/global', new URLSearchParams(), signal);
  return data.data;
}

export async function getCryptocurrencyChart(
  id: string,
  days: string | number = '1',
  vsCurrency = 'usd',
  signal?: AbortSignal
): Promise<ChartData[]> {
  const params = new URLSearchParams({ vs_currency: vsCurrency, days: String(days) });
  const candles = await request<number[][]>(`/coins/${id}/ohlc`, params, signal);

  return candles.map(([timestamp, open, high, low, close]) => ({
    timestamp,
    open,
    high,
    low,
    close,
    volume: 0, // The /ohlc endpoint does not return volume.
  }));
}

export async function searchCryptocurrencies(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ query });
  const data = await request<{ coins: unknown[] }>('/search', params, signal);
  return data.coins;
}

export async function getTrendingCryptocurrencies(signal?: AbortSignal) {
  const data = await request<{ coins: unknown[] }>('/search/trending', new URLSearchParams(), signal);
  return data.coins;
}
