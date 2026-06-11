# Requirements: AI CLI Studio

**Defined:** 2026-06-11
**Core Value:** AI CLI agents must have a visual canvas that just works — open artifacts, preview them, toggle code, browse files — controllable programmatically via API and MCP, cross-platform, and extensible for future tool apps.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FND-01**: Electron app launches on Linux, Windows, and macOS
- [ ] **FND-02**: Preload bridge enforces contextIsolation with typed IPC via contextBridge
- [ ] **FND-03**: All IPC channels validated with Zod schemas
- [ ] **FND-04**: Lazy-loading infrastructure established for artifact renderers
- [ ] **FND-05**: Dark theme applied consistently across all UI

### Artifact Rendering

- [ ] **RND-01**: Code artifacts (JS, TS, JSX, TSX, CSS, HTML, SVG) display with Shiki syntax highlighting
- [ ] **RND-02**: Markdown artifacts render with Obsidianite-inspired themed viewer
- [ ] **RND-03**: HTML artifacts render as live previews in a sandboxed iframe
- [ ] **RND-04**: Images (PNG, JPG, GIF, SVG) render inline
- [ ] **RND-05**: SVG artifacts render with interactive capabilities (tooltips, hover, animations)
- [ ] **RND-06**: PDF artifacts render in an embedded viewer (react-pdf / PDF.js)
- [ ] **RND-07**: Mermaid diagrams render from diagram syntax

### UI

- [ ] **UI-01**: Preview-First default view — artifact renders immediately, code toggle reveals source
- [ ] **UI-02**: Side-by-side split pane — preview and code visible simultaneously with resize handle
- [ ] **UI-03**: Multi-tab artifacts — tab bar with close, switch, and state preservation
- [x] **UI-04**: File browser showing current project root with optional workspace scope

### Agent Communication

- [ ] **COM-01**: WebSocket API for artifact protocol — bidirectional, typed messages
- [ ] **COM-02**: Auto-open artifacts when agent sends via WebSocket
- [ ] **COM-03**: Agent command trigger — agent can open/close/update artifacts via API
- [ ] **COM-04**: User command trigger — user can open/close artifacts via hotkey or menu
- [ ] **COM-05**: Self-contained mode — Electron runs its own WebSocket server, agent connects
- [ ] **COM-06**: Agent-connected mode — agent runs server, Electron connects as client
- [ ] **COM-07**: MCP Server exposed with disable capability — agents control canvas via MCP tools
- [ ] **COM-08**: Session resume protocol with exponential backoff reconnection
- [ ] **COM-09**: Privacy-first sandbox — HTML artifacts have no network access by default

### State & Persistence

- [ ] **ST-01**: Zustand stores for artifact tabs, connection state, UI state, and file browser
- [ ] **ST-02**: WebSocket session state managed with resume capability

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Theme & Polish

- **PL-01**: Light theme (v1 has dark only)
- **PL-02**: Window/tab state restore across sessions

### Add-ons

- **ADD-01**: Plugin system for custom artifact types and add-on toolbox apps

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-UI code editing | Viewer, not editor — the agent edits, user views |
| Persistent artifact storage | Artifacts map to files on disk; file browser handles discovery |
| Publishing artifacts to URLs | Desktop app should not become a web server |
| Reactive/stateful artifact runtime | Security surface too large; keep artifacts static |
| Collaborative editing | Out of scope per PROJECT.md |
| Excalidraw-equivalent diagram app | Phase 2 — separate plan |
| Plugin API | v2+ after core is validated |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| FND-04 | Phase 1 | Pending |
| FND-05 | Phase 1 | Pending |
| RND-01 | Phase 2 | Pending |
| RND-02 | Phase 2 | Pending |
| RND-03 | Phase 4 | Pending |
| RND-04 | Phase 2 | Pending |
| RND-05 | Phase 4 | Pending |
| RND-06 | Phase 4 | Pending |
| RND-07 | Phase 4 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Complete |
| COM-01 | Phase 3 | Pending |
| COM-02 | Phase 3 | Pending |
| COM-03 | Phase 3 | Pending |
| COM-04 | Phase 3 | Pending |
| COM-05 | Phase 3 | Pending |
| COM-06 | Phase 3 | Pending |
| COM-07 | Phase 3 | Pending |
| COM-08 | Phase 3 | Pending |
| COM-09 | Phase 3 | Pending |
| ST-01 | Phase 2 | Pending |
| ST-02 | Phase 3 | Pending |

**Coverage:**

- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-11*
*Last updated: 2026-06-11 after initial definition*
