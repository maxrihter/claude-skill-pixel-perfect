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

## Before You Start — Check State

Run all three commands, then use the table to choose your workflow.

```bash
ls playwright.config.ts 2>/dev/null && echo "CONFIG_EXISTS" || echo "CONFIG_MISSING"
ls snapshots/ 2>/dev/null && echo "BASELINES_EXIST" || echo "BASELINES_MISSING"
lsof -i :3000 2>/dev/null | head -1 && echo "SERVER_RUNNING" || echo "NO_SERVER"
```

| Config | Baselines | Server | → Do this |
|--------|-----------|--------|-----------|
| CONFIG_MISSING | any | any | **→ Workflow A** (Full Setup) |
| CONFIG_EXISTS | BASELINES_MISSING | SERVER_RUNNING | **→ Workflow B** (Capture Baseline) |
| CONFIG_EXISTS | BASELINES_EXIST | SERVER_RUNNING | Run `npx playwright test` — compare vs baseline |
| CONFIG_EXISTS | any | NO_SERVER | STOP. Tell the user: "Dev server not running. Start it first, then re-check." |
| CONFIG_EXISTS | BASELINES_MISSING | NO_SERVER | STOP. Tell the user: "No baselines and no dev server. Start the server first." |

Do not guess the next step — use the table.

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
│  │
│  │  STOP. Ask the user:
│  │  "Was this visual change intentional (design update) or unexpected (possible bug)?"
│  │  Wait for an explicit answer — do NOT infer from context.
│  │
│  ├─ "Intentional" → Workflow C: Update Baseline
│  └─ "Bug" / "Unexpected" → Workflow D: Debug Comparison
│
├─ Tests flaky (pass sometimes, fail sometimes)
│  └─ → Workflow E: Fix Flakiness with Fixture
│
└─ Need CI/CD setup
   └─ → Workflow F: GitHub Actions
```

---

## Workflow A: Full Setup

**Exit condition:** `npx playwright test` runs without config errors.

**Step 1.** Check for existing `package.json`:
```bash
ls package.json 2>/dev/null && echo "EXISTS" || echo "MISSING"
```
If MISSING: run `npm init -y` first. If EXISTS: skip — do not re-initialize.

**Step 2.** Install Playwright:
```bash
npm install -D @playwright/test
npx playwright install chromium
```
If this fails: check Node.js version (`node -v` — requires v18+).

**Step 3.** Copy config and test file into the project:
```bash
cp "${CLAUDE_SKILL_DIR}/references/examples/playwright.config.ts" ./playwright.config.ts
mkdir -p tests
cp "${CLAUDE_SKILL_DIR}/references/examples/visual.spec.ts" ./tests/visual.spec.ts
```

**Step 4.** Update `baseURL` in `playwright.config.ts` to match the dev server URL.

**Workflow A complete** → continue to **Workflow B**.

Full guide: [references/setup/README.md](references/setup/README.md)

---

## Workflow B: Capture Baseline

**Exit condition:** `snapshots/` directory exists with PNG files and is committed to git.

**Step 1.** Verify the dev server responds:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
Expected: `200`. If not: STOP. Tell the user the server is not responding and ask them to start it.

**Step 2.** Capture baselines inside Docker (matches Linux CI — avoids font rendering diffs):
```bash
docker run --rm --ipc=host -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots
```

If Docker is not available: run locally with a warning — baselines captured on macOS will produce false failures in Linux CI. For local-only use this is acceptable.
```bash
npx playwright test --update-snapshots
```

**Step 3.** Verify snapshots were created:
```bash
ls snapshots/ | head -5
```
If empty or missing: STOP. Show the user the test output and ask to debug.

**Step 4.** Commit baselines:
```bash
git add snapshots/ && git commit -m "chore: add visual baselines"
```

**Workflow B complete.** Baselines are now the source of truth.

Full guide: [references/baseline/README.md](references/baseline/README.md)

---

## Workflow C: Update Baseline

Use when a design change is intentional and the current baseline is outdated.

**Before proceeding:** Ask the user for the reason for the update.
> "What is the reason for updating these baselines? (e.g., 'updated button design', 'new header font')"
> Wait for their answer. Use it in the commit message below.

**Step 1.** Update changed snapshots inside Docker:
```bash
docker run --rm --ipc=host -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots
```

**Step 2.** Add only new baselines locally (without overwriting existing):
```bash
npx playwright test --update-snapshots=missing
```

**Step 3.** Commit with the reason provided by the user:
```bash
git add snapshots/ && git commit -m "chore: update visual baselines — {USER_REASON}"
```
Replace `{USER_REASON}` with the exact answer from the user. Do not invent a reason.

> ⚠️ Never auto-update snapshots in CI. Use the [update-snapshots workflow](.github/workflows/update-snapshots.yml) for intentional updates — it requires a reason and commits with attribution.

---

## Workflow D: Debug Comparison

```bash
npx playwright test          # run and see failures
npx playwright show-report   # open HTML diff report (Expected | Actual | Diff)
```

> Note: `show-report` opens a browser. In headless/SSH environments, copy the `playwright-report/` folder to a machine with a browser.

Diff guide + fix patterns: [references/comparison/README.md](references/comparison/README.md)

---

## Workflow E: Fix Flakiness with Fixture

For pages with custom fonts, JS animations (Framer Motion, GSAP), or lazy-loaded images.

**Step 1.** Copy fixture to your project:
```bash
mkdir -p tests/fixtures
cp "${CLAUDE_SKILL_DIR}/references/fixtures/visual.ts" ./tests/fixtures/visual.ts
```

**Step 2.** Replace the import in your test:
```typescript
import { test, expect, waitForPageReady } from '../fixtures/visual';
```

**Step 3.** Add before `toHaveScreenshot`:
```typescript
await page.locator('h1').waitFor();
await waitForPageReady(page);  // fonts + images + GSAP freeze
```

The fixture uses `addInitScript` (runs before any app JS) to:
- Override `getBoundingClientRect` globally (returns realistic values before layout)
- Mock `IntersectionObserver` (lazy loaders fire immediately)
- Set `window.__PLAYWRIGHT__ = true` (for Framer Motion / app-level animation disabling)

---

## Workflow F: GitHub Actions

Copy to your project:
```bash
mkdir -p .github/workflows
cp "${CLAUDE_SKILL_DIR}/.github/workflows/visual-tests.yml" ./.github/workflows/visual-tests.yml
cp "${CLAUDE_SKILL_DIR}/.github/workflows/update-snapshots.yml" ./.github/workflows/update-snapshots.yml
```

Key requirements:
- Baselines must be committed to git before running in CI
- `CI=true` is set automatically by GitHub Actions
- Both workflows use `--ipc=host` to prevent Chromium crashes in Docker

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
