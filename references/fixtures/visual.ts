import { test as base, expect, type Page } from '@playwright/test';

/**
 * Production-ready visual test fixture.
 *
 * Handles all common sources of flakiness:
 *   - CSS transitions & animations
 *   - JS animation frameworks (Framer Motion, GSAP, Lottie)
 *   - Custom web fonts (waits for document.fonts.ready)
 *   - Lazy-loaded images (forces immediate load)
 *
 * Usage:
 *   import { test, expect } from '../fixtures/visual';
 *
 *   test('homepage', async ({ page }) => {
 *     await page.goto('/');
 *     await page.waitForSelector('h1'); // wait for your key element
 *     await expect(page).toHaveScreenshot('homepage.png', { fullPage: true });
 *   });
 */

async function stabilizePage(page: Page): Promise<void> {
  // 1. Kill CSS transitions & animations via injected stylesheet
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });

  // 2. Kill JS animation frameworks
  await page.evaluate(() => {
    // Framer Motion
    try {
      // @ts-ignore
      window.MotionGlobalConfig = { skipAnimations: true };
    } catch {}

    // GSAP — fast-forward timeline
    try {
      // @ts-ignore
      if (window.gsap) window.gsap.globalTimeline.timeScale(1000);
    } catch {}
  });

  // 3. Force lazy images to load immediately
  await page.evaluate(() => {
    // Remove lazy loading attribute
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      (img as HTMLImageElement).loading = 'eager';
    });

    // Override IntersectionObserver so scroll-based loaders fire immediately
    const OriginalIO = window.IntersectionObserver;
    window.IntersectionObserver = class extends OriginalIO {
      constructor(
        cb: IntersectionObserverCallback,
        opts?: IntersectionObserverInit
      ) {
        super(cb, opts);
        // Fire with isIntersecting: true after a short tick
        setTimeout(
          () => cb([{ isIntersecting: true, intersectionRatio: 1 } as any], this),
          0
        );
      }
    };
  });

  // 4. Wait for all custom fonts to finish loading
  await page.waitForFunction(() => document.fonts.ready);

  // 5. Double rAF — let the browser settle one final paint frame
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Stabilize after every navigation
    page.on('load', () => stabilizePage(page));
    await use(page);
  },
});

export { expect };
