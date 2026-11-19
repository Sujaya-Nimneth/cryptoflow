import {
  GLOBAL_REFRESH_MS,
  MARKET_REFRESH_MS,
  OHLC_REFRESH_MS,
  globalResponseSchema,
  marketsQuerySchema,
  ohlcQuerySchema,
  cryptocurrenciesSchema,
  ohlcSchema,
} from './marketSchemas';
import { coinIdSchema } from './coins';

export type ProxyRequest =
  | { kind: 'markets'; path: string; search: string; revalidate: number }
  | { kind: 'ohlc'; path: string; search: string; revalidate: number }
  | { kind: 'global'; path: string; search: string; revalidate: number };

export function resolveProxyRequest(path: string[], searchParams: URLSearchParams): ProxyRequest | null {
  const entries = [...searchParams.entries()];
  if (new Set(entries.map(([key]) => key)).size !== entries.length) return null;
  const query = Object.fromEntries(entries);

  if (path.length === 2 && path[0] === 'coins' && path[1] === 'markets') {
    const parsed = marketsQuerySchema.safeParse(query);
    if (!parsed.success) return null;
    const canonical = new URLSearchParams({
      vs_currency: parsed.data.vs_currency,
      ids: [...parsed.data.ids].sort().join(','),
      order: parsed.data.order,
      per_page: String(parsed.data.per_page),
      page: parsed.data.page,
      sparkline: parsed.data.sparkline,
      price_change_percentage: parsed.data.price_change_percentage,
    });
    return {
      kind: 'markets',
      path: '/coins/markets',
      search: canonical.toString(),
      revalidate: MARKET_REFRESH_MS / 1_000,
    };
  }

  if (path.length === 3 && path[0] === 'coins' && path[2] === 'ohlc') {
    const id = coinIdSchema.safeParse(path[1]);
    const parsed = ohlcQuerySchema.safeParse(query);
    if (!id.success || !parsed.success) return null;
    return {
      kind: 'ohlc',
      path: `/coins/${id.data}/ohlc`,
      search: new URLSearchParams(parsed.data).toString(),
      revalidate: OHLC_REFRESH_MS / 1_000,
    };
  }

  if (path.length === 1 && path[0] === 'global' && entries.length === 0) {
    return { kind: 'global', path: '/global', search: '', revalidate: GLOBAL_REFRESH_MS / 1_000 };
  }

  return null;
}

export function validateProxyPayload(kind: ProxyRequest['kind'], payload: unknown): unknown {
  if (kind === 'markets') return cryptocurrenciesSchema.parse(payload);
  if (kind === 'ohlc') return ohlcSchema.parse(payload);
  return globalResponseSchema.parse(payload);
}

export async function readBoundedText(
  response: Pick<Response, 'body'>,
  maxBytes: number
): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export function upstreamOrigin(value = process.env.CRYPTO_API_URL): string {
  if (!value) return 'https://api.coingecko.com/api/v3';
  const url = new URL(value);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    (!local && url.hostname !== 'api.coingecko.com') ||
    (url.pathname !== '/api/v3' && url.pathname !== '/api/v3/')
  ) {
    throw new Error('CRYPTO_API_URL must be the CoinGecko /api/v3 origin');
  }
  return url.origin + '/api/v3';
}

export async function fetchUpstream(request: ProxyRequest, signal?: AbortSignal) {
  const headers: HeadersInit = { accept: 'application/json' };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;
  return fetch(`${upstreamOrigin()}${request.path}${request.search ? `?${request.search}` : ''}`, {
    headers,
    signal,
    next: { revalidate: request.revalidate },
  });
}
