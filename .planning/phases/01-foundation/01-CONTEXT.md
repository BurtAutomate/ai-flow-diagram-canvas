# Phase 1: Foundation - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the foundational Electron app shell: cross-platform scaffold with secure IPC architecture, dark theme with Obsidianite-inspired palette, and lazy-loading infrastructure. No artifact rendering, agent communication, or file browsing — this is the skeleton everything else attaches to.

Requirements: FND-01 through FND-05 (Electron launch, preload bridge + contextIsolation, Zod-validated IPC, lazy-loading infra, dark theme).

</domain>

<decisions>
## Implementation Decisions

### Project Scaffolding
- **D-01:** Use `npm create @quick-start/electron@latest --template react-ts` — the official electron-vite scaffold. Confirm latest versions at build time (Electron 42.4.0+, electron-vite 5.0.0+, React 19.2.7+, Tailwind CSS 4.3.0+).
- **D-02:** Layer-first structure following electron-vite defaults: `src/main/` (IPC handlers, window management), `src/preload/` (contextBridge, one audited file), `src/renderer/` (React SPA).
- **D-03:** Package as AppImage/DEB (Linux) and NSIS (Windows) for v1. macOS DMG deferred.

### IPC Architecture
- **D-04:** Namespaced router pattern — `ipcMain.handle()` with `namespace:action` channel naming (e.g., `artifact:open`, `fs:read`, `app:quit`). One source file per namespace.
- **D-05:** One Zod schema per IPC channel — validates both input params and return type. No shared mega-schemas.
- **D-06:** Single `contextBridge.exposeInMainWorld('electronAPI', {...})` with namespaced API surface: `electronAPI.artifact.*`, `electronAPI.fs.*`, `electronAPI.app.*`. One audited preload file.

### Dark Theme
- **D-07:** Tailwind CSS 4 dark mode via `@theme` directive with CSS custom properties for the palette. No separate theme config file.
- **D-08:** Dark palette inspired by Obsidianite — extract accent/background/text values as reference, adapt for code-viewing readability. Not a direct port.
- **D-09:** Single accent color (teal/blue) with semantic palette (success/green, warning/amber, error/red).

### Lazy-Loading
- **D-10:** Per-artifact-type lazy loading via `React.lazy()` + `Suspense` — each viewer (CodeViewer, MarkdownViewer, ImageViewer, etc.) is its own chunk loaded on first tab open of that type.
- **D-11:** Skeleton screen loading states matching viewer layout — not spinners.
- **D-12:** Trigger lazy load on tab open, not on app start — optimizes perceived performance.

### Agent's Discretion
- Tailwind dark mode implementation approach (CSS custom properties vs `dark:` class strategy) — use standard Tailwind v4 patterns.
- Specific skeleton screen designs — standard shimmer/skeleton pattern.
- CI tooling (GitHub Actions vs other) — use standard practices for Electron cross-platform builds.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` §Foundation — FND-01 through FND-05 requirements
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, dependencies
- `.planning/research/SUMMARY.md` §Phase 1 — Research findings, stack recommendations, pitfalls

### No external specs
All requirements captured in decisions above — no external SPEC.md or ADR files for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
(None — greenfield project, no existing codebase.)

### Established Patterns
(None — this phase establishes the foundational patterns all future phases will follow.)

### Integration Points
(None — this phase builds the integration points for downstream phases.)

</code_context>

<specifics>
## Specific Ideas
- Obsidianite theme to reference for dark palette inspiration: `~/code/CUSTOM_AI_Coding_Agent/01_Intro/Obsidianite` (local reference only — use as visual inspiration, not direct import)
- Project renamed from "AI Agent Studio" to **AI CLI Studio** with package name `ai-cli-studio`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-06-11*
