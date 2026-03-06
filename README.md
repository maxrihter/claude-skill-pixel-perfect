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

---

## Quick Start

```bash
# 1. Install
npm install -D @playwright/test
npx playwright install chromium

# 2. Capture baseline
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
├── SKILL.md                        # Claude reads this — workflow + quick commands
├── README.md                       # You are here
├── LICENSE
└── references/
    ├── setup/
    │   └── README.md               # Installation, playwright.config.ts, test template
    ├── baseline/
    │   └── README.md               # Capturing and managing baseline screenshots
    ├── comparison/
    │   └── README.md               # Running tests, reading diffs, fixing false positives
    └── examples/
        ├── playwright.config.ts    # Ready-to-use config
        └── visual.spec.ts          # Example test file
```

---

## Example Test

```typescript
import { test, expect } from '@playwright/test';

test('validators page — desktop', async ({ page }) => {
  await page.goto('/validators');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot('validators.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,       // 1% tolerance
    mask: [page.locator('.live-apy')], // mask dynamic content
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

---

## License

MIT © [maxrihter](https://github.com/maxrihter)
