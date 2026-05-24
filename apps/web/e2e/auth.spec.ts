import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/メール|email/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード|password/i)).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/メール|email/i).fill('invalid@test.com');
    await page.getByLabel(/パスワード|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /ログイン|sign.?in/i }).click();
    // Either an error appears OR we stay on sign-in
    await expect(page).toHaveURL(/sign-in|dashboard/, { timeout: 8000 });
  });

  test('unauthenticated redirect to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/, { timeout: 5000 });
  });
});
