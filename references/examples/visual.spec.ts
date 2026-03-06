import { test, expect } from '@playwright/test';
// For animations / fonts / lazy images — use the production fixture instead:
// import { test, expect } from '../fixtures/visual';

// ─────────────────────────────────────────────
// Basic: full page screenshot
// ─────────────────────────────────────────────
test('homepage', async ({ page }) => {
  await page.goto('/');

  // Wait for visible content — avoid waitForLoadState('networkidle')
  // networkidle is brittle (WebSockets, long-polling) and slow
  await page.waitForSelector('h1');
  await page.waitForFunction(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
  });
});

// ─────────────────────────────────────────────
// With dynamic content masked
// ─────────────────────────────────────────────
test('dashboard — mask live data', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForSelector('[data-testid="dashboard-loaded"]');

  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    mask: [
      page.locator('.live-price'),
      page.locator('.timestamp'),
      page.locator('[data-testid="apy-value"]'),
    ],
  });
});

// ─────────────────────────────────────────────
// Element-level screenshot
// ─────────────────────────────────────────────
test('hero section only', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.hero');

  const hero = page.locator('.hero');
  await expect(hero).toHaveScreenshot('hero.png');
});

// ─────────────────────────────────────────────
// Higher tolerance for content-heavy pages
// ─────────────────────────────────────────────
test('blog page — relaxed threshold', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForSelector('article');

  await expect(page).toHaveScreenshot('blog.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.03, // 3% — allows for minor font rendering differences
    threshold: 0.3,
  });
});
