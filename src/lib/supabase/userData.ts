import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { PriceAlert, PortfolioHolding, WatchlistEntry } from '@/types';
import type { Database } from '@/types/database';
import { portfolioHoldingSchema, priceAlertSchema, watchlistEntrySchema } from '@/lib/userDataSchemas';

type Client = SupabaseClient<Database>;

function fail(message: string): never {
  throw new Error(message);
}

export async function loadCloudPortfolio(client: Client, userId: string): Promise<PortfolioHolding[]> {
  const { data, error } = await client
    .from('portfolio_holdings')
    .select('id,crypto_id,quantity,purchase_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) fail('Could not load your cloud portfolio.');
  return z.array(portfolioHoldingSchema).max(500).parse(data.map((row) => ({
    id: row.id,
    cryptoId: row.crypto_id,
    quantity: row.quantity,
    purchasePrice: row.purchase_price,
  })));
}

export async function insertCloudHolding(client: Client, holding: PortfolioHolding): Promise<PortfolioHolding> {
  const { data, error } = await client
    .from('portfolio_holdings')
    .insert({
      id: holding.id,
      crypto_id: holding.cryptoId,
      quantity: holding.quantity,
      purchase_price: holding.purchasePrice,
    })
    .select('id,crypto_id,quantity,purchase_price')
    .single();
  if (error) fail('Could not save the holding to your cloud account.');
  return portfolioHoldingSchema.parse({
    id: data.id,
    cryptoId: data.crypto_id,
    quantity: data.quantity,
    purchasePrice: data.purchase_price,
  });
}

export async function deleteCloudHolding(client: Client, userId: string, id: string): Promise<void> {
  const { data, error } = await client
    .from('portfolio_holdings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');
  if (error) fail('Could not remove the holding from your cloud account.');
  if (data.length === 0) fail('That holding is no longer in your cloud account.');
}

export async function loadCloudWatchlist(client: Client, userId: string): Promise<WatchlistEntry[]> {
  const { data, error } = await client
    .from('watchlist_entries')
    .select('id,crypto_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) fail('Could not load your cloud watchlist.');
  return z.array(watchlistEntrySchema).max(18).parse(data.map((row) => ({ id: row.id, cryptoId: row.crypto_id })));
}

export async function insertCloudWatchlistEntry(client: Client, entry: WatchlistEntry): Promise<WatchlistEntry> {
  const { data, error } = await client
    .from('watchlist_entries')
    .insert({ id: entry.id, crypto_id: entry.cryptoId })
    .select('id,crypto_id')
    .single();
  if (error) fail('Could not add the coin to your cloud watchlist.');
  return watchlistEntrySchema.parse({ id: data.id, cryptoId: data.crypto_id });
}

export async function deleteCloudWatchlistEntry(client: Client, userId: string, id: string): Promise<void> {
  const { data, error } = await client
    .from('watchlist_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');
  if (error) fail('Could not remove the coin from your cloud watchlist.');
  if (data.length === 0) fail('That coin is no longer in your cloud watchlist.');
}

export async function loadCloudAlerts(client: Client, userId: string): Promise<PriceAlert[]> {
  const { data, error } = await client
    .from('price_alerts')
    .select('id,crypto_id,direction,target_price,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) fail('Could not load your cloud alerts.');
  return z.array(priceAlertSchema).max(500).parse(data.map((row) => ({
    id: row.id,
    cryptoId: row.crypto_id,
    direction: row.direction,
    targetPrice: row.target_price,
    createdAt: row.created_at,
  })));
}

export async function insertCloudAlert(client: Client, alert: PriceAlert): Promise<PriceAlert> {
  const { data, error } = await client
    .from('price_alerts')
    .insert({
      id: alert.id,
      crypto_id: alert.cryptoId,
      direction: alert.direction,
      target_price: alert.targetPrice,
      created_at: alert.createdAt,
    })
    .select('id,crypto_id,direction,target_price,created_at')
    .single();
  if (error) fail('Could not save the alert to your cloud account.');
  return priceAlertSchema.parse({
    id: data.id,
    cryptoId: data.crypto_id,
    direction: data.direction,
    targetPrice: data.target_price,
    createdAt: data.created_at,
  });
}

export async function deleteCloudAlert(client: Client, userId: string, id: string): Promise<void> {
  const { data, error } = await client
    .from('price_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');
  if (error) fail('Could not remove the alert from your cloud account.');
  if (data.length === 0) fail('That alert is no longer in your cloud account.');
}
