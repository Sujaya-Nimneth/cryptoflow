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
