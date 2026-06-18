---
phase: 01-foundation
plan: 02
subsystem: "IPC infrastructure + UI scaffolding"
tags:
  - ipc
  - preload
  - contextBridge
  - zod
  - tailwind
  - viewer-registry
dependency-graph:
  requires: ["01-01 (scaffold + electron-vite + vitest)"]
  provides: ["03 (session tracking)", "04 (theme engine)"]
  affects: ["main process", "preload layer", "renderer UI"]
tech-stack:
  added:
    - "zod v4: IPC input/output validation schemas (AppQuitSchema, WindowMaximizeSchema)"
    - "Tailwind v4 @theme: Obsidianite dark palette (bg-primary: #100e17)"
    - "React.lazy + Suspense: artifact viewer lazy-loading pattern"
    - "Module._resolveFilename hook: CJS require() compat for .ts/.tsx in vitest 4"
  patterns:
    - "registerAllIPC() aggregator in main/ipc/index.ts"
    - "single contextBridge.exposeInMainWorld call with typed electronAPI"
    - "ViewerRegistry class with register/getViewer/render API"
key-files:
  created:
    - "src/main/ipc/app.ts"
    - "src/main/ipc/window.ts"
    - "src/main/ipc/index.ts"
    - "src/shared/constants.ts"
    - "src/shared/types/ipc.ts"
    - "src/shared/types/window.d.ts"
    - "src/shared/validators/app.ts"
    - "src/shared/validators/window.ts"
    - "src/renderer/src/hooks/useElectronAPI.ts"
    - "src/renderer/src/assets/styles/globals.css"
    - "src/renderer/src/components/ui/Skeleton.tsx"
    - "src/renderer/src/components/ui/IconButton.tsx"
    - "src/renderer/components/viewers/ViewerRegistry.ts"
    - "src/renderer/src/components/WelcomeScreen.tsx"
    - "vitest.setup.ts"
  modified:
    - "src/main/index.ts"
    - "src/preload/index.ts"
    - "src/renderer/src/main.tsx"
    - "src/renderer/src/App.tsx"
    - "vitest.config.ts"
decisions:
  - "D-extra-01 (Rule 2): vitest.setup.ts Module._resolveFilename patch — Plan 01 contract tests use require() for .ts files, which vitest 4's module runner cannot resolve natively. Patch adds .ts/.tsx extension fallback."
  - "D-extra-02 (Rule 3): AppGetVersionSchema alias — test imports AppGetVersionSchema but plan specified AppGetVersionResult. Both exported."
  - "ViewerRegistry uses .ts (not .tsx) extension — vitest 4's module runner transforms .ts but NOT .tsx files loaded via require()"
metrics:
  duration: "~45 min execution"
  completed-date: "2026-06-11"
  tests-passed: "24/24"
  commits: 3
  files-created: 15
  files-modified: 5
---

# Phase 01 Foundation — Plan 02: IPC Infrastructure + UI Scaffolding

**One-liner:** Implemented full IPC stack (Zod-validated, contextBridge-isolated), dark theme CSS (Tailwind v4 @theme), ViewerRegistry with lazy-loading, and WelcomeScreen — all 24 contract tests pass.

## What was built

### Task 1 — IPC Infrastructure (`2ff400b`)

**Shared types and validators:**
- `src/shared/constants.ts` — APP_NAME, PERFORMANCE_BUDGET constants
- `src/shared/types/ipc.ts` — IPC_CHANNELS enum (5 channels: app:quit, app:getVersion, window:minimize, window:maximize, window:close)
- `src/shared/types/window.d.ts` — ElectronAPI interface (app.quit, app.getVersion, window.minimize/maximize/close, on()) + global Window augmentation
- `src/shared/validators/app.ts` — AppQuitSchema (z.object with force: z.boolean().default(false)), AppQuitResult, AppGetVersionSchema (z.string())
- `src/shared/validators/window.ts` — WindowMinimizeSchema, WindowMaximizeSchema, WindowCloseSchema (all .strip() Zod objects)

**Main process handlers:**
- `src/main/ipc/app.ts` — registerAppIPC(): handles app:quit (with force param), app:getVersion
- `src/main/ipc/window.ts` — registerWindowIPC(): handles window:minimize, window:maximize (toggle), window:close
- `src/main/ipc/index.ts` — registerAllIPC() aggregator
- `src/main/index.ts` — security flags (contextIsolation:true, sandbox:true, nodeIntegration:false), preload config, registerAllIPC() before createWindow, perf instrumentation (START_TIME, ready-to-show logging, memory baseline), window title "AI CLI Studio"

**Preload bridge:**
- `src/preload/index.ts` — single contextBridge.exposeInMainWorld call with typed electronAPI (app, window methods, on() subscription), NO sendSync

**React hooks:**
- `src/renderer/src/hooks/useElectronAPI.ts` — typed access hooks (useElectronAPI, useAppVersion)

