import { test, expect } from '@playwright/test';

test.describe('Health Logging', () => {
  test('log page redirects unauthenticated', async ({ page }) => {
    await page.goto('/log');
    await expect(page).toHaveURL(/sign-in/, { timeout: 5000 });
  });

  test('API health-logs returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/health-logs', {
      data: { pet_id: '00000000-0000-0000-0000-000000000000', log_date: '2026-01-01' },
    });
    expect(res.status()).toBe(401);
  });

  test('API rate-limit-check responds', async ({ request }) => {
    const res = await request.post('/api/auth/rate-limit-check', {
      data: { route: 'sign-in' },
    });
    // Should be 200 (not rate-limited on first request) or 429
    expect([200, 429]).toContain(res.status());
  });
});
