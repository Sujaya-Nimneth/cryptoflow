import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCryptocurrencyChart, getCryptocurrencies, getGlobalMarketData } from './cryptoApi';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const quote = {
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'btc',
  current_price: 65000,
  market_cap: null,
  market_cap_rank: null,
  total_volume: null,
  high_24h: null,
  low_24h: null,
  price_change_percentage_24h: null,
  circulating_supply: null,
  image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
};

afterEach(() => vi.clearAllMocks());

describe('browser market API', () => {
  it('requests canonical quotes and forwards abort signals', async () => {
    fetchMock.mockResolvedValue(Response.json([quote]));
    const controller = new AbortController();
    const result = await getCryptocurrencies(['bitcoin', 'bitcoin'], 'usd', controller.signal);
    expect(result[0]).toMatchObject({ id: 'bitcoin', market_cap: 0, high_24h: 65000 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/crypto/coins/markets?');
    expect(new URL(String(url), 'http://local').searchParams.get('ids')).toBe('bitcoin');
    expect(options.signal).toBe(controller.signal);
  });

  it('explains numeric rate limits without trusting arbitrary headers', async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 429, headers: { 'retry-after': '45' } }));
    await expect(getGlobalMarketData()).rejects.toThrow('Try again in 45s.');

    fetchMock.mockResolvedValue(Response.json({}, { status: 429, headers: { 'retry-after': 'later' } }));
    await expect(getGlobalMarketData()).rejects.toThrow('Try again shortly.');
  });

  it('surfaces outages and rejects malformed payloads', async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 503 }));
    await expect(getGlobalMarketData()).rejects.toThrow('Market data request failed (503).');

    fetchMock.mockResolvedValue(Response.json([{ ...quote, current_price: -1 }]));
    await expect(getCryptocurrencies(['bitcoin'])).rejects.toThrow();
  });

  it('validates and maps OHLC candles', async () => {
    fetchMock.mockResolvedValue(Response.json([[1_700_000_000_000, 10, 12, 9, 11]]));
    await expect(getCryptocurrencyChart('bitcoin', '7')).resolves.toEqual([{
      timestamp: 1_700_000_000_000,
      open: 10,
      high: 12,
      low: 9,
      close: 11,
      volume: 0,
    }]);
    await expect(getCryptocurrencyChart('unknown')).rejects.toThrow();
  });
});
