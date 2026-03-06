---
name: pixel-perfect
description: >
  Visual regression testing — pixel-by-pixel screenshot comparison against a baseline.
  TRIGGER when: user mentions "pixel-perfect", "visual regression", "screenshot diff",
  "UI looks broken after changes", "compare before/after screenshots", "visual QA",
  "catch visual bugs", "design implementation check", or wants to verify that code
  changes didn't break the UI visually.
  DO NOT TRIGGER when: user wants functional/behavioral testing (use playwright-skill),
  just wants a single screenshot (use screenshots skill), or asks about accessibility.
  Use this skill to set up, run, and interpret visual regression tests with Playwright.
metadata:
  category: technique
  triggers: pixel-perfect, visual regression, screenshot diff, visual QA, UI comparison, toHaveScreenshot, visual bug, design check, before after screenshot
allowed-tools: Bash, Read, Write, Glob
---

# Pixel-Perfect Visual Regression Testing

Compare UI screenshots against a baseline — pixel by pixel. Catch unintended visual
changes after code edits. Built on `@playwright/test` native `toHaveScreenshot()` —
no third-party services, no extra infrastructure.

## When to Use This Skill

| Scenario | Action |
|---|---|
| First setup, no baseline yet | → [Setup](references/setup/README.md) then [Baseline](references/baseline/README.md) |
| Baseline exists, run comparison | → [Comparison](references/comparison/README.md) |
| Tests failing with false positives | → [Comparison → Fixes](references/comparison/README.md) |
| Animations / fonts / lazy images flaky | → [Fixture](references/fixtures/visual.ts) |
| Need example config / test file | → [Examples](references/examples/) |
| Setting up CI/CD pipeline | → [GitHub Actions](references/setup/README.md#cicd) |

## Core Workflow

```
1. Install @playwright/test
2. Write tests with toHaveScreenshot()
3. Capture baseline  →  docker run ... npx playwright test --update-snapshots
4. Make code changes
5. Run comparison   →  npx playwright test
6. Review diffs     →  npx playwright show-report
```

## Quick Commands

```bash
# First run — create baseline (use Docker for cross-platform consistency)
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots

# Compare against baseline
npx playwright test

# Open HTML diff report
npx playwright show-report

# Test single file
npx playwright test tests/visual.spec.ts

# Test specific viewport only
npx playwright test --project=Desktop
```

## Minimal Test Example

```typescript
import { test, expect } from '@playwright/test';

test('homepage', async ({ page }) => {
  await page.goto('/');

  // Wait for key content — not networkidle (brittle, deprecated)
  await page.waitForSelector('h1');
  await page.waitForFunction(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
```

## Key Options

| Option | Default | Purpose |
|--------|---------|---------|
| `maxDiffPixelRatio` | `0` | % pixels allowed to differ (use `0.01` for real sites) |
| `threshold` | `0.2` | Per-pixel color sensitivity (raise to `0.3` for font issues) |
| `mask` | `[]` | Locators to ignore (prices, dates, animations) |
| `fullPage` | `false` | Capture entire scrollable page |
| `animations` | `'allow'` | Set to `'disabled'` to freeze CSS/Web Animations |

## Recommended Viewports

| Viewport | Width | Height |
|---|---|---|
| Desktop | 1440 | 900 |
| Tablet | 768 | 1024 |
| Mobile | 375 | 812 |

## Reference Files

- [Setup & Config](references/setup/README.md) — install, config, Docker, CI warnings
- [Baseline Management](references/baseline/README.md) — capture, update, cross-platform
- [Running Comparisons](references/comparison/README.md) — interpret diffs, fix false positives
- [Production Fixture](references/fixtures/visual.ts) — fonts, animations, lazy images
- [Examples](references/examples/) — ready-to-use config + test files
