---
id: T01
parent: S04
milestone: M001
provides:
  - Radix Switch UI primitive (data-slot pattern)
  - Radix Slider UI primitive (single-value adapter)
  - NumberInput sidebar component (undefined ↔ empty string, internal draft state)
  - ApiKeyInput sidebar component (masked input + eye toggle + status badge)
  - ApiKeysSection composed section (Finnhub, Alpaca coordinated, Massive)
key_files:
  - src/components/ui/switch.tsx
  - src/components/ui/slider.tsx
  - src/components/sidebar/NumberInput.tsx
  - src/components/sidebar/ApiKeyInput.tsx
  - src/components/sidebar/ApiKeysSection.tsx
  - src/App.tsx
key_decisions:
  - Sanitize label→ID with /[^a-z0-9]+/g to avoid CSS selector breakage (Massive.com dot)
  - Alpaca coordinated update reads other field from getState() at call time, not from closure
  - NumberInput uses internal string draft to prevent cursor jumping, commits on blur/enter
patterns_established:
  - data-slot Radix wrapper pattern extended to Switch and Slider
  - Sidebar input components accept value/onChange with store-compatible signatures
  - ApiKeyInput never exposes key values in UI — only "Set"/"Not Set" status badge
observability_surfaces:
  - useApiKeyStore.getState() from browser console shows key status
  - localStorage key "wheelscan-api-keys" persists store (values inspectable, status derived)
duration: 18m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T01: Build reusable UI primitives and API Keys section

**Created 4 reusable sidebar input primitives (Switch, Slider, NumberInput, ApiKeyInput) and composed ApiKeysSection with full store binding.**

## What Happened

Built all 5 files following the data-slot pattern from collapsible.tsx. Switch wraps Radix Root+Thumb with dark-theme styling. Slider wraps Radix Root/Track/Range/Thumb with a single-value adapter (wraps/unwraps array). NumberInput uses internal string draft state to avoid cursor jumping, commits parsed value on blur/Enter, and handles `number | undefined` ↔ empty string for optional fields. ApiKeyInput renders masked input with eye toggle and green/neutral status badge. ApiKeysSection composes 4 inputs (Finnhub, Alpaca Key ID, Alpaca Secret Key, Massive.com) bound to apiKeyStore — Alpaca uses coordinated update pattern reading the other field from `getState()` at call time. Wired ApiKeysSection into App.tsx as first sidebar section.

## Verification

- `npx tsc --noEmit` — zero errors ✅
- `npx vitest run` — 188/188 tests pass, zero regressions ✅
- Browser: API Keys section renders with 4 inputs (Finnhub, Alpaca Key ID, Alpaca Secret, Massive) ✅
- Browser: typing Finnhub key → status badge changes from "Not Set" to green "Set" ✅
- Browser: eye icon toggles input between `type="password"` and `type="text"` (both directions) ✅
- Browser: localStorage `wheelscan-api-keys` confirms all values persisted correctly ✅
- Browser: Alpaca coordinated update — both fields show "Set" after both are entered ✅

### Slice-level verification (partial — T01 is intermediate):
- ✅ `npx tsc --noEmit` — zero errors
- ✅ `npx vitest run` — 188 tests pass
- ⬜ weight-redistribution.test.ts (T02)
- ⬜ Browser: preset dropdown changes all filter values (T02)
- ⬜ Browser: Reset button returns all filters to defaults (T02)
- ⬜ Browser: all 4 sidebar sections render with controls (1/4 done — API Keys)
- ⬜ Browser: weight slider redistribution (T02)

## Diagnostics

- `useApiKeyStore.getState()` from browser console shows all key values and derived status
- `localStorage.getItem('wheelscan-api-keys')` shows persisted state (values + version)
- Status badges provide visual confirmation without exposing key values

## Deviations

- Label-to-ID sanitization changed from `/\s+/g` to `/[^a-z0-9]+/g` to handle dots in "Massive.com" that broke CSS selectors.

## Known Issues

- None.

## Files Created/Modified

- `src/components/ui/switch.tsx` — Radix Switch wrapper with data-slot pattern
- `src/components/ui/slider.tsx` — Radix Slider wrapper with single-value adapter
- `src/components/sidebar/NumberInput.tsx` — Labeled number input with undefined handling and draft state
- `src/components/sidebar/ApiKeyInput.tsx` — Masked API key input with eye toggle and status badge
- `src/components/sidebar/ApiKeysSection.tsx` — Composed section binding 4 inputs to apiKeyStore
- `src/App.tsx` — Added ApiKeysSection as first sidebar section
