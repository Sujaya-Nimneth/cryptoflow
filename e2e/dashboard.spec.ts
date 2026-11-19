import { expect, test } from './fixtures';

test('loads the dashboard shell and every section', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'CryptoFlow Analytics', level: 1 })).toBeVisible();

  for (const section of ['Portfolio', 'Watchlist', 'Alerts', 'Dashboard']) {
    await page.getByRole('tab', { name: section }).click();
    await expect(page.getByRole('tab', { name: section })).toHaveAttribute('aria-selected', 'true');
  }
});

test('supports keyboard tabs, visible mobile labels, and a skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  const dashboard = page.getByRole('tab', { name: 'Dashboard' });
  await dashboard.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/tab=portfolio/);
  await expect(page.getByRole('tab', { name: 'Portfolio' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Portfolio' })).toHaveAttribute('tabindex', '0');
  await page.keyboard.press('End');
  await expect(page).toHaveURL(/tab=alerts/);
  await expect(page.getByRole('tab', { name: 'Alerts' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeFocused();

  for (const section of ['Dashboard', 'Portfolio', 'Watchlist', 'Alerts']) {
    const tab = page.getByRole('tab', { name: section });
    await expect(tab).toBeVisible();
    const box = await tab.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    const panelId = await tab.getAttribute('aria-controls');
    await expect(page.locator(`#${panelId}`)).toHaveCount(1);
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

test('validates amounts inline and restores form focus on mobile and desktop', async ({ page }) => {
  await page.goto('/?tab=portfolio');
  await page.getByRole('button', { name: 'Add asset' }).first().click();
  await expect(page.getByLabel('Coin', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Save asset' }).click();
  const quantity = page.getByLabel('Quantity', { exact: true });
  await expect(quantity).toBeFocused();
  await expect(quantity).toHaveAttribute('aria-invalid', 'true');
  await expect(quantity).toHaveAccessibleDescription('Enter a quantity.');
  await expect(page.getByLabel('Purchase price (USD)')).toHaveAccessibleDescription('Enter a purchase price.');
  await quantity.fill('0.5');
  await expect(quantity).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Purchase price (USD)').fill('1000000000001');
  await page.getByRole('button', { name: 'Save asset' }).click();
  await expect(page.getByLabel('Purchase price (USD)')).toBeFocused();
  await expect(page.getByText('Purchase price must not exceed $1 trillion.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Add asset' }).first()).toBeFocused();

  await page.getByRole('tab', { name: 'Alerts' }).click();
  await page.getByRole('button', { name: 'New alert' }).first().click();
  await page.locator('form').getByRole('button', { name: 'Create alert', exact: true }).click();
  const target = page.getByLabel('Target price (USD)');
  await expect(target).toBeFocused();
  await expect(target).toHaveAccessibleDescription('Enter a target price.');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'New alert' }).first()).toBeFocused();
});

test('describes real watchlist coverage and dashboard-only alert checks', async ({ page }) => {
  await page.goto('/?tab=watchlist');
  await expect(page.getByText('Combined price')).toHaveCount(0);
  await expect(page.getByText('Quote coverage')).toBeVisible();
  await expect(page.getByText('0 / 0', { exact: true })).toBeVisible();
  await page.getByLabel('Add coin').selectOption('bitcoin');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('1 / 1', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Alerts' }).click();
  await expect(page.getByText('Notification settings')).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByText(/Email, push, SMS, and background delivery are not connected/)).toBeVisible();
  await expect(page.getByText(/Create a target to see when its price crosses/)).toBeVisible();
});

