---
phase: 02-core-artifact-viewing
plan: 03
subsystem: ipc, file-system
tags: electron, ipc, preload, context-isolation, process-cwd
requires:
  - phase: 02-core-artifact-viewing
    plan: 01
    provides: IPC infrastructure, preload bridge, ElectronAPI types
  - phase: 02-core-artifact-viewing
    plan: 02
    provides: useFileBrowser hook, file browser store
provides:
  - app:getCwd IPC channel returning correct process.cwd() from main process
  - electronAPI.app.getCwd() preload bridge method
  - Updated useFileBrowser hook using IPC instead of renderer process.cwd()
affects: 03-agent-communication
tech-stack:
  added: []
  patterns:
    - "IPC channel pattern: channel constant in ipc.ts → Zod schema in validators/ → handler in main/ipc/ → bridge in preload/ → type in window.d.ts → consumer in renderer/"
key-files:
  created: []
  modified:
    - ai-cli-studio/src/shared/types/ipc.ts
    - ai-cli-studio/src/shared/validators/app.ts
    - ai-cli-studio/src/main/ipc/app.ts
    - ai-cli-studio/src/preload/index.ts
    - ai-cli-studio/src/shared/types/window.d.ts
    - ai-cli-studio/src/renderer/src/hooks/useFileBrowser.ts
key-decisions:
  - "Used IPC_CHANNELS.APP_GET_CWD constant (not string literal) for handler registration — consistent with all existing IPC handlers"
  - "Used process.cwd() (not app.getPath('userData')) for root directory — the project directory where the CLI agent started is the correct default per D-11"
requirements-completed:
  - UI-04
duration: 2 min
completed: 2026-06-11
---

# Phase 2 Plan 3: app:getCwd IPC Channel — Fix Empty File Browser in Electron Renderer

**Wired `app:getCwd` IPC channel through all layers and updated `useFileBrowser` to use it, fixing the empty file browser caused by renderer `process.cwd()` returning Electron's resource path instead of the user's project directory.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-11T09:44:04Z
- **Completed:** 2026-06-11T09:45:59Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `APP_GET_CWD` channel constant to `IPC_CHANNELS` in `ipc.ts`
- Added `AppGetCwdResult` / `AppGetCwdSchema` to `validators/app.ts` (following existing `AppGetVersionResult` pattern)
- Registered `ipcMain.handle(IPC_CHANNELS.APP_GET_CWD, ...)` in `main/ipc/app.ts`, returning `process.cwd()` from the main process (where it resolves to the user's project directory)
- Exposed `getCwd: () => ipcRenderer.invoke('app:getCwd')` on the `electronAPI.app` preload bridge
- Added `getCwd: () => Promise<string>` type to `ElectronAPI.app` interface in `window.d.ts`
- Updated `useFileBrowser.ts` to call `await electronAPI.app.getCwd()` instead of `process.cwd()`, with fallback to `/home` if the IPC call fails

## Task Commits

Each task was committed atomically:

1. **Task 1: Add app:getCwd IPC channel** — `893d469` (feat)
2. **Task 2: Update useFileBrowser.ts** — `82abe75` (feat)

## Files Created/Modified
- `ai-cli-studio/src/shared/types/ipc.ts` - Added `APP_GET_CWD: 'app:getCwd'` to `IPC_CHANNELS`
- `ai-cli-studio/src/shared/validators/app.ts` - Added `AppGetCwdResult` / `AppGetCwdSchema` Zod schemas
- `ai-cli-studio/src/main/ipc/app.ts` - Added `app:getCwd` handler returning `process.cwd()`
- `ai-cli-studio/src/preload/index.ts` - Added `getCwd` method to `electronAPI.app` bridge
- `ai-cli-studio/src/shared/types/window.d.ts` - Added `getCwd: () => Promise<string>` to `ElectronAPI.app` interface
- `ai-cli-studio/src/renderer/src/hooks/useFileBrowser.ts` - Replaced `process.cwd()` with `await electronAPI.app.getCwd()`

## Decisions Made
- Used `IPC_CHANNELS.APP_GET_CWD` constant (not `'app:getCwd'` string literal) for handler registration — consistent with all existing IPC handlers
- Used `process.cwd()` (not `app.getPath('userData')`) for root directory — the project directory where the CLI agent started is the correct default per D-11

## Deviations from Plan

None - plan executed exactly as written.

### Verification Note
The plan's automated verify step for `main/ipc/app.ts` checked for the literal string `app:getCwd` in the file, but the handler correctly uses `IPC_CHANNELS.APP_GET_CWD` (consistent with all other handlers). This is the correct architectural pattern — the constant resolves to `'app:getCwd'` at runtime. No functionality gap.

## Issues Encountered
None

## Threat Flags
None — no new security-relevant surface introduced beyond the accepted `app:getCwd` IPC channel (T-02-03-01, disposition: accept).

## Self-Check: PASSED

- All 6 files modified verified present on disk
- Both commits exist in git log
- `npm run typecheck` passes (both node and web configs)
- `npm test` passes — all 29 tests across 6 test files
- `process.cwd()` usage removed from runtime code (only remains in explanatory comment)

## Next Phase Readiness
- File browser now receives correct project root directory from main process via IPC
- UAT tests 3, 4, 6, 8, 9, 10, 11, 12, 13 unblocked (were blocked_by: "File browser empty — no files to click")
- UAT tests 2 (tab bar opens files) and 7 (file browser sorted tree) unblocked
- Phase 2 UAT summary can be re-run with all previously blocked tests now reachable
- Ready for Phase 3 (agent communication) planning

---

*Phase: 02-core-artifact-viewing*
*Completed: 2026-06-11*
