---
name: pixel-perfect
description: Use when you need to visually test UI for pixel-perfect accuracy — compare screenshots against a baseline, find visual regressions, generate diff reports. Triggers on: pixel-perfect, visual regression, screenshot comparison, UI visual test, design QA.
metadata:
  category: technique
  triggers: pixel-perfect, visual regression, screenshot diff, UI comparison, design QA, toHaveScreenshot
---

# Pixel-Perfect Visual Testing

Uses `@playwright/test` built-in screenshot comparison (`toHaveScreenshot`).
Baseline stored locally. Diffs rendered in HTML report.

## Workflow

```
1. Setup       → install @playwright/test, create config
2. Baseline    → capture reference screenshots (--update-snapshots)
3. Compare     → run tests against baseline, get diffs
4. Report      → open HTML report with visual diffs
```

## Decision Tree

- First time / no baseline yet? → [Setup + Baseline](references/baseline/README.md)
- Baseline exists, run comparison? → [Comparison](references/comparison/README.md)
- Config / install questions? → [Setup](references/setup/README.md)

## Quick Commands

```bash
# Capture / update baseline
npx playwright test --update-snapshots

# Run comparison
npx playwright test

# Open HTML report with diffs
npx playwright show-report
```

## Viewport Defaults

Test at minimum these viewports:
- Desktop: 1440×900
- Tablet: 768×1024
- Mobile: 375×812
