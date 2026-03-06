import { test as base, expect, type Page } from '@playwright/test';

/**
 * Production-ready visual test fixture.
 *
 * Architecture: two-phase approach
 *   Phase 1 — addInitScript (runs BEFORE any page JS):
 *     - Override getBoundingClientRect globally (returns realistic values before layout)
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
 *   Or via env variable in playwright.config.ts webServer:
 *     env: { NEXT_PUBLIC_E2E: 'true' }
 *   And in your app: if (process.env.NEXT_PUBLIC_E2E === 'true') { ... }
 */

/**
 * Stabilizes the page before taking a screenshot.
 * Call explicitly after page.goto() and after waiting for key content.
 * Works for both full-page navigations and SPA route changes.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // 1. Wait for all custom fonts to finish loading
  //    Note: page.evaluate() correctly awaits the Promise returned by document.fonts.ready
  //    page.waitForFunction(() => document.fonts.ready) is WRONG — Promise is always truthy
  await page.evaluate(() => document.fonts.ready);

  // 2. Wait for all images to complete loading
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = img.onerror = () => resolve();
            })
      )
    )
  );

  // 3. Freeze GSAP timeline in final state (if GSAP is present on the page)
  //    pause() stops animations in current state
  //    globalTimeline must be paused AFTER page has loaded and GSAP is initialized
  await page.evaluate(() => {
    const g = (window as any).gsap;
    if (g?.globalTimeline) {
      g.globalTimeline.pause();
    }
  });

  // 4. Double rAF — let the browser settle one final paint frame
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
    // These must be registered before page.goto() is called.
    // They automatically re-apply on every navigation (including SPA pushState).

    // Mock IntersectionObserver so lazy loaders fire immediately.
    // Must be in addInitScript — after page JS runs, components already have
    // references to the original IntersectionObserver class.
    await page.addInitScript(() => {
      // Override getBoundingClientRect globally.
      // addInitScript runs before layout, so getBoundingClientRect() returns {width:0, height:0}
      // on all elements. Lazy loaders that check element dimensions would see empty rects
      // and refuse to load. This override returns a realistic stand-in before first layout.
      // After layout completes, the real implementation is called and returns actual values.
      const _origGBCR = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        const rect = _origGBCR.call(this);
        if (rect.width === 0 && rect.height === 0) {
          return {
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            bottom: 200,
            right: 400,
            width: 400,
            height: 200,
            toJSON() {
              return this;
            },
          } as DOMRect;
        }
        return rect;
      };

      // Full IntersectionObserverEntry mock (all required fields per W3C spec).
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
          // setTimeout(0): defer until after framework registers all observers.
          setTimeout(() => {
            const rect = target.getBoundingClientRect(); // uses override above — realistic values
            this._callback(
              [
                {
                  isIntersecting: true,
                  intersectionRatio: 1,
                  target,
                  boundingClientRect: rect,
                  intersectionRect: rect,
                  // Use viewport dimensions (not null) to satisfy loaders that check
                  // whether the element is within the viewport bounds.
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
                      return this;
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

    // Set window.__PLAYWRIGHT__ flag for app-level animation disabling.
    // In your app, check this flag to disable Framer Motion / other frameworks.
    // See usage comment at top of this file.
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT__ = true;
    });

    // ── Phase 2: page is available to tests ───────────────────────────────────
    // Tests call waitForPageReady(page) explicitly after goto() and content wait.
    await use(page);
  },
});

export { expect };
