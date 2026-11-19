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

export interface PortfolioHolding {
  id: string;
  cryptoId: string;
  quantity: number;
  purchasePrice: number;
}

export interface WatchlistEntry {
  id: string;
  cryptoId: string;
}

export interface PriceAlert {
  id: string;
  cryptoId: string;
  direction: 'above' | 'below';
  targetPrice: number;
  createdAt: string;
}
