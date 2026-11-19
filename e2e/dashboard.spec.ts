import { expect, test } from '@playwright/test';

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
