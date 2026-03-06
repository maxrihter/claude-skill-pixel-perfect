import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: 'https://your-site.com',
    // Consistent rendering — disable animations for stable screenshots
    reducedMotion: 'reduce',
  },

  expect: {
    toHaveScreenshot: {
      // Global defaults — override per test if needed
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },

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
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
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
