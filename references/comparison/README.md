# Comparison — Running Visual Tests

## Run Tests

```bash
# Compare all pages against baseline
npx playwright test

# Specific test file
npx playwright test tests/visual.spec.ts

# Specific viewport/project
npx playwright test --project=Desktop
npx playwright test --project=Mobile
```

## Read Results

```
✓ homepage (Desktop) — passed
✗ validators-page (Desktop) — 1243 pixels differ (0.86%)
✓ dashboard (Mobile) — passed
```

## Open HTML Report with Visual Diffs

```bash
npx playwright show-report
```

Report shows:
- Side-by-side: **Expected** | **Actual** | **Diff** (red = changed pixels)
- Pixel diff count and percentage
- Which viewport failed

## Interpreting Diffs

| Diff Pattern | Likely Cause |
|---|---|
| Red pixels scattered everywhere | Font rendering / anti-aliasing (increase threshold) |
| Solid red block | Element moved or changed |
| Red at bottom of page | Content height changed |
| Thin red line | Border or shadow changed |

## Common Fixes

**False positives (fonts, shadows):**
```typescript
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixelRatio: 0.02,  // allow 2%
  threshold: 0.3,            // less sensitive per-pixel
});
```

**Ignore dynamic areas:**
```typescript
await expect(page).toHaveScreenshot('page.png', {
  mask: [page.locator('.animated-counter'), page.locator('[data-live]')],
});
```

**Clip to specific element only:**
```typescript
const section = page.locator('.hero-section');
await expect(section).toHaveScreenshot('hero.png');
```
