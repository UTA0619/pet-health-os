import { test, expect } from '@playwright/test';

// Test dashboard in unauthenticated state (redirects)
test.describe('Dashboard', () => {
  test('redirects to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/, { timeout: 5000 });
  });

  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    // Should have some content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('sign-in page has correct form elements', async ({ page }) => {
    await page.goto('/sign-in');
    const emailField = page.getByLabel(/メール|email/i).first();
    const passwordField = page.getByLabel(/パスワード|password/i).first();
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(page.getByRole('button', { name: /ログイン|sign.?in/i })).toBeVisible();
  });
});
