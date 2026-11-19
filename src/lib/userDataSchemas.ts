import { z } from 'zod';
import { coinIdSchema } from './coins';

const identifier = z.uuid();
export const MAX_POSITIVE_AMOUNT = 1_000_000_000_000;
const positiveAmount = z.number().finite().positive().max(MAX_POSITIVE_AMOUNT);
const timestamp = z.iso.datetime();

export const portfolioHoldingSchema = z.strictObject({
  id: identifier,
  cryptoId: coinIdSchema,
  quantity: positiveAmount,
  purchasePrice: positiveAmount,
});

export const watchlistEntrySchema = z.strictObject({
  id: identifier,
  cryptoId: coinIdSchema,
});

export const priceAlertSchema = z.strictObject({
  id: identifier,
  cryptoId: coinIdSchema,
  direction: z.enum(['above', 'below']),
  targetPrice: positiveAmount,
  createdAt: timestamp,
});

function uniqueIds<T extends { id: string }>(items: T[]) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

export const localPortfolioSchema = z.object({
  version: z.literal(1),
  holdings: z.array(portfolioHoldingSchema).max(500).refine(uniqueIds, 'Duplicate holding ids'),
});

export const localWatchlistSchema = z.object({
  version: z.literal(1),
  entries: z.array(watchlistEntrySchema).max(18).refine(uniqueIds, 'Duplicate watchlist ids').refine(
    (entries) => new Set(entries.map((entry) => entry.cryptoId)).size === entries.length,
    'Duplicate watchlist coins'
  ),
});

export const localAlertsSchema = z.object({
  version: z.literal(1),
  alerts: z.array(priceAlertSchema).max(500).refine(uniqueIds, 'Duplicate alert ids'),
});
