---
phase: 01
slug: foundation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-11
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → local install | Packages pulled from public registry during scaffold | Package contents (no credentials) |
| dev machine → CI runner | Build artifacts cross trust boundary during CI execution | Build artifacts (no secrets) |
| Renderer → Preload → Main | Untrusted renderer crosses contextBridge into trusted main process | IPC channel payloads (Zod-validated) |
| IPC channel invocation | Any code in renderer can invoke ipcRenderer through exposed preload methods | Method-specific args |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-SC | Tampering | npm package installs | mitigate | Packages verified in RESEARCH.md Package Legitimacy Audit — all >2M weekly downloads, verified repo URLs, empty postinstall scripts | closed |
| T-01-01 | Tampering | Scaffold insecure BrowserWindow defaults | accept | Plan 02 hardens security flags (contextIsolation, sandbox, nodeIntegration). Failing contract test catches insecure defaults. | closed |
| T-01-02 | Information Disclosure | CI workflow secrets | mitigate | CI workflow uses no secrets, API keys, tokens, or env vars | closed |
| T-02-01 | Tampering | IPC channel injection via malformed payloads | mitigate | Zod schema validation (`.parse()`) on every `ipcMain.handle()` — schemas reject unexpected types, enforce defaults | closed |
| T-02-02 | Elevation of Privilege | XSS in renderer → RCE | mitigate | `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` in BrowserWindow. Enforced by test (src/main/index.test.ts source parsing) | closed |
| T-02-03 | Repudiation | Preload bridge exposes more API than intended | mitigate | Single `contextBridge.exposeInMainWorld()` call. Whitelisted methods only (app, window, on). No `sendSync`, no direct `ipcRenderer` | closed |
| T-02-04 | Tampering | Synthetic IPC events circumventing preload | mitigate | No direct `ipcRenderer` access from renderer. All IPC goes through typed preload bridge methods. `useElectronAPI` hook prevents arbitrary channel invocation | closed |
| T-02-05 | Information Disclosure | main→renderer events leak sensitive data | accept | Phase 1 has no sensitive data. Phase 2+ will add per-channel event filtering | closed |
| T-02-SC | Tampering | npm install integrity | accept | All packages verified in RESEARCH.md Package Legitimacy Audit. Postinstall scripts confirmed empty | closed |

*Status: closed · open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-01 | T-01-01 | Scaffold sandbox: false was acceptable temporarily — Plan 02 hardened all three flags before shipping Phase 1 | planning | 2026-06-11 |
| AR-02-05 | T-02-05 | Phase 1 has no sensitive data (no file system, WebSocket, or credentials). Per-channel filtering deferred to Phase 2+ | planning | 2026-06-11 |
| AR-02-SC | T-02-SC | All npm packages verified in RESEARCH.md audit — postinstall scripts confirmed empty | planning | 2026-06-11 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-11 | 9 | 9 | 0 | secure-phase automated audit |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-11
