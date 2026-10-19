import { describe, expect, it } from 'vitest';
import { COINS, coinLabel, coinSymbol, findCoin } from './coins';

describe('coin catalog', () => {
  it('uses unique CoinGecko ids', () => {
    const ids = COINS.map((coin) => coin.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('looks up coins by id', () => {
    expect(findCoin('bitcoin')).toMatchObject({ name: 'Bitcoin', symbol: 'BTC' });
    expect(findCoin('ripple')).toMatchObject({ name: 'XRP', symbol: 'XRP' });
  });

  it('falls back to the raw id when unknown', () => {
    expect(findCoin('not-a-coin')).toBeUndefined();
    expect(coinLabel('not-a-coin')).toBe('not-a-coin');
    expect(coinSymbol('not-a-coin')).toBe('NOT-');
  });
});
