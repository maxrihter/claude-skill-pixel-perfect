# Baseline — Capturing Reference Screenshots

Baseline = the "source of truth" screenshots. Stored in `snapshots/` directory.

## First Run (create baseline)

```bash
npx playwright test --update-snapshots
```

This creates `.png` files in `snapshots/` for each test + viewport combination.

## When to Update Baseline

Update when you intentionally changed the design (not a bug):

```bash
# Update all baselines
npx playwright test --update-snapshots

# Update specific test only
npx playwright test tests/visual.spec.ts --update-snapshots
```

## Baseline File Structure

```
snapshots/
├── Desktop/
│   ├── homepage.png
│   ├── validators-page.png
│   └── dashboard.png
└── Mobile/
    ├── homepage.png
    └── validators-page.png
```

## Tips

- Always run baseline after `page.waitForLoadState('networkidle')` — avoid capturing loading states
- Mask dynamic content (dates, prices, animations) with `mask` option:

```typescript
await expect(page).toHaveScreenshot('page.png', {
  mask: [page.locator('.live-price'), page.locator('.timestamp')],
  fullPage: true,
});
```

- Store `snapshots/` in git so baseline is shared across the team