**Vitest compat:**
- `vitest.setup.ts` — Module._resolveFilename patch for CJS require() of .ts/.tsx files (vitest 4 limitation, vitest-dev/vitest#846)
- `vitest.config.ts` — setupFiles entry

### Task 2 — UI Components (`ec4b3c3`, `bee19c3`)

**Dark theme (Obsidianite):**
- `src/renderer/src/assets/styles/globals.css` — Tailwind v4 @theme with custom palette (bg-primary: #100e17, accent: #0fb6d6, etc.), custom scrollbar, shimmer keyframe animation

**UI primitives:**
- `src/renderer/src/components/ui/Skeleton.tsx` — Skeleton, CodeSkeleton, MarkdownSkeleton shimmer components
- `src/renderer/src/components/ui/IconButton.tsx` — accessible icon button with aria-label, hover/focus states

**ViewerRegistry (lazy-loading infrastructure):**
- `src/renderer/components/viewers/ViewerRegistry.ts` — register(definition), getViewer(type), render(type, props) with Suspense lazy-loading and skeleton fallback
- Uses .ts extension (not .tsx) because vitest 4's module runner transforms .ts but not .tsx files loaded via require()

**WelcomeScreen:**
- `src/renderer/src/components/WelcomeScreen.tsx` — welcome message, version badge (useAppVersion hook), settings IconButton, TaskTray placeholder, keyboard shortcut hint
- `src/renderer/src/App.tsx` — renders WelcomeScreen

**Renderer entry:**
- `src/renderer/src/main.tsx` — imports globals.css (replaces main.css)

## Test Results

- **5 test files, 24 tests, 0 failures**
- All 5 test files pass: main/index.test.ts (4), useElectronAPI.test.ts (6), ViewerRegistry.test.ts (4), app.test.ts (5), window.test.ts (5)
- Key metrics: transform 396ms, setup 269ms, tests 546ms, total 2.72s

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Unused import in useElectronAPI.ts**
- **Found during:** Task 2 build verification
- **Issue:** `useCallback` imported but never used (TS6133), causing typecheck failure
- **Fix:** Removed `useCallback` from import
- **Files modified:** `src/renderer/src/hooks/useElectronAPI.ts`
- **Commit:** `ec4b3c3`

**2. [Rule 1 — Bug] ViewerRegistry.tsx JSX incompatible with vitest CJS require()**
- **Found during:** Task 2 test run
- **Issue:** ViewerRegistry.test.ts uses `require('../viewers/ViewerRegistry')` which Node.js/vitest cannot parse with JSX syntax (`Unexpected identifier 'ComponentType'`)
- **Fix:** Converted file to .ts extension, rewrote JSX with React.createElement calls
- **Files modified:** `src/renderer/components/viewers/ViewerRegistry.ts` (renamed from .tsx)
- **Commit:** `ec4b3c3`

### Rule 2 — Auto-added Missing Critical Functionality

**3. [Rule 2 — Missing Compat] vitest.setup.ts Module._resolveFilename patch**
- **Found during:** Task 1 analysis (pre-commit planning)
- **Issue:** Plan 01 contract tests use `require('../validators/app')` for .ts files — vitest 4's module runner cannot resolve TypeScript files loaded via CJS require() without an extension. Without this patch, 4 validator tests cannot pass.
- **Fix:** Added `vitest.setup.ts` hooking `Module._resolveFilename` to try .ts/.tsx extensions
- **Files modified:** `vitest.config.ts`, `vitest.setup.ts` (new)
- **Commit:** `2ff400b`

### Rule 3 — Auto-fixed Blocking Issues

**4. [Rule 3 — Blocking] AppGetVersionSchema alias missing**
- **Found during:** Task 1 implementation (pre-commit)
- **Issue:** Contract test imports `AppGetVersionSchema` but plan's STEP 4 specifies `AppGetVersionResult`
- **Fix:** Added `AppGetVersionSchema` as an alias for `AppGetVersionResult` in app.ts
- **Files modified:** `src/shared/validators/app.ts`
- **Commit:** `2ff400b`

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| TaskTray placeholder | `WelcomeScreen.tsx` | 42 | Lazy-loaded TaskTray implementation deferred to Plan 03 |
| `settings.onSettingsClick` not wired | `App.tsx` | 4 | Command palette / settings panel deferred to Plan 05 |

## Threat Flags

None — this plan did not introduce network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. IPC handlers are validated with Zod schemas and accessed only through the preload bridge (no direct main process exposure).

## Self-Check: PASSED

- All 19 created/modified files verified on disk
- All 3 commits (2ff400b, ec4b3c3, bee19c3) verified in git log
- Build: clean (typecheck + electron-vite build)
- Tests: 24/24 pass
- Summary created at: `.planning/phases/01-foundation/01-02-SUMMARY.md`
