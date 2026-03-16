# S07: Visual Polish + Animation — UAT

**Milestone:** M001
**Written:** 2026-03-15

## UAT Type

- UAT mode: human-experience
- Why this mode is sufficient: Animation feel, font rendering quality, and visual polish are inherently subjective — automated checks confirm structure, humans confirm aesthetics

## Preconditions

- `npm run dev` running on localhost:5173
- Modern browser with web font support (Chrome/Firefox/Safari)

## Smoke Test

Load the app in dark mode. The heading "WheelScan" should render in Space Grotesk (geometric sans-serif, noticeably different from system font). A subtle grain texture should be barely visible over the dark background. A sun icon should appear in the top-right header area.

## Test Cases

### 1. Font Trio Rendering

1. Load app in browser
2. Inspect the "WheelScan" heading — should be Space Grotesk (geometric, wider letterforms)
3. Inspect body text (labels like "Min Price", "Preset") — should be General Sans
4. If scan results are visible, check score numbers — should be JetBrains Mono (monospace with coding ligatures)
5. **Expected:** Three visually distinct font families are active, not falling back to system fonts

### 2. Noise Texture Overlay

1. Load app in dark mode
2. Look carefully at the dark background areas (main content area, sidebar)
3. **Expected:** Subtle grain/film noise texture visible at ~4% opacity — not distracting but adds depth compared to flat solid color

### 3. Theme Toggle

1. Click the sun/moon icon in the top-right header
2. Page should switch from dark to light mode
3. Click again to return to dark mode
4. **Expected:** Smooth icon morph animation (rotate + scale), background/text colors switch, toggle persists across page refresh

### 4. KPI Card Gradient Borders

1. Run a scan (requires Finnhub API key) so KPI cards appear
2. Inspect the borders of the 4 KPI cards
3. **Expected:** Subtle emerald-tinted gradient border visible, not a flat solid border

### 5. KPI Card Stagger Animation

1. Run a scan so KPI cards populate
2. Observe the cards appearing
3. **Expected:** Cards stagger in one-by-one with a slide-up + fade effect, not all appearing simultaneously

### 6. Chain Modal Spring Animation

1. Run a scan, then click "Puts" on any result row
2. Observe the modal opening
3. **Expected:** Modal slides up with spring physics (slight overshoot/settle), backdrop fades in. No CSS zoom-in effect. Closing should show reverse animation.

### 7. Run Button Gradient + Progress Fill

1. Enter a Finnhub API key
2. Click "Run Screener"
3. Observe the button during scan
4. **Expected:** Button has emerald gradient background (not flat green). During scan, a semi-transparent fill bar tracks progress left-to-right across the button.

### 8. EmptyState + ProgressBar AnimatePresence

1. Load app (empty state visible: "Ready to scan" heading)
2. Start a scan — progress bar should fade in, empty state should fade out
3. When scan completes, progress bar should fade out
4. **Expected:** Smooth fade transitions on both elements, no hard cut/jump

### 9. Results Table Row Stagger

1. Run a scan that produces results
2. Observe the table rows appearing
3. **Expected:** First ~20 rows stagger in with slight delays (0.02s each), remaining rows appear instantly

## Edge Cases

### Theme Toggle Persistence

1. Switch to light mode
2. Refresh the page (F5)
3. **Expected:** App loads in light mode (not dark) — theme persists via localStorage

### Font Fallback Graceful Degradation

1. Open DevTools → Network tab → Block requests to `fonts.googleapis.com` and `api.fontshare.com`
2. Refresh the page
3. **Expected:** App renders normally with system fallback fonts. No layout breakage or invisible text.

## Failure Signals

- System/default fonts visible instead of Space Grotesk / General Sans / JetBrains Mono
- No grain texture visible (background is perfectly flat solid color)
- Theme toggle doesn't switch `<html>` class or doesn't persist
- Modal opens with CSS zoom-in instead of spring slide-up
- KPI cards all appear simultaneously without stagger
- Run button is flat green (no gradient) or has no progress fill during scan
- Console errors related to motion or AnimatePresence on page load

## Requirements Proved By This UAT

- R024 — Framer Motion animations feel premium (stagger, spring, fade)
- R025 — Noise texture and gradient borders visible
- R026 — Font trio renders correctly from CDN
- R027 — Theme toggle works with icon morph and persistence
- R028 — Run button gradient with progress fill

## Not Proven By This UAT

- Animation performance on low-end hardware (not tested)
- Font loading performance / FOUT behavior on slow networks
- Exact animation timing feel — may need tuning based on real-world use

## Notes for Tester

- The noise texture is intentionally very subtle (4% opacity). You may need to look closely or compare with a flat-colored reference to notice it.
- Chain modal spring animation and run button progress fill require a real Finnhub API key to test live.
- The initial hook error in console on first dev server connection is a known HMR race condition — it self-recovers and does not appear on production builds or clean page loads.
