import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, creating it on first use.
 *
 * The client is intentionally lazy: `createClient` throws when the URL is missing,
 * so eager module-level initialisation would crash any page that imports this file
 * in an environment without Supabase credentials.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable persistence.'
    );
  }

  client = createClient(url, anonKey);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getPortfolioAssets(userId: string) {
  const { data, error } = await getSupabase()
    .from('portfolio_assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addPortfolioAsset(
  userId: string,
  cryptoId: string,
  quantity: number,
  purchasePrice: number
) {
  const { data, error } = await getSupabase()
    .from('portfolio_assets')
    .insert([
      {
        user_id: userId,
        crypto_id: cryptoId,
        quantity,
        purchase_price: purchasePrice,
        purchase_date: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function deletePortfolioAsset(id: string) {
  const { error } = await getSupabase().from('portfolio_assets').delete().eq('id', id);
  if (error) throw error;
}

export async function getWatchlist(userId: string) {
  const { data, error } = await getSupabase()
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addToWatchlist(userId: string, cryptoId: string) {
  const { data, error } = await getSupabase()
    .from('watchlist')
    .insert([
      {
        user_id: userId,
        crypto_id: cryptoId,
        added_date: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function removeFromWatchlist(id: string) {
  const { error } = await getSupabase().from('watchlist').delete().eq('id', id);
  if (error) throw error;
}

export async function getMarketAlerts(userId: string) {
  const { data, error } = await getSupabase()
    .from('market_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createMarketAlert(
  userId: string,
  cryptoId: string,
  alertType: 'price_above' | 'price_below',
  targetPrice: number
) {
  const { data, error } = await getSupabase()
    .from('market_alerts')
    .insert([
      {
        user_id: userId,
        crypto_id: cryptoId,
        alert_type: alertType,
        target_price: targetPrice,
        is_triggered: false,
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function deleteMarketAlert(id: string) {
  const { error } = await getSupabase().from('market_alerts').delete().eq('id', id);
  if (error) throw error;
}
