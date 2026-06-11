---
phase: 01
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-11
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `vitest.config.ts` (or `electron.vite.config.ts` — check scaffold output) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------|-------------------|--------|
| 01.01-01 | 01 | 1 | FND-01 | T-01-01, T-01-02 | smoke | `npm run build` succeeds | ⬜ pending |
| 01.01-02 | 01 | 1 | FND-01, FND-05 | — | config | `npx vitest run --reporter=dot` | ⬜ pending |
| 01.01-03 | 01 | 1 | FND-02, FND-03, FND-04 | T-01-02 | unit | `npx vitest run src/shared/validators/` | ⬜ pending |
| 01.02-01 | 02 | 2 | FND-01, FND-02, FND-03 | T-01-01, T-01-02, T-01-03 | unit | `npx vitest run src/main/ipc/` | ⬜ pending |
| 01.02-02 | 02 | 2 | FND-04, FND-05 | T-01-04 | unit | `npx vitest run src/renderer/components/viewers/` | ⬜ pending |
| 01.02-03 | 02 | 2 | FND-01, FND-05 | — | smoke | Manual check in Electron window | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `src/main/index.test.ts` — verify BrowserWindow config has correct security flags
- [ ] `src/shared/validators/app.test.ts` — verify Zod schemas accept/reject correct payloads
- [ ] `src/renderer/hooks/useElectronAPI.test.ts` — verify typed wrapper works (mock contextBridge)
- [ ] `src/renderer/components/viewers/ViewerRegistry.test.ts` — verify registry maps types correctly, suspense boundary exists
- [ ] `vitest.config.ts` — framework install/configuration if not scaffolded
- [ ] Setup Playwright for E2E tests (Phase 1 can skip — add in Phase 2)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App launches with dark-themed UI | FND-01, FND-05 | Electron window rendering requires visual inspection | Run `npm run dev`, verify window has dark background |
| Welcome screen displays heading and tagline | FND-05 | Visual rendering | Inspect window for "AI CLI Studio" heading |
| App starts in under 2 seconds | FND-01 | Performance measurement | `time npm run dev` or use Electron devtools performance tab |
| Idle memory stays under 200 MB | FND-01 | Performance measurement | Check Electron task manager or OS process monitor |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
