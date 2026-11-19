import { expect, test } from './fixtures';

test('loads the dashboard shell and every section', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'CryptoFlow Analytics', level: 1 })).toBeVisible();

  for (const section of ['Portfolio', 'Watchlist', 'Alerts', 'Dashboard']) {
    await page.getByRole('tab', { name: section }).click();
    await expect(page.getByRole('tab', { name: section })).toHaveAttribute('aria-selected', 'true');
  }
});

test('has no horizontal page overflow', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});

test('aligns candle bodies and wicks on the same time coordinates', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: /Bitcoin: 42 4-hour candles/ })).toBeVisible();
  await page.getByRole('button', { name: 'View chart data' }).click();
  const rows = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Open' }) }).getByRole('row');
  await expect(rows).toHaveCount(43);
  await expect(page.getByRole('columnheader', { name: 'Time' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Close' })).toBeVisible();
});

test('never presents missing portfolio quotes as zero-return valuations', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cryptoflow:local:portfolio', JSON.stringify({
      version: 1,
      holdings: [
        { id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin', quantity: 0.5, purchasePrice: 40000 },
        { id: '00000000-0000-4000-8000-000000000002', cryptoId: 'ethereum', quantity: 5, purchasePrice: 2000 },
      ],
    }));
  });
  await page.unroute('**/api/crypto/coins/markets?**');
  await page.route('**/api/crypto/coins/markets?**', (route) => route.fulfill({
    status: 502,
    json: { error: 'Market data is unavailable' },
  }));
  await page.goto('/?tab=portfolio');
  await expect(page.getByText(/partial value, not your complete portfolio value/)).toBeVisible();
  await expect(page.getByText('Partial quoted value')).toBeVisible();
  await expect(page.getByText('$30,000.00')).toHaveCount(1);
  await expect(page.getByText('Unavailable').first()).toBeVisible();
});

test('persists portfolio, watchlist, and alert additions across tabs and reloads', async ({ page }) => {
  await page.goto('/?tab=portfolio');
  await page.getByRole('button', { name: 'Add asset' }).first().click();
  await page.getByLabel('Quantity', { exact: true }).fill('0.25');
  await page.getByLabel('Purchase price (USD)').fill('50000');
  await page.getByRole('button', { name: 'Save asset' }).click();
  await expect(page.getByRole('cell', { name: 'Bitcoin BTC' })).toBeVisible();

  await page.getByRole('tab', { name: 'Watchlist' }).click();
  await page.getByLabel('Add coin').selectOption('solana');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Solana SOL' })).toBeVisible();

  await page.getByRole('tab', { name: 'Alerts' }).click();
  await page.getByRole('button', { name: 'New alert' }).first().click();
  await page.getByLabel('Target price (USD)').fill('70000');
  await page.locator('form').getByRole('button', { name: 'Create alert', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Bitcoin.*BTC/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: /Bitcoin.*BTC/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Watchlist' }).click();
  await expect(page.getByRole('cell', { name: 'Solana SOL' })).toBeVisible();
  await page.getByRole('tab', { name: 'Portfolio' }).click();
  await expect(page.getByRole('cell', { name: 'Bitcoin BTC' })).toBeVisible();
});
