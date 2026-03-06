import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: 'https://your-site.com',
    // Disable CSS animations via prefers-reduced-motion media query
    reducedMotion: 'reduce',
  },

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',    // freeze CSS transitions & Web Animations API
      maxDiffPixelRatio: 0.01,   // 1% of pixels allowed to differ
      threshold: 0.2,            // per-pixel color sensitivity (0–1)
    },
  },

  // Locally: missing baselines → tests pass (won't block local dev)
  // In CI: missing baselines → tests fail (baselines must be committed to git)
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
        // Don't spread iPad device preset — it overrides viewport below
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        hasTouch: true,
      },
    },
    {
      name: 'Mobile',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
