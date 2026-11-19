import { z } from 'zod';
import { COINS } from './coins';

export const MARKET_REFRESH_MS = 30_000;
export const OHLC_REFRESH_MS = 300_000;
export const GLOBAL_REFRESH_MS = 60_000;
export const QUOTE_STALE_MS = 90_000;
export const CHART_DAYS = ['1', '7', '30', '90', '365'] as const;

export function retryAfterSeconds(value: string | null): number | null {
  if (!value || !/^\d{1,6}$/.test(value)) return null;
  const seconds = Number(value);
  return seconds <= 86_400 ? seconds : null;
}

const coinId = z.enum(COINS.map((coin) => coin.id) as [string, ...string[]]);
const coinIds = z.string().transform((value) => value.split(',')).pipe(
  z.array(coinId).min(1).max(COINS.length).refine(
    (ids) => new Set(ids).size === ids.length,
    'Coin ids must be unique'
  )
);
const finiteNumber = z.number().finite();
const nonnegativeNumber = finiteNumber.nonnegative();

export const marketsQuerySchema = z.strictObject({
  vs_currency: z.literal('usd'),
  ids: coinIds,
  order: z.literal('market_cap_desc'),
  per_page: z.string().regex(/^[1-9]\d?$/).transform(Number),
  page: z.literal('1'),
  sparkline: z.literal('false'),
  price_change_percentage: z.literal('24h'),
}).refine(
  (query) => query.per_page >= query.ids.length && query.per_page <= COINS.length,
  'per_page must cover the requested coins'
);

export const ohlcQuerySchema = z.strictObject({
  vs_currency: z.literal('usd'),
  days: z.enum(CHART_DAYS),
});

export const cryptocurrencySchema = z.object({
  id: coinId,
  name: z.string().min(1),
  symbol: z.string().min(1),
  current_price: nonnegativeNumber,
  market_cap: nonnegativeNumber.nullish().transform((value) => value ?? 0),
  market_cap_rank: nonnegativeNumber.nullish().transform((value) => value ?? 0),
  total_volume: nonnegativeNumber.nullish().transform((value) => value ?? 0),
  high_24h: nonnegativeNumber.nullish(),
  low_24h: nonnegativeNumber.nullish(),
  price_change_percentage_24h: finiteNumber.nullish().transform((value) => value ?? 0),
  circulating_supply: nonnegativeNumber.nullish().transform((value) => value ?? 0),
  image: z.url().refine(
    (value) => new URL(value).hostname === 'coin-images.coingecko.com',
    'Unexpected coin image origin'
  ),
}).transform((coin) => ({
  ...coin,
  high_24h: coin.high_24h ?? coin.current_price,
  low_24h: coin.low_24h ?? coin.current_price,
}));

export const cryptocurrenciesSchema = z.array(cryptocurrencySchema)
  .min(1)
  .max(COINS.length)
  .refine(
    (coins) => new Set(coins.map((coin) => coin.id)).size === coins.length,
    'Duplicate coin quotes'
  );

export const ohlcSchema = z.array(
  z.tuple([nonnegativeNumber, nonnegativeNumber, nonnegativeNumber, nonnegativeNumber, nonnegativeNumber])
).min(1).max(1_000).refine(
  (candles) => candles.every(([, open, high, low, close]) =>
    high >= Math.max(open, close) && low <= Math.min(open, close)
  ),
  'Invalid OHLC range'
);

const currencyValues = z.record(z.string(), nonnegativeNumber);

export const globalResponseSchema = z.object({
  data: z.object({
    total_market_cap: currencyValues.refine((values) => values.usd !== undefined),
    total_volume: currencyValues.refine((values) => values.usd !== undefined),
    market_cap_percentage: z.record(z.string(), finiteNumber).refine(
      (values) => values.btc !== undefined
    ),
    market_cap_change_percentage_24h_usd: finiteNumber,
    volume_change_percentage_24h_usd: finiteNumber.optional(),
    updated_at: nonnegativeNumber,
  }),
});

export type ChartDays = (typeof CHART_DAYS)[number];

export function marketQuery(ids: readonly string[]) {
  const orderedIds = [...new Set(ids)].sort();
  return marketsQuerySchema.parse({
    vs_currency: 'usd',
    ids: orderedIds.join(','),
    order: 'market_cap_desc',
    per_page: String(Math.max(orderedIds.length, 1)),
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });
}

export function canonicalMarketQuery(ids: readonly string[]): string {
  const query = marketQuery(ids);
  return new URLSearchParams({
    vs_currency: query.vs_currency,
    ids: query.ids.join(','),
    order: query.order,
    per_page: String(query.per_page),
    page: query.page,
    sparkline: query.sparkline,
    price_change_percentage: query.price_change_percentage,
  }).toString();
}
