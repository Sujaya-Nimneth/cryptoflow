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

test('keeps tab labels and price-card rows readable at every viewport', async ({ page }) => {
  await page.goto('/');
  const priceCards = page.getByRole('region', { name: 'Live price tracking' }).locator('article');
  await expect(priceCards).toHaveCount(5);

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const tablist = page.getByRole('tablist', { name: 'Dashboard sections' });
    const tablistBox = await tablist.boundingBox();
    expect(tablistBox).not.toBeNull();

    for (const section of ['Dashboard', 'Portfolio', 'Watchlist', 'Alerts']) {
      const tab = page.getByRole('tab', { name: section });
      const tabBox = await tab.boundingBox();
      const labelBox = await tab.locator('span').boundingBox();
      expect(tabBox).not.toBeNull();
      expect(labelBox).not.toBeNull();
      expect(tabBox!.width).toBeGreaterThanOrEqual(44);
      expect(tabBox!.height).toBeGreaterThanOrEqual(44);
      expect(labelBox!.x).toBeGreaterThanOrEqual(tabBox!.x);
      expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(tabBox!.x + tabBox!.width);
      expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(tablistBox!.x + tablistBox!.width);
    }

    const boxes = await priceCards.evaluateAll((cards) => cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right };
    }));
    const rows: typeof boxes[] = [];
    for (const box of boxes) {
      const row = rows.find((candidate) => Math.abs(candidate[0].y - box.y) < 2);
      if (row) row.push(box);
      else rows.push([box]);
    }
    const expectedRowCount = width < 640 ? 1 : width < 1024 ? 2 : 3;
    expect(rows.at(-1)?.length).toBe(width < 640 ? 1 : width < 1024 ? 1 : 2);
    expect(rows.every((row) => row.length <= expectedRowCount)).toBe(true);
    for (const row of rows) {
      const left = Math.min(...row.map((box) => box.x));
      const right = Math.max(...row.map((box) => box.right));
      expect(Math.abs((left + right) / 2 - width / 2)).toBeLessThan(2);
      expect(row.every((box) => Math.abs(box.height - row[0].height) < 2)).toBe(true);
      expect(row.every((box) => Math.abs(box.width - row[0].width) < 2)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
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

test('restores deleted holdings, watchlist entries, and alerts with Undo', async ({ page }) => {
  await page.goto('/?tab=portfolio');
  await page.getByRole('button', { name: 'Add asset' }).first().click();
  await page.getByLabel('Quantity', { exact: true }).fill('0.5');
  await page.getByLabel('Purchase price (USD)').fill('40000');
  await page.getByRole('button', { name: 'Save asset' }).click();
  await page.getByRole('button', { name: 'Remove Bitcoin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Bitcoin BTC' })).toBeVisible();

  await page.getByRole('tab', { name: 'Watchlist' }).click();
  await page.getByLabel('Add coin').selectOption('solana');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Solana from watchlist' }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Solana SOL' })).toBeVisible();

  await page.getByRole('tab', { name: 'Alerts' }).click();
  await page.getByRole('button', { name: 'New alert' }).first().click();
  await page.getByLabel('Target price (USD)').fill('70000');
  await page.locator('form').getByRole('button', { name: 'Create alert', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Bitcoin alert' }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Bitcoin.*BTC/ })).toBeVisible();
});

test('aligns numeric data and keeps visible controls touch-sized in populated panels', async ({ page }) => {
  await page.goto('/?tab=portfolio');
  await page.getByRole('button', { name: 'Add asset' }).first().click();
  await page.getByLabel('Quantity', { exact: true }).fill('0.5');
  await page.getByLabel('Purchase price (USD)').fill('40000');
  await page.getByRole('button', { name: 'Save asset' }).click();
  await page.getByRole('tab', { name: 'Watchlist' }).click();
  await page.getByLabel('Add coin').selectOption('ethereum');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('tab', { name: 'Alerts' }).click();
  await page.getByRole('button', { name: 'New alert' }).first().click();
  await page.getByLabel('Target price (USD)').fill('60000');
  await page.locator('form').getByRole('button', { name: 'Create alert', exact: true }).click();

  for (const width of [320, 390, 640, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of ['Portfolio', 'Watchlist', 'Alerts']) {
      await page.getByRole('tab', { name: section }).click();
      const panel = page.getByRole('tabpanel', { name: section });
      await expect(panel).toBeVisible();
      const undersized = await panel.getByRole('button').evaluateAll((buttons) => buttons
        .filter((button) => {
          const style = getComputedStyle(button);
          return style.visibility !== 'hidden' && style.display !== 'none';
        })
        .filter((button) => button.getBoundingClientRect().width < 44 || button.getBoundingClientRect().height < 44)
        .map((button) => button.getAttribute('aria-label') ?? button.textContent));
      expect(undersized).toEqual([]);
      const numericHeaders = await panel.locator('th').evaluateAll((headers) => headers
        .filter((header) => getComputedStyle(header).display !== 'none')
        .filter((header) => /^(Quantity|Purchase|Current|Value|Gain \/ loss|Price|24h|Market cap)$/.test(header.textContent ?? ''))
        .map((header) => getComputedStyle(header).textAlign));
      expect(numericHeaders.every((alignment) => alignment === 'right')).toBe(true);
      const numericCells = await panel.locator('td.tabular-nums').evaluateAll((cells) => cells
        .filter((cell) => getComputedStyle(cell).display !== 'none')
        .map((cell) => ({ alignment: getComputedStyle(cell).textAlign, figures: getComputedStyle(cell).fontVariantNumeric })));
      expect(numericCells.every((cell) => cell.alignment === 'right' && cell.figures.includes('tabular-nums'))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  }
});

test('keeps portfolio amounts intact and holding values visible on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/?tab=portfolio');
  await page.getByRole('button', { name: 'Add asset' }).first().click();
  await page.getByLabel('Quantity', { exact: true }).fill('0.5');
  await page.getByLabel('Purchase price (USD)').fill('40000');
  await page.getByRole('button', { name: 'Save asset' }).click();
  const summary = page.getByText('Total investment').locator('..');
  const amount = summary.getByText('$20,000.00');
  const summaryBox = await summary.boundingBox();
  const amountBox = await amount.boundingBox();
  expect(amountBox!.x + amountBox!.width).toBeLessThanOrEqual(summaryBox!.x + summaryBox!.width);
  expect(await amount.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe('nowrap');
  const holding = page.getByRole('row', { name: /Bitcoin BTC/ });
  await expect(holding.locator('p').filter({ hasText: /^\$32,500\.00$/ })).toBeVisible();
  await expect(holding.getByText('Value', { exact: true })).toBeVisible();
  await expect(holding.locator('td:visible p').filter({ hasText: /^\+\$12,500\.00$/ })).toBeVisible();
  const table = page.getByRole('table', { name: 'Portfolio holdings and performance' });
  expect(await table.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const heading = page.getByRole('heading', { name: 'CryptoFlow Analytics', level: 1 });
  expect(await heading.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const clock = page.getByText(/^\d{2}:\d{2}:\d{2} (AM|PM)$/);
  expect(await clock.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('keeps watchlist prices and changes together without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/?tab=watchlist');
  await page.getByLabel('Add coin').selectOption('bitcoin');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const holding = page.getByRole('row', { name: /Bitcoin BTC/ });
  await expect(holding.locator('td:visible').getByText('$65,000.00', { exact: true })).toBeVisible();
  await expect(holding.locator('td:visible').getByText('+2.40%', { exact: true })).toBeVisible();
  const table = page.getByRole('table', { name: 'Tracked cryptocurrencies' });
  expect(await table.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

