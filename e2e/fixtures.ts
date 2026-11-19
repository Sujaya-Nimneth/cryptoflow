import { test as base, expect, type Page } from '@playwright/test';

const coins = [
  ['bitcoin', 'Bitcoin', 'BTC', 65000, 2.4],
  ['ethereum', 'Ethereum', 'ETH', 2500, -1.2],
  ['cardano', 'Cardano', 'ADA', 0.6, 3.1],
  ['solana', 'Solana', 'SOL', 150, 1.8],
  ['ripple', 'XRP', 'XRP', 0.55, -0.4],
].map(([id, name, symbol, price, change]) => ({
  id,
  name,
  symbol,
  current_price: price,
  market_cap: Number(price) * 1_000_000,
  market_cap_rank: 1,
  total_volume: 1_000_000,
  high_24h: Number(price) * 1.02,
  low_24h: Number(price) * 0.98,
  price_change_percentage_24h: change,
  circulating_supply: 1_000_000,
  image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
}));

async function mockMarkets(page: Page) {
  await page.route('**/api/crypto/coins/markets?**', async (route) => {
    const ids = new URL(route.request().url()).searchParams.get('ids')?.split(',') ?? [];
    await route.fulfill({ json: coins.filter((coin) => ids.includes(String(coin.id))) });
  });
  await page.route('**/api/crypto/global', (route) => route.fulfill({
    json: {
      data: {
        total_market_cap: { usd: 2_500_000_000_000 },
        total_volume: { usd: 80_000_000_000 },
        market_cap_percentage: { btc: 52 },
        market_cap_change_percentage_24h_usd: 1.5,
        updated_at: 1_700_000_000,
      },
    },
  }));
  await page.route('**/api/crypto/coins/*/ohlc?**', (route) => route.fulfill({
    json: Array.from({ length: 42 }, (_, index) => {
      const open = 64000 + index * 20;
      const close = open + (index % 2 === 0 ? 100 : -80);
      return [1_700_000_000_000 + index * 14_400_000, open, Math.max(open, close) + 200, Math.min(open, close) - 200, close];
    }),
  }));
  await page.route('https://coin-images.coingecko.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="15" fill="#c2410c"/></svg>',
  }));
}

export const test = base.extend({
  page: async ({ page }, provideFixture) => {
    await mockMarkets(page);
    await provideFixture(page);
  },
});

export { expect };
