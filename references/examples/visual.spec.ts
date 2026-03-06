// Basic tests — standard @playwright/test
import { test, expect } from '@playwright/test';

// With the production fixture (fonts, JS animations, lazy images):
// import { test, expect, waitForPageReady } from '../fixtures/visual';

// ─────────────────────────────────────────────
// Basic: full page screenshot
// ─────────────────────────────────────────────
test('homepage', async ({ page }) => {
  await page.goto('/');

  // locator.waitFor() is the modern API — prefer over page.waitForSelector()
  await page.locator('h1').waitFor();

  // If using fixture: await waitForPageReady(page);

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
  });
});

// ─────────────────────────────────────────────
// With dynamic content masked
// ─────────────────────────────────────────────
test('dashboard — mask live data', async ({ page }) => {
  await page.goto('/dashboard');
  await page.locator('[data-testid="dashboard-loaded"]').waitFor();

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
  await page.locator('.hero').waitFor();

  await expect(page.locator('.hero')).toHaveScreenshot('hero.png');
});

// ─────────────────────────────────────────────
// Higher tolerance for content-heavy pages
// ─────────────────────────────────────────────
test('blog page — relaxed threshold', async ({ page }) => {
  await page.goto('/blog');
  await page.locator('article').waitFor();

  await expect(page).toHaveScreenshot('blog.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.03, // 3% — allows for minor font rendering differences
    threshold: 0.3,
  });
});

// ─────────────────────────────────────────────
// With fixture: fonts + JS animations + lazy images
// ─────────────────────────────────────────────
// import { test, expect, waitForPageReady } from '../fixtures/visual';
//
// test('page with animations', async ({ page }) => {
//   await page.goto('/animated-page');
//   await page.locator('h1').waitFor();
//   await waitForPageReady(page);   // freeze fonts, images, GSAP
//   await expect(page).toHaveScreenshot('animated-page.png', { fullPage: true });
// });
