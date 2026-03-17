# S03: Layout Shell

**Goal:** CSS Grid dashboard shell with collapsible sidebar sections, responsive breakpoints, and Financial Terminal Noir base theme — ready for S04 to populate with controls.
**Demo:** Dev server shows a 320px sidebar + fluid main area. Sidebar has collapsible sections with smooth Radix-powered animation. At 1024px, sidebar collapses to hamburger overlay. At 640px, layout stacks vertically.

## Must-Haves

- shadcn/ui CLI bootstrapped with `components.json`, `cn()` utility, and all foundation deps installed
- CSS Grid layout: `320px + 1fr` columns on desktop, single-column on mobile
- Sidebar with collapsible sections using Radix Collapsible (via shadcn/ui wrapper)
- Header with hamburger toggle for mobile sidebar
- Responsive behavior at 1024px (sidebar → hamburger overlay) and 640px (stacked)
- Existing 128 tests still pass — no regressions from `cn()` addition to utils.ts

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all 128 existing tests pass (no regression from utils.ts changes)
- Browser at 1280px: 320px fixed sidebar visible, main area fills remaining width
- Browser at 1024px: sidebar hidden, hamburger button visible in header, clicking it opens sidebar overlay
- Browser at 640px: layout stacks vertically
- Sidebar sections collapse/expand with smooth height animation

## Tasks

- [x] **T01: Bootstrap shadcn/ui deps and build layout components** `est:35m`
  - Why: Sets up the component library foundation (deps, cn(), Collapsible) and builds all layout pieces (DashboardLayout, Sidebar, SidebarSection, Header) with responsive CSS Grid
  - Files: `package.json`, `components.json`, `src/lib/utils.ts`, `src/components/ui/collapsible.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/SidebarSection.tsx`, `src/components/layout/Header.tsx`, `src/App.tsx`
  - Do: Install clsx, tailwind-merge, class-variance-authority, lucide-react, tw-animate-css, @radix-ui/react-collapsible. Create `components.json` manually (rsc: false, tailwind.config blank for v4). Append `cn()` to existing `src/lib/utils.ts` — don't replace existing exports. Add Collapsible component via shadcn CLI or manual write. Build DashboardLayout as CSS Grid `grid-cols-1 lg:grid-cols-[320px_1fr]` with `min-h-dvh`. Build Sidebar with `w-80 overflow-y-auto overscroll-contain` and sidebar theme colors. Build SidebarSection wrapping Radix Collapsible with chevron rotation and smooth height animation via `--radix-collapsible-content-height`. Build Header with app title and placeholder slots for hamburger + theme toggle. Replace App.tsx placeholder with DashboardLayout rendering sidebar + main content area.
  - Verify: `npx tsc --noEmit` clean, `npx vitest run` all 128 tests pass, `npm run dev` renders layout
  - Done when: Layout shell renders on dev server with sidebar sections that collapse/expand, tsc and all tests pass

- [x] **T02: Wire mobile sidebar overlay and verify responsive breakpoints** `est:25m`
  - Why: The hamburger toggle + sidebar overlay + backdrop is a distinct interaction pattern requiring React state, and responsive correctness can only be verified visually in browser
  - Files: `src/components/layout/DashboardLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`
  - Do: Add `sidebarOpen` state to DashboardLayout (or a small context). On mobile (<lg), sidebar renders as fixed overlay with `z-50` + backdrop. Header hamburger button toggles visibility. Clicking backdrop or pressing Escape closes sidebar. Sidebar stays permanently visible on desktop (≥lg). Verify all three breakpoints in browser.
  - Verify: Browser verification at 1280px (desktop layout), 1024px (hamburger + overlay), 640px (stacked). Collapsible sections animate smoothly.
  - Done when: All three breakpoints render correctly in browser, sidebar overlay opens/closes on mobile, collapsible sections work at all sizes

## Files Likely Touched

- `package.json` — new deps
- `components.json` — shadcn CLI config
- `src/lib/utils.ts` — cn() addition
- `src/components/ui/collapsible.tsx` — Radix Collapsible wrapper
- `src/components/layout/DashboardLayout.tsx` — CSS Grid shell
- `src/components/layout/Sidebar.tsx` — sidebar container
- `src/components/layout/SidebarSection.tsx` — collapsible section wrapper
- `src/components/layout/Header.tsx` — top bar with hamburger + title
- `src/App.tsx` — replace placeholder with layout
