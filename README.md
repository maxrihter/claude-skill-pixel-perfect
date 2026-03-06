# 🎯 pixel-perfect

> A Claude Code skill for pixel-perfect visual regression testing using Playwright's built-in screenshot comparison engine.

![Claude Skill](https://img.shields.io/badge/Claude-Skill-6B48FF?logo=anthropic&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?logo=playwright&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Tier 2](https://img.shields.io/badge/Architecture-Tier%202-blue)

---

## What It Does

Enables Claude to set up, run, and interpret **pixel-perfect visual regression tests** — comparing UI screenshots against a baseline to catch unintended visual changes.

Built on top of `@playwright/test`'s native `toHaveScreenshot()` — no extra dependencies, no third-party services.

```
Baseline capture → Code change → Re-run → HTML diff report
     ✅                 🛠️           ▶️          🔍
```

---

## Triggers

Claude will activate this skill when you say things like:

- _"Run pixel-perfect tests on this page"_
- _"Check for visual regressions"_
- _"Compare screenshots before and after"_
- _"Set up visual testing with Playwright"_
- _"Generate a UI diff report"_

---

## Features

- ✅ Baseline management (capture, update, version in git)
- ✅ Multi-viewport testing (Desktop / Tablet / Mobile)
- ✅ HTML report with side-by-side diffs
- ✅ Dynamic content masking (prices, dates, animations)
- ✅ Configurable tolerance (pixel ratio, color threshold)
- ✅ Element-level and full-page screenshots
- ✅ Production fixture — fonts, CSS/JS animations, lazy images
- ✅ Cross-platform consistency via Docker (macOS ↔ Linux CI)
- ✅ GitHub Actions workflows (auto-test on PR + manual snapshot update)

---

## Quick Start

```bash
# 1. Install
npm install -D @playwright/test
npx playwright install chromium

# 2. Capture baseline (use Docker for cross-platform consistency)
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots

# 3. Run comparison
npx playwright test

# 4. Open visual diff report
npx playwright show-report
```

---

## Skill Structure

```
pixel-perfect/
├── SKILL.md                          # Claude reads this — workflow + quick commands
├── README.md                         # You are here
├── LICENSE
├── .github/
│   └── workflows/
│       ├── visual-tests.yml          # Runs on every PR
│       └── update-snapshots.yml      # Manual trigger — never auto-runs
└── references/
    ├── setup/
    │   └── README.md                 # Install, config, Docker, CI setup
    ├── baseline/
    │   └── README.md                 # Capturing and managing baseline screenshots
    ├── comparison/
    │   └── README.md                 # Running tests, reading diffs, fixing false positives
    ├── fixtures/
    │   └── visual.ts                 # Production fixture (fonts, animations, lazy images)
    └── examples/
        ├── playwright.config.ts      # Ready-to-use config
        └── visual.spec.ts            # Example test file
```

---

## Example Test

```typescript
import { test, expect } from '@playwright/test';
// Or with the production fixture (handles fonts, JS animations, lazy images):
// import { test, expect } from '../fixtures/visual';

test('homepage', async ({ page }) => {
  await page.goto('/');

  // Wait for visible content — not networkidle (brittle, deprecated)
  await page.waitForSelector('h1');
  await page.waitForFunction(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,       // 1% tolerance
    mask: [page.locator('.live-price')], // mask dynamic content
  });
});
```

---

## Viewport Defaults

| Viewport | Width | Height |
|----------|-------|--------|
| Desktop  | 1440  | 900    |
| Tablet   | 768   | 1024   |
| Mobile   | 375   | 812    |

---

## Reading the Diff Report

| Diff Pattern | Likely Cause | Fix |
|---|---|---|
| Scattered red pixels | Font anti-aliasing | Increase `threshold` to `0.3` |
| Solid red block | Element moved/changed | Review layout change |
| Red at bottom | Content height changed | Check new content added |
| Thin red line | Border/shadow changed | Verify design intent |
| Entire page differs | macOS vs Linux baseline | Regenerate baseline in Docker |

---

## Cross-Platform Consistency

macOS and Linux render fonts differently. If your CI runs Linux, baselines must be
generated in a Linux environment to avoid false failures.

```bash
# Generate baselines inside Docker — matches your Linux CI exactly
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  npx playwright test --update-snapshots
```

---

## Installation into Claude Code

```bash
# Clone into your Claude skills directory
git clone https://github.com/maxrihter/claude-skill-pixel-perfect \
  ~/.claude/skills/pixel-perfect
```

Claude Code will auto-discover the skill on next session start.

---

## References

- [Playwright Visual Comparisons Docs](https://playwright.dev/docs/test-snapshots)
- [pixelmatch](https://github.com/mapbox/pixelmatch) — the diff engine used under the hood
- [Claude Code Skills Guide](https://docs.anthropic.com/claude-code)
- [Playwright Docker images](https://playwright.dev/docs/docker)

---

## License

MIT © [maxrihter](https://github.com/maxrihter)
