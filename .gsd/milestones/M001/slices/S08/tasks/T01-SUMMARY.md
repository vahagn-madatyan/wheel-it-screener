---
id: T01
parent: S08
milestone: M001
provides:
  - vanilla-files-deleted
  - tw-animate-css-removed
key_files:
  - src/components/ui/tooltip.tsx
  - src/index.css
key_decisions:
  - Replaced tw-animate-css keyframe animations with pure CSS transition-based approach using opacity/scale and data-[state] selectors
  - Also removed slide-in-from-* directional classes (tw-animate-css utilities) since they have no pure Tailwind equivalent and the tooltip works fine with just fade+zoom
patterns_established:
  - Use transition-[opacity,transform] with data-[state=open/closed] selectors for Radix UI animation instead of tw-animate-css keyframes
observability_surfaces:
  - none
duration: 5m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Delete vanilla files and remove tw-animate-css remnant

**Deleted 4 legacy vanilla files and fully removed tw-animate-css dependency, replacing tooltip animations with pure CSS transitions.**

## What Happened

1. Deleted `app.js` (55KB), `style.css` (29KB), `base.css` (2KB), and `index.vanilla.html` (24KB) from project root.
2. Replaced tw-animate-css animation classes in `tooltip.tsx` with pure Tailwind transitions: `opacity-0 scale-95 transition-[opacity,transform] duration-200` with `data-[state=open/closed]` modifiers. Also removed `slide-in-from-*` directional classes which were tw-animate-css utilities.
3. Removed `@import "tw-animate-css"` from `src/index.css`.
4. Ran `npm uninstall tw-animate-css` — removed from devDependencies and node_modules.

## Verification

- `ls app.js style.css base.css index.vanilla.html` → all 4 "No such file" ✅
- `grep -c "tw-animate-css" package.json src/index.css` → 0 for both ✅
- `grep -r "tw-animate-css|animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95|slide-in-from" src/` → no matches ✅
- `npx tsc --noEmit` → 0 errors ✅
- `npx vitest run` → 222 tests pass ✅
- `npm run build` → succeeds (538KB chunk — T03 will fix with lazy loading) ✅

### Slice-level checks (T01 scope):
- ✅ Vanilla files gone (4/4)
- ✅ tw-animate-css refs removed (0 in package.json and index.css)
- ✅ tsc clean
- ✅ 222 tests pass
- ✅ Build succeeds
- ⏳ ESLint/Prettier — T02
- ⏳ Chunk splitting <500KB — T03
- ⏳ Preview server — T03

## Diagnostics

None — this task only removes files and CSS classes. No runtime signals changed.

## Deviations

- Plan mentioned replacing only `animate-in fade-in-0 zoom-in-95` and `animate-out fade-out-0 zoom-out-95` classes. The `slide-in-from-top/right/left/bottom-2` classes on the adjacent line were also tw-animate-css utilities, so they were removed too. The tooltip animation works cleanly with just opacity+scale transitions.

## Known Issues

None.

## Files Created/Modified

- `app.js` — deleted (55KB vanilla JS monolith)
- `style.css` — deleted (29KB vanilla CSS)
- `base.css` — deleted (2KB vanilla CSS reset)
- `index.vanilla.html` — deleted (24KB vanilla layout reference)
- `src/index.css` — removed `@import "tw-animate-css"` line
- `src/components/ui/tooltip.tsx` — replaced tw-animate-css animation classes with pure CSS transitions
- `package.json` — tw-animate-css removed from devDependencies (via npm uninstall)
- `.gsd/milestones/M001/slices/S08/S08-PLAN.md` — added Observability / Diagnostics section
- `.gsd/milestones/M001/slices/S08/tasks/T01-PLAN.md` — added Observability Impact section
