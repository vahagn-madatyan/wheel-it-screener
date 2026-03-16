# T02: Configure ESLint v9 + Prettier for TypeScript/React

## Slice Context
**Goal:** Old vanilla files removed, ESLint + Prettier configured, ChainModal lazy-loaded, static SPA builds under 500KB.
**This task:** Installs and configures ESLint v9 (flat config) + Prettier for the TypeScript/React codebase.

## Description
The current `eslint.config.mjs` is a vanilla JS config with CDN globals — completely wrong for the migrated TypeScript/React project. Rewrite it as a proper flat config with typescript-eslint, react-hooks, and react-refresh plugins. Install Prettier with a config file. Format and lint-fix the entire codebase.

## Must-Haves
- eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, prettier, eslint-config-prettier installed as devDependencies
- eslint.config.mjs rewritten for TypeScript + React flat config
- .prettierrc created with consistent settings
- `npx eslint .` passes with zero errors
- `npx prettier --check .` passes (all files formatted)
- All 222 tests still pass

## Steps

1. **Install dependencies:**
   ```bash
   npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
   ```

2. **Rewrite `eslint.config.mjs`:** Create a flat config that:
   - Imports `@eslint/js` recommended config
   - Imports `typescript-eslint` configs (recommended)
   - Adds react-hooks plugin (recommended config)
   - Adds react-refresh plugin (warn on non-component exports)
   - Adds eslint-config-prettier **last** (disables formatting rules that conflict)
   - Sets `parserOptions.project` to `./tsconfig.app.json`
   - Sets `files: ['**/*.{ts,tsx}']` to scope to TypeScript files only
   - Adds ignores for `dist/`, `node_modules/`, `*.config.*` files
   - Disables `@typescript-eslint/no-unused-vars` — tsconfig.app.json already enforces `noUnusedLocals: true` and `noUnusedParameters: true`, so ESLint reporting the same would double-report

3. **Write `.prettierrc`:**
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "printWidth": 80,
     "trailingComma": "all",
     "tabWidth": 2
   }
   ```

4. **Format the codebase:**
   ```bash
   npx prettier --write "src/**/*.{ts,tsx,css}" "*.{json,mjs,ts,md}"
   ```

5. **Lint-fix the codebase:**
   ```bash
   npx eslint --fix .
   ```

6. **Fix remaining lint errors manually** — review any errors that `--fix` couldn't auto-resolve. Common issues:
   - Explicit `any` types → add proper types or `// eslint-disable-next-line` for justified cases
   - React hooks dependency arrays → fix or suppress with explanation
   
7. **Verify everything passes:**
   ```bash
   npx eslint .           # 0 errors
   npx prettier --check . # all formatted
   npx tsc --noEmit       # 0 errors
   npx vitest run         # 222 pass
   npm run build          # succeeds
   ```

## Verification
```bash
npx eslint .              # Exit 0, no errors
npx prettier --check .    # All files formatted
npx tsc --noEmit          # 0 errors
npx vitest run            # 222 pass
```

## Observability Impact
- **New signal:** `npx eslint .` — machine-readable lint output. Exit 0 = clean, non-zero = errors with file:line detail.
- **New signal:** `npx prettier --check .` — reports unformatted files. Exit 0 = all formatted.
- **New signal:** `npm run lint` script — same as `npx eslint .`, now backed by proper TS/React config.
- **Failure shape:** Lint errors print as `file:line:col  error  message  rule-name`. Prettier failures list unformatted file paths.
- **How to inspect later:** Run `npx eslint .` or `npx prettier --check .` from project root. Both produce deterministic pass/fail output.

## Inputs
- `eslint.config.mjs` — current vanilla JS flat config to be completely rewritten
- `package.json` — needs eslint + prettier devDependencies added; `"lint": "eslint ."` script already exists
- `tsconfig.app.json` — has `noUnusedLocals: true`, `noUnusedParameters: true` (avoid double-reporting with ESLint)
- All `src/**/*.{ts,tsx}` files — will be formatted by Prettier and lint-fixed

## Expected Output
- `eslint.config.mjs` — TypeScript + React flat config with prettier compat
- `.prettierrc` — consistent formatting config
- `package.json` — 7 new devDependencies (eslint ecosystem + prettier)
- All source files formatted consistently
- `npx eslint .` and `npx prettier --check .` both pass clean
