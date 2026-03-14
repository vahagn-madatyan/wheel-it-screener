# S03: Layout Shell — UAT

**Milestone:** M001
**Written:** 2026-03-12

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Layout shell is purely visual — correctness is verified by rendering at different viewport sizes and interacting with collapsible sections and mobile overlay.

## Preconditions

- `npm run dev` running on localhost:5173
- Browser available for viewport testing

## Smoke Test

Open localhost:5173 at full desktop width. A 320px sidebar should be visible on the left with three collapsible sections (Universe, Strategy, Scoring). The main area fills the remaining width.

## Test Cases

### 1. Desktop layout (≥1024px)

1. Open browser at 1280px wide
2. **Expected:** 320px sidebar visible on the left, main area fills remaining width, no hamburger button visible

### 2. Collapsible sections

1. At desktop width, click any section header in the sidebar (e.g. "Universe")
2. **Expected:** Section collapses with smooth height animation, chevron rotates to point right
3. Click the same header again
4. **Expected:** Section expands with smooth animation, chevron rotates back down

### 3. Tablet/hamburger breakpoint (1023px)

1. Resize browser to 1023px wide
2. **Expected:** Sidebar disappears, hamburger button (☰) appears in the header
3. Click the hamburger button
4. **Expected:** Sidebar slides in from the left as an overlay with a semi-transparent backdrop
5. Click the backdrop
6. **Expected:** Sidebar slides out, overlay dismissed

### 4. Mobile/stacked layout (640px)

1. Resize browser to 640px wide
2. **Expected:** Layout stacks vertically, hamburger button visible
3. Click hamburger, verify overlay opens and sections are usable

### 5. Escape key closes overlay

1. At mobile width, click hamburger to open sidebar overlay
2. Press Escape key
3. **Expected:** Sidebar overlay closes

### 6. Resize auto-close

1. At mobile width, open sidebar overlay
2. Resize browser wider than 1024px
3. **Expected:** Overlay auto-closes, sidebar appears inline in grid layout

## Edge Cases

### Rapid toggle

1. Click hamburger repeatedly (5+ times quickly)
2. **Expected:** No visual glitches, overlay settles to correct open/closed state

### Scroll within sidebar

1. If sidebar content exceeds viewport height, scroll within sidebar
2. **Expected:** Sidebar scrolls independently, main content does not scroll

## Failure Signals

- Sidebar overlaps main content at desktop width (grid not working)
- Hamburger button visible at desktop width
- Sidebar overlay doesn't close on backdrop click or Escape
- Collapsible sections snap without animation
- Fixed overlay prevents clicking elements underneath when sidebar is closed

## Requirements Proved By This UAT

- R009 — CSS Grid layout with 320px sidebar + fluid main verified at desktop
- R010 — Collapsible sidebar sections with Radix Collapsible animation verified
- R011 — Responsive breakpoints at 1024px (hamburger overlay) and 640px (stacked) verified

## Not Proven By This UAT

- R002 — Full Financial Terminal Noir visual polish (noise, gradients, fonts) — deferred to S07
- Sidebar content correctness — sections contain placeholder text, real controls come in S04
- Theme toggle between dark/light — coming in S07

## Notes for Tester

- The three sidebar sections (Universe, Strategy, Scoring) contain placeholder text. Real filter controls, presets, and weight sliders will be added in S04.
- The design uses the dark theme by default. Light theme toggle is S07 scope.
- Collapsible animation uses tw-animate-css keyframes — the animation is subtle (~200ms). If it appears to snap, check that tw-animate-css is imported in index.css.
