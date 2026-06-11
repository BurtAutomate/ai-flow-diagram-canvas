# AI CLI Studio

## What This Is

An Electron-based Canvas / Artifact Viewer purpose-built for AI CLI coding agents (OpenCode, Claude Code, Codex, etc.). When an agent submits an artifact — code, markdown, HTML, SVG, images, PDF — the Studio opens a native window to preview it, with a Preview-First view, optional code view toggle, tabs for multiple open artifacts, and a file browser. It also serves as an extensible toolbox platform for add-on apps (Phase 2+), exposes a WebSocket-based API for agent control, and ships with an MCP server that agents can connect to.

## Core Value

AI CLI agents must have a visual canvas that just works — open artifacts, preview them, toggle code, browse files — controllable programmatically via API and MCP, cross-platform, and extensible for future tool apps.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **ARTF-01**: Electron app launches on Linux, Windows, and macOS
- [ ] **ARTF-02**: Agent can open an artifact via WebSocket API (auto-detect, agent command, user command)
- [ ] **ARTF-03**: Artifact renders in Preview-First view with Code-View toggle (side-by-side also available)
- [ ] **ARTF-04**: Multiple artifacts open in tabs, switchable by clicking
- [ ] **ARTF-05**: HTML artifacts render as live previews
- [ ] **ARTF-06**: Markdown artifacts render with Obsidianite-inspired themed viewer
- [ ] **ARTF-07**: Code artifacts (JS, TS, JSX, TSX, CSS, HTML, SVG) display with syntax highlighting and code view
- [ ] **ARTF-08**: Image artifacts (PNG, JPG, GIF) render inline
- [ ] **ARTF-09**: PDF artifacts render in an embedded viewer
- [ ] **ARTF-10**: File browser shows current project root with optional workspace scope
- [ ] **ARTF-11**: MCP server is exposed and can be disabled
- [ ] **ARTF-12**: Agent can control the canvas — open, update, toggle, resize — via high-level API over WebSocket
- [ ] **ARTF-13**: Self-contained mode (Electron runs its own local server)
- [ ] **ARTF-14**: Agent-connected mode (agent runs a server, Electron connects)

### Out of Scope

- Excalidraw-equivalent diagram app — Phase 2 (separate plan)
- Add-on toolbox apps beyond file browser — Phase 2+
- Real-time collaborative editing — future consideration

## Context

Built for the AI CLI agent ecosystem where agents currently have no native visual output. The studio fills the gap between "agent generates an artifact" and "user sees it" — similar to ChatGPT's Canvas or Claude's Artifacts, but designed for local CLI agent workflows. The Obsidianite theme (referenced from a local design exploration) will serve as visual inspiration for the markdown viewer.

## Constraints

- **Platform**: Must run on Linux, Windows, and macOS — Electron is chosen for this
- **Communication**: WebSocket protocol — bidirectional, persistent, supports both standalone and agent-connected modes
- **MCP**: Must be disableable — agents that don't use MCP should not be forced into it
- **Frontend**: React + TypeScript (Next.js if full-stack is needed)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Electron for cross-platform | Linux + Windows + macOS required | — Pending |
| WebSocket protocol | Bidirectional, persistent, works for both modes | — Pending |
| React + TypeScript | Ecosystem support, component reuse, team familiarity | — Pending |
| Preview-First default | Show the artifact immediately, code on demand | — Pending |
| MCP server core + disable-able | Agents need control, but opt-out must exist | — Pending |
| Obsidianite-inspired MD theme | Reference design, not direct import | — Pending |

---
*Last updated: 2025-06-11 after initialization*
