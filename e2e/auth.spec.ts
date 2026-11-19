import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const publishableKey = process.env.E2E_SUPABASE_PUBLISHABLE_KEY;

test.describe('authenticated cloud storage', () => {
  test.skip(!supabaseUrl || !publishableKey, 'Local Supabase credentials are not configured');

  test('keeps cloud data isolated and preserves device-local data', async ({ page, authenticatedPage }) => {
    const email = `cryptoflow-${randomUUID()}@example.test`;
    const password = `Cloud-${randomUUID()}-123`;
    const mobile = test.info().project.name === 'mobile';
    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create an account' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Create an account' }).click();
    await expect(page.getByRole('heading', { name: 'Create a cloud account' })).toBeVisible();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Cloud account', { exact: true }).first()).toBeVisible();

    await page.goto('/?tab=portfolio');
    await page.getByRole('button', { name: 'Add asset' }).first().click();
    await page.getByLabel('Quantity', { exact: true }).fill('0.75');
    await page.getByLabel('Purchase price (USD)').fill('42000');
    await page.getByRole('button', { name: 'Save asset' }).click();
    await expect(page.getByRole('cell', { name: 'Bitcoin BTC' })).toBeVisible();

    const deviceButton = page.getByRole('button', { name: 'View device data' });
    if (mobile) await deviceButton.scrollIntoViewIfNeeded();
    await deviceButton.click();
    await expect(page).toHaveURL(/storage=local/);
    await expect(page.getByText('No assets yet')).toBeVisible();
    await page.getByRole('button', { name: 'Add asset' }).first().click();
    await page.getByLabel('Quantity', { exact: true }).fill('2');
    await page.getByLabel('Purchase price (USD)').fill('1000');
    await page.getByRole('button', { name: 'Save asset' }).click();
    await expect(page.getByRole('cell', { name: 'Bitcoin BTC' })).toBeVisible();

    const cloudButton = page.getByRole('button', { name: 'Use cloud account' });
    if (mobile) await cloudButton.scrollIntoViewIfNeeded();
    await cloudButton.click();
    await expect(page).not.toHaveURL(/storage=local/);
    await expect(page.getByRole('cell', { name: '0.75' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('cell', { name: '0.75' })).toBeVisible();

    const secondPage = authenticatedPage;
    const secondEmail = `cryptoflow-${randomUUID()}@example.test`;
    await secondPage.goto('http://127.0.0.1:3000/auth');
    const secondSwitch = secondPage.getByRole('button', { name: 'Create an account' });
    if (mobile) await secondSwitch.scrollIntoViewIfNeeded();
    await secondSwitch.click();
    await expect(secondPage.getByRole('heading', { name: 'Create a cloud account' })).toBeVisible();
    await secondPage.getByLabel('Email', { exact: true }).fill(secondEmail);
    await secondPage.getByLabel('Password', { exact: true }).fill(password);
    await secondPage.getByRole('button', { name: 'Create account' }).click();
    await expect(secondPage).toHaveURL(/\/$/);
    await secondPage.goto('/?tab=portfolio');
    await expect(secondPage.getByText('No assets yet')).toBeVisible();
    const signOutButton = page.getByRole('button', { name: 'Sign out' });
    if (mobile) await signOutButton.scrollIntoViewIfNeeded();
    await signOutButton.click();
    await expect(page.getByText('This device', { exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '0.75' })).toHaveCount(0);
  });
});
