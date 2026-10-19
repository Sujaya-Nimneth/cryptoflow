export interface CoinOption {
  id: string;
  name: string;
  symbol: string;
}

/** Curated catalog used by the portfolio and alert forms. */
export const COINS: CoinOption[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'tether', name: 'Tether', symbol: 'USDT' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'tron', name: 'TRON', symbol: 'TRX' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
  { id: 'cosmos', name: 'Cosmos Hub', symbol: 'ATOM' },
];

const COIN_MAP = new Map(COINS.map((coin) => [coin.id, coin]));

export function findCoin(id: string): CoinOption | undefined {
  return COIN_MAP.get(id);
}

export function coinLabel(id: string): string {
  const coin = COIN_MAP.get(id);
  return coin ? coin.name : id;
}

export function coinSymbol(id: string): string {
  const coin = COIN_MAP.get(id);
  return coin ? coin.symbol : id.slice(0, 4).toUpperCase();
}
