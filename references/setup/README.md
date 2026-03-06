# Setup

## Install

```bash
npm init -y  # if no package.json
npm install -D @playwright/test
npx playwright install chromium
```

## Config: `playwright.config.ts`

→ Full example: [examples/playwright.config.ts](../examples/playwright.config.ts)

Key options:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: 'https://your-site.com',
    reducedMotion: 'reduce',   // disable CSS animations via media query
  },

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',  // freeze CSS transitions & Web Animations API
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },

  // Locally: missing baselines → tests pass (won't block dev workflow)
  // In CI:   missing baselines → tests fail (baselines must be committed)
  ignoreSnapshots: !process.env.CI,
});
```

## Test File Template

```typescript
import { test, expect } from '@playwright/test';
// For JS animations / font loading / lazy images — use the production fixture:
// import { test, expect } from '../fixtures/visual';

test('homepage', async ({ page }) => {
  await page.goto('/');

  // ✅ Wait for visible content (specific selector)
  await page.waitForSelector('h1');
  // ✅ Wait for web fonts to finish loading
  await page.waitForFunction(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
```

> **Why not `waitForLoadState('networkidle')`?**
> It waits for 500ms of zero network activity — broken by WebSockets, long-polling, and background analytics. It's slow, brittle, and [discouraged by Playwright maintainers](https://playwright.dev/docs/best-practices). Use element-based waits (`waitForSelector`) and `document.fonts.ready` instead.

## Threshold Options

| Option | Description | Default |
|--------|-------------|---------|
| `maxDiffPixelRatio` | % of pixels allowed to differ (0–1) | `0` |
| `maxDiffPixels` | absolute pixel count allowed | — |
| `threshold` | per-pixel color sensitivity (0–1) | `0.2` |

Use `maxDiffPixelRatio: 0.01` for real-world sites (fonts, anti-aliasing).

## Cross-Platform Consistency (macOS vs Linux CI)

**Problem:** Screenshots taken on macOS render fonts differently than Linux CI.
Baselines captured locally will fail in CI — different font hinting, subpixel rendering.

**Solution:** Generate baselines inside Docker, matching the Linux CI environment:

```bash
# Run once to generate/update baselines — uses same Linux renderer as CI
docker run --rm \
  -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots
```

Commit the resulting `snapshots/` to git. All team members use the same Linux baselines.

> **Match the Docker image version to your `@playwright/test` version.**
> Check available tags: https://mcr.microsoft.com/v2/playwright/tags/list

> **⚠️ Never run `--update-snapshots` in CI automatically.**
> Baselines are the source of truth. Silent auto-updates hide regressions.
> Use the [update-snapshots workflow](../../.github/workflows/update-snapshots.yml) for intentional updates.

## Project Structure

```
my-project/
├── playwright.config.ts
├── tests/
│   └── visual.spec.ts
├── fixtures/
│   └── visual.ts              # production fixture (fonts, animations, lazy images)
├── snapshots/                 # committed to git — the baseline
│   ├── Desktop/
│   └── Mobile/
└── .github/
    └── workflows/
        ├── visual-tests.yml       # runs on every PR
        └── update-snapshots.yml   # manual trigger only
```
