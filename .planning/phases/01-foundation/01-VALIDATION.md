---
phase: 01
slug: foundation
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-11
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v4.1.8 + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |
| **Test files** | 5 files, 24 tests |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Automated Command | Status |
|---------|------|------|-------------|------------|-------------------|--------|
| 01.01-01 | 01 | 1 | FND-01 | T-01-SC, T-01-02 | `npm run build` succeeds (compiles main+preload+renderer) | ✓ verified |
| 01.01-02 | 01 | 1 | FND-01, FND-05 | — | `npx vitest run` — all 24 tests pass | ✓ verified |
| 01.01-03 | 01 | 1 | FND-03 | T-01-01 | `npx vitest run src/shared/validators/` — Zod schema tests pass | ✓ verified |
| 01.02-01 | 02 | 2 | FND-01, FND-02, FND-03 | T-02-01, T-02-02, T-02-03, T-02-04 | `npx vitest run src/shared/validators/ src/main/index.test.ts` — IPC + security tests pass | ✓ verified |
| 01.02-02 | 02 | 2 | FND-04 | — | `npx vitest run src/renderer/components/viewers/ViewerRegistry.test.ts` — lazy-loading registry works | ✓ verified |
| 01.02-03 | 02 | 2 | FND-01, FND-05 | — | Manual check in Electron window (dark theme, WelcomeScreen) | ✓ verified in UAT |

---

## Wave 0 Requirements

- [x] `src/main/index.test.ts` — verify BrowserWindow security flags (4 tests pass)
- [x] `src/shared/validators/app.test.ts` — Zod schema validation (5 tests pass)
- [x] `src/shared/validators/window.test.ts` — Zod schema validation (5 tests pass)
- [x] `src/renderer/hooks/useElectronAPI.test.ts` — typed bridge wrapper (6 tests pass)
- [x] `src/renderer/components/viewers/ViewerRegistry.test.ts` — lazy-loading registry (4 tests pass)
- [x] `vitest.config.ts` — framework configured and working
- [x] Playwright deferred to Phase 2 (per plan design — Phase 1 has minimal UI surface)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App launches with dark-themed UI | FND-01, FND-05 | Electron window rendering requires visual inspection | Run `npm run dev`, verify window has dark background (#100e17) and cyan accents (#0fb6d6) |
| Welcome screen displays heading and tagline | FND-05 | Visual rendering | Inspect window for "AI CLI Studio" heading and tagline |
| App starts in under 2 seconds | FND-01 | Performance measurement | `time npm run dev` or use Electron devtools performance tab |
| Idle memory stays under 200 MB | FND-01 | Performance measurement | Check Electron task manager or OS process monitor |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-06-11
