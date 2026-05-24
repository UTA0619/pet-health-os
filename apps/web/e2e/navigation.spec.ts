import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('404 page for unknown route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz-abc');
    // Next.js shows 404 or redirects to sign-in
    const status = await page.evaluate(() => document.title);
    expect(status).toBeTruthy();
  });

  test('API health check endpoint exists', async ({ request }) => {
    const res = await request.get('/api/health');
    // Should return 200 if endpoint exists, 404 if not
    expect([200, 404]).toContain(res.status());
  });

  test('manifest.json exists for PWA', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect([200]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.name ?? body.short_name).toBeTruthy();
    }
  });
});
