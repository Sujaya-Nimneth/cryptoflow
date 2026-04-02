import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getPortfolioAssets(userId: string) {
  const { data, error } = await supabase
    .from('portfolio_assets')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function addPortfolioAsset(
  userId: string,
  cryptoId: string,
  quantity: number,
  purchasePrice: number
) {
  const { data, error } = await supabase
    .from('portfolio_assets')
    .insert([
      {
        user_id: userId,
        crypto_id: cryptoId,
        quantity,
        purchase_price: purchasePrice,
        purchase_date: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
  return data;
}

export async function getWatchlist(userId: string) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function addToWatchlist(userId: string, cryptoId: string) {
  const { data, error } = await supabase
    .from('watchlist')
    .insert([
      {
        user_id: userId,
        crypto_id: cryptoId,
        added_date: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
  return data;
}

export async function getMarketAlerts(userId: string) {
  const { data, error } = await supabase
    .from('market_alerts')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function createMarketAlert(
  userId: string,
  cryptoId: string,
  alertType: 'price_above' | 'price_below',
  targetPrice: number
) {
  const { data, error } = await supabase
    .from('market_alerts')
    .insert([
      {
        user_id: userId,
        crypto_id: cryptoId,
        alert_type: alertType,
        target_price: targetPrice,
        is_triggered: false,
      },
    ]);

  if (error) throw error;
  return data;
}
