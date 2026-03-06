import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './snapshots',
  // {testFileDir}/{testFileName} keeps the path readable without .ts-as-directory quirk
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFileDir}/{testFileName}/{arg}{ext}',

  // Run tests in parallel within each file
  fullyParallel: true,
  // GitHub Actions ubuntu-latest has 2 vCPUs — 4 workers causes CPU contention
  // and increases screenshot timing variability. Use 2 in CI for determinism.
  workers: process.env.CI ? 2 : undefined,

  // Retries: 0 locally (fail fast), 2 in CI (absorb single-frame flakiness)
  retries: process.env.CI ? 2 : 0,

  // Stop after 10 failures in CI — don't run all 150 tests if something is globally broken
  maxFailures: process.env.CI ? 10 : 0,

  // Locally: 'missing' — create baselines that don't exist yet, never overwrite existing ones.
  // In CI:   'none'    — NEVER auto-create or overwrite baselines. Missing baseline = test fails.
  //                      Baselines must be committed to git before CI runs.
  // Use --update-snapshots (no flag) or the update-snapshots.yml workflow for intentional updates.
  updateSnapshots: process.env.CI ? 'none' : 'missing',

  // Reporter: CI → dot + HTML report (open:'never' — no browser in CI)
  //           Local → list (verbose) + HTML report (opens on failure for quick inspection)
  reporter: process.env.CI
    ? [['dot'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'on-failure', outputFolder: 'playwright-report' }]],

  use: {
    // ⚠️ Set this to your actual dev server URL, or use an env variable:
    //   baseURL: process.env.BASE_URL || 'http://localhost:3000',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Emulate prefers-reduced-motion so CSS respects the media query
    reducedMotion: 'reduce',
  },

  expect: {
    toHaveScreenshot: {
      // animations: 'disabled' freezes CSS transitions + Web Animations API at screenshot time
      // This is already the default — listed here explicitly for visibility
      animations: 'disabled',
      maxDiffPixelRatio: 0.01, // allow up to 1% of pixels to differ
      // threshold: per-pixel color sensitivity (0–1).
      // 0.2 (Playwright default) is too permissive: allows 20% color shift per pixel.
      // Use 0.1 for serious regression detection; raise to 0.2 only for font anti-aliasing issues.
      threshold: 0.1,
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
        // Include a device descriptor for correct user agent and touch emulation.
        // Override viewport explicitly to the exact dimensions you want to test.
        ...devices['iPad (gen 7)'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Mobile',
      use: {
        // Include a device descriptor for correct mobile user agent.
        // Override viewport explicitly to avoid UA/viewport mismatch.
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
