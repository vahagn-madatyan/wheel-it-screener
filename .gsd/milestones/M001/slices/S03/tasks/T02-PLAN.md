---
estimated_steps: 4
estimated_files: 3
---

# T02: Wire mobile sidebar overlay and verify responsive breakpoints

**Slice:** S03 — Layout Shell
**Milestone:** M001

## Description

Add the mobile sidebar interaction: hamburger toggle opens sidebar as a fixed overlay with backdrop on screens <1024px. Verify the complete layout at three breakpoints in the browser — this is the primary verification method since responsive behavior can't be unit-tested.

## Steps

1. Add `sidebarOpen` state to DashboardLayout. Pass toggle callback to Header's hamburger button. On desktop (≥lg), sidebar renders inline in the grid. On mobile (<lg), sidebar renders as fixed overlay (`fixed inset-y-0 left-0 z-50`) with semi-transparent backdrop.
2. Wire hamburger button in Header — ChevronLeft or Menu icon from lucide-react. Hidden on desktop (`hidden lg:hidden`), visible on mobile. Toggles `sidebarOpen`.
3. Wire backdrop click and Escape key to close sidebar overlay. Sidebar slides in from left with CSS transition.
4. Start dev server, verify at three widths using browser tools:
   - 1280px: two-column grid, sidebar permanently visible, no hamburger
   - 1024px: single-column, hamburger visible, clicking opens sidebar overlay with backdrop
   - 640px: stacked layout, same hamburger behavior
   - At all sizes: collapsible sections animate smoothly

## Must-Haves

- [ ] Hamburger button visible only on mobile (<lg breakpoint)
- [ ] Sidebar renders as fixed overlay with backdrop on mobile
- [ ] Clicking backdrop or pressing Escape closes sidebar overlay
- [ ] Desktop layout shows sidebar inline without overlay behavior
- [ ] All three breakpoints verified in browser

## Verification

- Browser at 1280px: 320px sidebar visible, main area fills rest, no hamburger button
- Browser at 1024px: hamburger button visible, click opens sidebar overlay, click backdrop closes it
- Browser at 640px: layout stacks, hamburger works, sidebar overlay functions
- Collapsible sections animate at all sizes

## Inputs

- `src/components/layout/DashboardLayout.tsx` — CSS Grid shell from T01
- `src/components/layout/Header.tsx` — header with hamburger placeholder from T01
- `src/components/layout/Sidebar.tsx` — sidebar container from T01

## Expected Output

- `src/components/layout/DashboardLayout.tsx` — now manages sidebar open/close state for mobile
- `src/components/layout/Header.tsx` — hamburger button wired with toggle callback
- All three breakpoints verified working in browser
