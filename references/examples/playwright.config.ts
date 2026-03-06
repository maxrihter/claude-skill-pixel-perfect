import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './snapshots',
  // {testFileDir}/{testFileName} keeps the path readable without .ts-as-directory quirk
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFileDir}/{testFileName}/{arg}{ext}',

  // Retries: 0 locally (fail fast), 2 in CI (absorb single-frame flakiness)
  retries: process.env.CI ? 2 : 0,

  // Stop after 10 failures in CI — don't run all 150 tests if something is globally broken
  maxFailures: process.env.CI ? 10 : 0,

  // 'missing' — only create snapshots that don't exist yet, never overwrite existing ones.
  // Use --update-snapshots (no flag) to overwrite changed ones intentionally.
  // Requires @playwright/test >= 1.50
  updateSnapshots: 'missing',

  use: {
    baseURL: 'https://your-site.com',
    // Emulate prefers-reduced-motion so CSS respects the media query
    reducedMotion: 'reduce',
  },

  expect: {
    toHaveScreenshot: {
      // animations: 'disabled' freezes CSS transitions + Web Animations API at screenshot time
      // This is already the default — listed here explicitly for visibility
      animations: 'disabled',
      maxDiffPixelRatio: 0.01, // allow up to 1% of pixels to differ
      threshold: 0.2,          // per-pixel color sensitivity (0–1)
    },
  },

  // Locally: missing baselines → tests pass (no snapshot = skip, not fail)
  // In CI:   missing baselines → tests fail (must be committed to git)
  // ⚠️ Risk: locally you won't notice if you forgot to commit new baselines.
  //    Mitigation: always run `git status snapshots/` before pushing.
  ignoreSnapshots: !process.env.CI,

  projects: [
    {
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Tablet',
      use: {
        // Don't spread a device preset — it would override the viewport below
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'Mobile',
      use: {
        // Don't spread devices['iPhone 13'] and override viewport —
        // that creates UA/viewport mismatch (UA says 390px, actual is 375px).
        // Specify all required props explicitly.
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
