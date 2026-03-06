---
name: pixel-perfect
description: >
  Visual regression testing — pixel-by-pixel screenshot comparison against a baseline.
  TRIGGER when: user mentions "pixel-perfect", "visual regression", "screenshot diff",
  "snapshot mismatch", "toHaveScreenshot", "UI looks broken after changes",
  "compare before/after screenshots", "visual QA", "catch visual bugs",
  "design implementation check", "tests failing with screenshot", or wants to verify
  that code changes didn't break the UI visually.
  DO NOT TRIGGER when: user wants functional/behavioral testing (use playwright-skill),
  just wants a single screenshot (use screenshots skill), or asks about accessibility.
metadata:
  category: technique
  triggers: pixel-perfect, visual regression, screenshot diff, visual QA, UI comparison, toHaveScreenshot, visual bug, design check, before after screenshot, snapshot mismatch, baseline
allowed-tools: Bash, Read, Write, Glob
---

# Pixel-Perfect Visual Regression Testing

Compare UI screenshots pixel-by-pixel against a baseline. Catch unintended visual changes. Built on `@playwright/test` — no third-party services.

## Before You Start — Check State First

Run these before choosing a workflow:

```bash
ls playwright.config.ts 2>/dev/null && echo "config exists" || echo "no config"
ls snapshots/ 2>/dev/null && echo "baselines exist" || echo "no baselines"
lsof -i :3000 2>/dev/null | head -1 || echo "no server on :3000"
```

## Decision Tree

```
What's the situation?
│
├─ No playwright.config.ts
│  └─ → Workflow A: Full Setup
│
├─ Config exists, no baselines yet
│  └─ → Workflow B: Capture Baseline
│
├─ Tests failing with "screenshot doesn't match"
│  ├─ Design changed intentionally → Workflow C: Update Baseline
│  └─ Unexpected diff (bug)        → Workflow D: Debug Comparison
│
├─ Tests flaky (pass sometimes, fail sometimes)
│  └─ → Workflow E: Fix Flakiness with Fixture
│
└─ Need CI/CD setup
   └─ → Workflow F: GitHub Actions
```

---

## Workflow A: Full Setup

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Create config → copy from [references/examples/playwright.config.ts](references/examples/playwright.config.ts)
Create test file → copy from [references/examples/visual.spec.ts](references/examples/visual.spec.ts)
Then continue → **Workflow B**

Full guide: [references/setup/README.md](references/setup/README.md)

---

## Workflow B: Capture Baseline

```bash
# Recommended: inside Docker (consistent with Linux CI — avoids font rendering diffs)
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots

git add snapshots/ && git commit -m "chore: add visual baselines"
```

> **Why Docker?** macOS renders fonts differently than Linux CI. Baselines captured on macOS will produce false failures in CI. Generate once in Linux, commit, everyone uses the same baseline.

Full guide: [references/baseline/README.md](references/baseline/README.md)

---

## Workflow C: Update Baseline

When a design change is intentional:

```bash
# Update only changed snapshots (unchanged baselines stay untouched)
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots

# Add only NEW test baselines (never overwrites existing ones)
npx playwright test --update-snapshots=missing

git add snapshots/ && git commit -m "chore: update visual baselines — [reason]"
```

> ⚠️ Never auto-update snapshots in CI. Use the [update-snapshots workflow](.github/workflows/update-snapshots.yml) for intentional updates — it requires a reason and commits with attribution.

---

## Workflow D: Debug Comparison

```bash
npx playwright test          # run and see failures
npx playwright show-report   # open HTML diff report (Expected | Actual | Diff)
```

Diff guide + fix patterns: [references/comparison/README.md](references/comparison/README.md)

---

## Workflow E: Fix Flakiness with Fixture

For pages with custom fonts, JS animations (Framer Motion, GSAP), or lazy-loaded images.

1. Copy fixture to your project: [references/fixtures/visual.ts](references/fixtures/visual.ts)
2. Replace the import in your test:
   ```typescript
   import { test, expect, waitForPageReady } from '../fixtures/visual';
   ```
3. Add before `toHaveScreenshot`:
   ```typescript
   await page.locator('h1').waitFor();
   await waitForPageReady(page);  // fonts + images + GSAP freeze
   ```

The fixture uses `addInitScript` (runs before any app JS) to mock `IntersectionObserver` and set `window.__PLAYWRIGHT__ = true`. For Framer Motion — see the fixture file for the app-level integration pattern.

---

## Workflow F: GitHub Actions

Copy to your project:
- [.github/workflows/visual-tests.yml](.github/workflows/visual-tests.yml) — runs on every PR
- [.github/workflows/update-snapshots.yml](.github/workflows/update-snapshots.yml) — manual trigger only

Requires: baselines committed to git. `CI=true` is set automatically by GitHub Actions.

---

## Key Options

| Option | Default | Use |
|--------|---------|-----|
| `maxDiffPixelRatio` | `0` | % pixels allowed to differ (`0.01` = 1%) |
| `threshold` | `0.2` | Per-pixel sensitivity — raise to `0.3` for font issues |
| `mask` | `[]` | Locators to black out (prices, timestamps, live data) |
| `fullPage` | `false` | Capture entire scrollable page |
| `animations` | `'disabled'` | Default — CSS + Web Animations API stopped |

## Quick Commands

```bash
npx playwright test                             # compare vs baseline
npx playwright test --project=Desktop           # specific viewport
npx playwright test tests/visual.spec.ts        # specific file
npx playwright show-report                      # open diff report
npx playwright test --update-snapshots          # update changed baselines
npx playwright test --update-snapshots=missing  # only add new baselines
```
