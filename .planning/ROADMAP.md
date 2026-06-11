# Roadmap: AI CLI Studio

## Overview

AI CLI Studio bridges the gap between "AI CLI agent generates an artifact" and "user sees it." Starting from a secure Electron foundation, we build a preview-first tabbed artifact viewer, then wire it for agent control via WebSocket and MCP, and finally add advanced renderers for HTML, SVG, PDF, and Mermaid. Each phase delivers a complete, verifiable user capability — from "app launches" in Phase 1 to "all artifact types supported" in Phase 4.

## Phases

- [x] **Phase 1: Foundation** — Electron scaffold, secure IPC, dark theme, lazy-loading infrastructure
- [x] **Phase 2: Core Artifact Viewing** — Tabbed preview-first UI with code/markdown/image renderers and file browser (completed 2026-06-11)
- [ ] **Phase 3: Agent Communication** — WebSocket protocol, dual-mode connectivity, and MCP server
- [ ] **Phase 4: Advanced Artifacts** — HTML sandbox, SVG interactive, PDF viewer, Mermaid diagrams

## Phase Details

### Phase 1: Foundation

**Goal**: Electron app launches securely across platforms with IPC infrastructure and performance baseline
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05
**Success Criteria** (what must be TRUE):

  1. User can launch the app on Linux (build pipeline produces packages for Windows and macOS)
  2. App window appears with consistent dark-themed UI — all surfaces use the dark palette
  3. IPC communication between renderer and main process works through typed, Zod-validated channels via contextBridge
  4. Artifact renderers are not loaded on startup — lazy-loading infrastructure defers them until needed
  5. App starts in under 2 seconds and stays under 200 MB idle RAM

**Plans**: 2 plans across 2 waves
**Research flags**: Cross-platform CI configuration (GitHub Actions matrix for Linux/macOS/Windows + AppImage/NSIS/DMG) needs a brief research spike for platform-specific quirks.
**UI hint**: yes

Plans:

- [x] 01-01-PLAN.md — Scaffold + build tooling + failing contract tests (Wave 1)
- [x] 01-02-PLAN.md — IPC stack + dark theme + WelcomeScreen + ViewerRegistry (Wave 2)

### Phase 2: Core Artifact Viewing

**Goal**: Users can browse files and view code, markdown, and image artifacts in a preview-first tabbed interface
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03, UI-04, RND-01, RND-02, RND-04, ST-01
**Success Criteria** (what must be TRUE):

  1. User sees a preview-first view of each artifact with a "show code" toggle that reveals the source
  2. User can switch between preview-only, code-only, and side-by-side split-pane layouts with a draggable resize handle
  3. User can open multiple artifacts in tabs, switch between them with state preserved, and close individual tabs
  4. User can browse the project directory in a file browser sidebar and click a file to open it as a new artifact tab
  5. Code artifacts render with Shiki syntax highlighting, Markdown renders with Obsidianite-themed styling, and images render inline

**Plans**: 3 plans across 2 waves (+1 gap closure plan)
**UI hint**: yes

### Phase 3: Agent Communication

**Goal**: AI agents can control the canvas programmatically via WebSocket API and MCP, in both self-contained and agent-connected modes
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: COM-01, COM-02, COM-03, COM-04, COM-05, COM-06, COM-07, COM-08, COM-09, ST-02
**Success Criteria** (what must be TRUE):

  1. Agent can connect to Studio via WebSocket — either Electron runs the server (self-contained mode) or Electron connects to the agent's server (agent-connected mode)
  2. Agent can open, close, update, toggle view mode, and resize artifacts via WebSocket API
  3. User can trigger artifact operations via hotkey or application menu (user command mode)
  4. MCP server exposes ≤15 canvas-control tools (open, update, close, toggle, list, get_state) and can be disabled via `--no-mcp` flag
  5. WebSocket session recovers automatically with exponential backoff reconnection, and HTML artifact sandboxes have no network access by default

**Plans**: TBD
**Research flags**: MCP tool design needs validation by testing with real agents (Claude Code, Codex). Session resume protocol format needs a brief design spike.
**UI hint**: yes

### Phase 4: Advanced Artifacts

**Goal**: Users can view HTML, SVG, PDF, and Mermaid artifacts securely with proper sandboxing and performance
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: RND-03, RND-05, RND-06, RND-07
**Success Criteria** (what must be TRUE):

  1. HTML artifacts render as live previews in a sandboxed iframe (`srcdoc` + `sandbox` + CSP) with no network access
  2. SVG artifacts render inline with interactive capabilities (tooltips, hover effects, animations)
  3. PDF artifacts render in an embedded viewer with page navigation, with graceful degradation for documents over 50 pages
  4. Mermaid diagrams render from diagram syntax, supporting flowchart, sequence, class, and state diagram types

**Plans**: TBD
**Research flags**: CSP configuration in Electron differs from browsers in some edge cases — needs prototyping. PDF.js worker configuration and memory behavior across multiple tabs needs heap snapshot verification.
**UI hint**: yes

## Progress

**Execution Order:** Phases execute sequentially: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | ✓ Complete | 2026-06-11 |
| 2. Core Artifact Viewing | 2/2 | Complete   | 2026-06-11 |
| 3. Agent Communication | 0/TBD | Not started | - |
| 4. Advanced Artifacts | 0/TBD | Not started | - |
