import { test as base, expect, type Page } from '@playwright/test';

/**
 * Production-ready visual test fixture.
 *
 * Architecture: two-phase approach
 *   Phase 1 — addInitScript (runs BEFORE any page JS):
 *     - IntersectionObserver mock (lazy images load immediately, fires via setTimeout(0))
 *     - window.__PLAYWRIGHT__ flag (for app-level animation disabling)
 *   Phase 2 — waitForPageReady() (call explicitly after page.goto()):
 *     - Wait for custom fonts (document.fonts.ready)
 *     - Wait for all images to decode
 *     - Freeze GSAP timeline (if present)
 *     - Double rAF — browser settles final paint
 *
 * Usage:
 *   import { test, expect, waitForPageReady } from '../fixtures/visual';
 *
 *   test('homepage', async ({ page }) => {
 *     await page.goto('/');
 *     await page.locator('h1').waitFor();   // wait for key element
 *     await waitForPageReady(page);         // stabilize before screenshot
 *     await expect(page).toHaveScreenshot('homepage.png', { fullPage: true });
 *   });
 *
 * Framer Motion (skipAnimations):
 *   The fixture sets window.__PLAYWRIGHT__ = true before page JS runs.
 *   In your app (e.g., layout.tsx or _app.tsx), add:
 *
 *   import { MotionGlobalConfig } from 'framer-motion'; // or 'motion/react'
 *   if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT__) {
 *     MotionGlobalConfig.skipAnimations = true;
 *   }
 *
 * ⚠️ IntersectionObserver mock trade-off:
 *   The mock makes all elements immediately "in-viewport" on first observe().
 *   This ensures lazy-loaded images appear in full-page screenshots.
 *   However, it means viewport-dependent UI (infinite scroll, sticky headers that
 *   hide when out of viewport, load-more triggers) will render in a state that
 *   never exists in production. If your tests include such components, consider
 *   removing the mock and using a scroll-based warm-up instead:
 *
 *     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
 *     await page.evaluate(() => window.scrollTo(0, 0));
 */

/**
 * Stabilizes the page before taking a screenshot.
 * Call explicitly after page.goto() and after waiting for key content.
 * Works for both full-page navigations and SPA route changes.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // 1. Wait for all custom fonts to finish loading.
  //    Note: page.evaluate() correctly awaits the Promise returned by document.fonts.ready.
  //    page.waitForFunction(() => document.fonts.ready) is WRONG — Promise is always truthy.
  await page.evaluate(() => document.fonts.ready);

  // 2. Wait for all images to fully load.
  //    Uses img.decode() which is race-free: unlike img.onload, it does not
  //    miss images that completed loading between the check and handler assignment.
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? Promise.resolve()
          : img.decode().catch(() => {
              /* ignore decode errors (broken images, CORS) */
            })
      )
    )
  );

  // 3. Freeze GSAP timeline in final state (if GSAP is present on the page).
  //    Must run after page load — GSAP may be loaded via dynamic import.
  //    The guard is best-effort: if GSAP loads after this point, animations stay live.
  //    For guaranteed freeze, use CSS injection in addInitScript instead:
  //      page.addInitScript(() => {
  //        const s = document.createElement('style');
  //        s.textContent = '*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }';
  //        document.head.appendChild(s);
  //      })
  await page.evaluate(() => {
    const g = (window as any).gsap;
    if (g?.globalTimeline) {
      g.globalTimeline.pause();
    }
  });

  // 4. Double rAF — let the browser settle one final paint frame.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // ── Phase 1: addInitScript — runs BEFORE any page JavaScript ──────────────
    // These scripts run before page.goto() and re-apply on every navigation
    // (including SPA pushState). Register all init scripts in a single call
    // to minimize round-trips to the browser process.
    await page.addInitScript(() => {
      // Set window.__PLAYWRIGHT__ flag for app-level animation disabling.
      // Framer Motion, custom animation libs, etc. can check this flag.
      (window as any).__PLAYWRIGHT__ = true;

      // Mock IntersectionObserver so lazy loaders fire immediately.
      // Must be in addInitScript — after page JS runs, components already hold
      // references to the original IntersectionObserver class.
      //
      // setTimeout(0): fires after framework finishes registering observers.
      // Direct (synchronous) callback invocation breaks frameworks that check
      // state in the constructor before observe() is called.
      window.IntersectionObserver = class MockIntersectionObserver
        implements IntersectionObserver
      {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = '0px';
        readonly thresholds: ReadonlyArray<number> = [0];

        private _callback: IntersectionObserverCallback;

        constructor(callback: IntersectionObserverCallback) {
          this._callback = callback;
        }

        observe(target: Element): void {
          setTimeout(() => {
            const rect = target.getBoundingClientRect();
            this._callback(
              [
                {
                  isIntersecting: true,
                  intersectionRatio: 1,
                  target,
                  boundingClientRect: rect,
                  intersectionRect: rect,
                  rootBounds: {
                    x: 0,
                    y: 0,
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    bottom: window.innerHeight,
                    right: window.innerWidth,
                    toJSON() {
                      return {
                        x: 0,
                        y: 0,
                        top: 0,
                        left: 0,
                        width: window.innerWidth,
                        height: window.innerHeight,
                        bottom: window.innerHeight,
                        right: window.innerWidth,
                      };
                    },
                  } as DOMRectReadOnly,
                  time: performance.now(),
                } as IntersectionObserverEntry,
              ],
              this as unknown as IntersectionObserver
            );
          }, 0);
        }

        unobserve(_target: Element): void {}
        disconnect(): void {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
      };
    });

    // ── Phase 2: page is available to tests ───────────────────────────────────
    // Call waitForPageReady(page) explicitly after page.goto() and locator.waitFor().
    await use(page);
  },
});

export { expect };
