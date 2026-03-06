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
| Need example config / test file | → [Examples](references/examples/) |

## Core Workflow

```
1. Install @playwright/test
2. Write tests with toHaveScreenshot()
3. Capture baseline  →  npx playwright test --update-snapshots
4. Make code changes
5. Run comparison   →  npx playwright test
6. Review diffs     →  npx playwright show-report
```

## Quick Commands

```bash
# First run — create baseline
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
  await page.waitForLoadState('networkidle');
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

## Recommended Viewports

| Viewport | Width | Height |
|---|---|---|
| Desktop | 1440 | 900 |
| Tablet | 768 | 1024 |
| Mobile | 375 | 812 |

## Reference Files

- [Setup & Config](references/setup/README.md) — install, `playwright.config.ts`, project structure
- [Baseline Management](references/baseline/README.md) — capture, update, mask dynamic content
- [Running Comparisons](references/comparison/README.md) — interpret diffs, fix false positives
- [Examples](references/examples/) — ready-to-use config + test files
