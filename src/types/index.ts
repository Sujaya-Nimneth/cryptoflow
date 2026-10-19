export interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  image: string;
}

export interface PortfolioAsset {
  id: string;
  crypto_id: string;
  user_id: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  crypto_id: string;
  added_date: string;
}

export interface MarketAlert {
  id: string;
  user_id: string;
  crypto_id: string;
  alert_type: 'price_above' | 'price_below';
  target_price: number;
  is_triggered: boolean;
  created_at: string;
}

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GlobalMarketData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  volume_change_percentage_24h_usd?: number;
  updated_at: number;
}

export interface PortfolioPerformance {
  total_investment: number;
  current_value: number;
  total_return: number;
  return_percentage: number;
}
