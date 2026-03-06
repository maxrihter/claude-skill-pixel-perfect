# Setup

## Install

```bash
npm init -y  # if no package.json
npm install -D @playwright/test
npx playwright install chromium
```

## Config: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './snapshots',        // baseline screenshots stored here
  use: {
    baseURL: 'https://your-site.com',
  },
  projects: [
    {
      name: 'Desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

## Test File Template: `tests/visual.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('homepage', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,   // 1% tolerance
    fullPage: true,
  });
});
```

## Threshold Options

| Option | Description | Default |
|--------|-------------|---------|
| `maxDiffPixelRatio` | % of pixels allowed to differ (0–1) | 0 |
| `maxDiffPixels` | absolute pixel count allowed | — |
| `threshold` | per-pixel color sensitivity (0–1) | 0.2 |

Use `maxDiffPixelRatio: 0.01` for real-world sites (fonts, anti-aliasing).
