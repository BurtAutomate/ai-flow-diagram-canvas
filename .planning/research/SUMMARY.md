# Project Research Summary

**Project:** AI CLI Studio
**Domain:** Electron-based Canvas / Artifact Viewer for AI CLI Agents
**Researched:** 2026-06-11
**Confidence:** HIGH

## Executive Summary

AI CLI Studio is a native desktop artifact viewer designed for CLI coding agents (Claude Code, Codex, OpenCode, Cline, etc.) — a niche no existing product adequately serves. ChatGPT Canvas, Claude Artifacts, and Gemini Canvas are all embedded in chat UIs; the Codex App focuses on task management rather than viewing. This product fills a gap: a lightweight, preview-first desktop canvas that agents control programmatically via WebSocket and MCP, with a self-contained mode (Electron runs the server) and an agent-connected mode (Electron connects to the agent's server).

**The recommended approach** is a four-process Electron architecture (main/preload/renderer/utility) with strict process isolation. WebSocket and MCP servers run as separate `utilityProcess` instances — never in the main process. The renderer is fully sandboxed (`contextIsolation: true`, `sandbox: true`), with all system interaction routed through typed, Zod-validated IPC via `contextBridge`. Artifact viewers use a registry pattern for extensibility. The stack prioritizes lightweight, purpose-built libraries: `react-shiki` over Monaco/CodeMirror for display-only highlighting, `react-markdown` over `marked` for XSS-safe markdown, and raw `ws` over Socket.IO since both endpoints live in-process.

**Key risks** center on three areas: (1) **Security** — the HTML preview sandbox, MCP input validation, and IPC boundaries must be correct from day one; retrofitting them costs weeks. (2) **Performance** — lazy-loading all artifact renderers is non-negotiable; a fully bundled startup consumes 400MB+ RAM and takes 8+ seconds. (3) **Agent confusion from over-engineered MCP tools** — research shows AI agent performance degrades logarithmically with tool count; the MCP surface must be designed around agent tasks (≤15 tools), not internal API structure. Mitigations are well-documented: enforce a startup time budget, keep `contextIsolation: true` as a CI lint rule, and test MCP tool sets with real agents before shipping.

## Key Findings

### Recommended Stack

The stack is straightforward and well-documented. Electron 42 + electron-vite 5 provides a modern, fast-bundling foundation. The key architectural choice is choosing lightweight, single-purpose rendering libraries over heavy all-in-one alternatives.

**Core technologies:**
- **Electron 42 + electron-vite 5**: Cross-platform desktop shell with Vite-powered HMR and separate build configs for main/preload/renderer
- **React 19 + TypeScript 5**: UI framework with type safety across WebSocket protocols and MCP interfaces
- **Tailwind CSS 4**: Utility-first styling with custom Obsidianite theme via `@theme` directive
- **ws 8** (not Socket.IO): Lightweight WebSocket — both endpoints in-process, no protocol overhead
- **@modelcontextprotocol/sdk 1.29**: Official MCP SDK for exposing canvas control tools to agents
- **react-shiki 0.9** (not Monaco/CodeMirror): Display-only syntax highlighting — 10x lighter than CodeMirror, no `dangerouslySetInnerHTML`
- **react-markdown 10 + remark-gfm**: XSS-safe markdown rendering with extensible plugin system
- **react-pdf 10**: PDF viewing via PDF.js with clean React component API
- **@radix-ui/react-tabs + @radix-ui/react-scroll-area**: Accessible, unstyled UI primitives
- **Zustand + immer**: Lightweight state management for artifact tabs, connection status, and UI state
- **Vitest + Playwright**: Testing — native Vite integration for unit tests, Electron-specific E2E coverage

**What NOT to use:** Socket.IO (protocol overhead), Monaco Editor (25MB for display-only), CodeMirror (editor when we need viewer), Redux/Zustand (overkill — React context suffices), Next.js (SSR for a desktop app), webpack (electron-vite replaces it), `marked` (XSS via `dangerouslySetInnerHTML`).

See [STACK.md](./STACK.md) for full version compatibility matrix and alternative comparisons.

### Expected Features

The feature set targets CLI agent users as the primary audience. Competitor analysis (ChatGPT Canvas, Claude Artifacts, Gemini Canvas, Codex App) revealed a clear gap: **no product offers a native, programmatically-controlled desktop canvas that works with any CLI agent via WebSocket + MCP.**

**Must have (table stakes):**
- Artifact rendering (code with syntax highlighting, Markdown with Obsidianite theme, HTML sandboxed preview, images) — users expect at least what competitors offer
- Preview-first default with code view toggle and side-by-side split pane — the pattern Claude and ChatGPT set
- Multi-tab artifacts with close/reorder/switch — agents produce multiple outputs simultaneously
- WebSocket API for agent-to-canvas communication — the primary control surface
- Dark/light theme, cross-platform (Linux, macOS, Windows)
- Auto-open artifacts from agent messages

**Should have (competitive differentiators):**
- **MCP Server (disable-able)** — the killer feature. No competitor exposes a native MCP canvas. This makes Studio controllable from any MCP-compatible agent.
- **Dual-mode operation** — self-contained (Electron runs its own WS server) or agent-connected (Electron connects to agent's server). Unique to this product.
- **File browser with workspace scope** — Claude and ChatGPT don't have one at all; Codex has a basic version.
- **PDF viewer embedded** — Claude recently added PDF support; ChatGPT doesn't have it.
- **Privacy-first sandbox** — HTML artifacts have no network access by default (matching Claude's approach, stricter than ChatGPT).
- **MCP file system tools** — read/write/list/search within workspace scope, replacing a separate file-explorer MCP server.

**Defer (v2+):**
- Reactive/stateful artifact runtime (live React apps) — too complex, security surface too large
- Collaborative editing — out of scope per PROJECT.md
- Plugin system for custom artifact types — stabilize core rendering first
- Publishing artifacts to public URLs — server infrastructure for a local desktop app is an anti-pattern
- In-UI code editing — the agent edits, the viewer displays; users already have IDEs

See [FEATURES.md](./FEATURES.md) for full MVP definition (ARTF-01 through ARTF-14), feature prioritization matrix, and competitor analysis.

### Architecture Approach

The architecture follows a **four-process Electron model** with strict separation: utility processes for long-running services (WebSocket, MCP), a thin main process for window lifecycle and IPC routing, an audited preload bridge, and a fully sandboxed React renderer. The key structural insight is that WebSocket and MCP servers must NOT run in the main process — they belong in `utilityProcess` instances for crash isolation and independent restartability.

**Major components:**
1. **WebSocket Utility Process** (`src/ws-service/`) — Runs WS server (self-contained mode) or WS client (agent-connected mode); parses artifact payloads; communicates with main via `MessageChannelMain`
2. **MCP Utility Process** (`src/mcp-service/`) — Exposes ≤15 task-oriented tools via `@modelcontextprotocol/sdk`; supports stdio and WS transports; disable-able via `--no-mcp` flag
3. **Main Process** (`src/main/`) — App lifecycle, window management, namespaced IPC router with Zod validation, file system operations, OS dialogs
4. **Renderer (React SPA)** (`src/renderer/`) — Sandboxed UI with Zustand stores (artifact, connection, UI, file browser), viewer registry (strategy pattern), lazy-loaded artifact viewers
5. **Preload Bridge** (`src/preload/`) — Single audited file exposing typed `window.electronAPI` with `artifact`, `fs`, `app`, `mcp`, `connection` namespaces

**Key patterns:** Process isolation for background services, dual-mode connection strategy (self-contained/agent-connected), namespaced IPC with Zod validation, viewer registry (strategy pattern for extensibility), tab-based state management with LRU eviction.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete project structure, data flow diagrams, example code for each pattern, and anti-patterns to avoid.

### Critical Pitfalls

1. **No performance budget / loading everything upfront** — Lazy-load artifact renderers from day one. Enforce <2s startup, <200MB idle RAM. This must be established in Phase 1 before any renderers are added.

2. **Leaky IPC — treating contextBridge as optional** — Never set `nodeIntegration: true` or `contextIsolation: false`. Enforce as a CI lint rule. Clean up IPC listeners on unmount. A prompt injection in an HTML preview artifact + Node.js access = full RCE.

3. **MCP server with too many tools** — Design tools around agent tasks, not internal API endpoints. Keep ≤15 tools. Test with real agents. GitHub Copilot cut from 40→13 tools and saw measurable improvement in tool selection accuracy.

4. **No input validation on MCP tools** — Never construct shell commands from tool arguments. Sanitize all filesystem paths (resolve to absolute, verify within allowed directory). The official Anthropic Git MCP server had 3 CVEs from unsanitized input. 82% of MCP implementations are vulnerable to path traversal.

5. **Cross-platform file path bugs** — Normalize all paths with `path.resolve()` immediately on input. Use `app.getPath()` for platform-specific directories. Test on all three platforms in CI. Filter system directories from file browser (`/proc`, `/sys`, etc.).

6. **WebSocket reconnection chaos** — Design session resume protocol from the start. Implement exponential backoff with jitter. Use 15s heartbeat/ping-pong. Never auto-reconnect >5x without user notification.

See [PITFALLS.md](./PITFALLS.md) for all 8 critical pitfalls, 15+ technical debt patterns, integration gotchas, performance traps, security mistakes, UX pitfalls, and the "Looks Done But Isn't" checklist.

## Implications for Roadmap

Based on combined research, the build order is governed by two critical dependencies: (1) the IPC foundation must come before anything that communicates across processes, and (2) the artfact tab system must exist before viewers or WebSocket integration. The WebSocket and MCP services are independent of each other once IPC is established and can be built in parallel.

### Phase 1: Foundation — Electron Shell + IPC Architecture
**Rationale:** Every downstream component depends on the Electron scaffold, IPC layer, and security boundaries. Performance baseline and cross-platform CI must be established before adding any rendering weight.
**Delivers:** Running Electron app on all 3 platforms, preload bridge with typed IPC, Zod validation on all channels, lazy-loading infrastructure, dark/light theme CSS, <2s startup baseline.
**Addresses:** ARTF-01 (cross-platform launch), ARTF-09 (dark/light theme), cross-platform requirement
**Avoids:** Pitfall 1 (no perf budget — baseline established now), Pitfall 2 (leaky IPC — contextBridge enforced), Pitfall 8 (cross-platform path bugs — platform abstraction layer)
**Stack used:** Electron 42, electron-vite 5, TypeScript 5, Tailwind CSS 4, Zod
**Research flag:** ⚠️ Needs deeper research — Cross-platform CI configuration (GitHub Actions matrix for Linux/macOS/Windows + AppImage/NSIS/DMG packaging) has platform-specific quirks that warrant a brief research spike.
**Standard patterns (skip research):** Electron scaffold, IPC handler architecture, preload bridge design — all well-documented in Electron official guides and enforced by `electron-vite` scaffolding.

### Phase 2: Core Rendering — Tab System + Primary Viewers
**Rationale:** The artifact tab system and viewer registry are prerequisites for all agent communication flows. Must build these before connecting WS or MCP so there's something to render.
**Delivers:** Zustand stores (artifact, connection, UI), ArtifactTabs with close/reorder/LRU eviction, ViewerRegistry (strategy pattern), CodeViewer (shiki), MarkdownViewer (Obsidianite theme), ImageViewer, TextViewer, preview/code split pane, loading skeletons, error boundaries per viewer.
**Addresses:** ARTF-03 (multi-tab), ARTF-04 (preview-first + code toggle), ARTF-06 (code highlighting), ARTF-07 (markdown rendering), ARTF-08 (image rendering), side-by-side split pane, Obsidianite theme
**Avoids:** Pitfall 6 (syntax highlighting freeze — test with 5000-line files, implement plaintext fallback)
**Stack used:** React 19, react-shiki, react-markdown + remark-gfm, Tailwind CSS 4, Zustand + immer, @radix-ui/react-tabs, @radix-ui/react-scroll-area
**Standard patterns (skip research):** React component architecture, Zustand stores, tab UI — all standard patterns.

### Phase 3: Agent Communication — WebSocket + MCP Server
**Rationale:** The WebSocket protocol is the core control surface; MCP is the differentiator. Both depend on IPC foundation (Phase 1) and benefit from having a working tab system (Phase 2) to verify end-to-end artifact flow.
**Delivers:** WebSocket utility process with dual-mode (server + client), WS protocol (typed messages, session resume, heartbeat, reconnection), MCP utility process with ≤15 task-oriented tools (open_artifact, update_artifact, close_artifact, toggle_view, list_tabs, get_state), ConnectionPanel UI (mode selector, status, port config), auto-discovery, `--no-mcp` flag.
**Addresses:** ARTF-02 (WS API), ARTF-11 (MCP server disable-able), ARTF-12 (agent controls canvas via WS), ARTF-13 (self-contained mode), ARTF-14 (agent-connected mode), ARTF-15 (agent-to-canvas protocol docs)
**Avoids:** Pitfall 3 (MCP tool count — cap at 15, design around agent tasks), Pitfall 4 (input validation — Zod on every tool argument, path sanitization), Pitfall 7 (WS reconnection — session resume protocol, exponential backoff)
**Stack used:** ws 8, @modelcontextprotocol/sdk 1.29, Zod, Electron MessageChannelMain/utilityProcess
**Research flag:** ⚠️ Needs deeper research — (a) MCP tool design requires testing with real agents (Claude Code, Codex) to validate tool count and descriptions; (b) WS session resume protocol design needs a brief spike to define message format; (c) MCP auto-discovery format (mcp.json schema) should reference latest MCP documentation.

### Phase 4: Advanced Artifacts — HTML Sandbox + PDF + SVG + Mermaid
**Rationale:** These viewers are additive to the viewer registry (Phase 2). They require careful attention to security (HTML sandbox) and memory management (PDF.js) — both best addressed after the foundation is solid.
**Delivers:** Sandboxed HTML preview (iframe + srcdoc + sandbox + CSP), PDF viewer (viewport-aware rendering, canvas caching, 50+ page warning), SVG interactive preview (inline with sandbox), Mermaid diagram rendering (lazy-loaded Mermaid.js).
**Addresses:** ARTF-05 (HTML preview), ARTF-10 (PDF rendering), SVG preview, Mermaid diagrams
**Avoids:** Pitfall 5 (PDF.js memory — virtualized rendering, page unload on tab switch, canvas pool recycling), Pitfall 1 (perf — lazy-load all these viewers, not in main bundle)
**Stack used:** react-pdf 10, Mermaid.js, iframe sandbox + CSP
**Research flag:** ⚠️ Needs deeper research — (a) CSP configuration for HTML sandbox in Electron (Chromium vs web behavior differs on some CSP directives); (b) PDF.js + react-pdf capabilities and limitations in Electron context (worker configuration, large file handling).

### Phase 5: File Browser + Workspace Integration
**Rationale:** File browser requires the IPC foundation (Phase 1) and benefits from the tab system (Phase 2 — clicking a file opens it as a tab). MCP file system tools depend on the MCP server (Phase 3) and the file system service (this phase).
**Delivers:** File system IPC handlers (read-dir, read-file, write-file, stat), FileTree component (virtualized, lazy-load directories, filter system dirs, hide dotfiles/node_modules/git), FileEntry with type icons (lucide-react), file click → open in artifact tab, MCP file system tools (list_directory, read_file, write_file, search_files), workspace scope management, path traversal protection.
**Addresses:** ARTF-10 (file browser), MCP file system tools
**Avoids:** Pitfall 8 (cross-platform paths — path normalization layer established in Phase 1), file path injection (path.resolve + allowlist validation)
**Stack used:** Node.js fs module (main process), lucide-react (file type icons)
**Research flag:** ⚠️ Needs deeper research — Cross-platform file system behavior for large workspaces (millions of files — lazy-loading strategies, watcher performance, git-ignore integration).

### Phase 6: Polish, Persistence, and Shipping
**Rationale:** These features improve UX but aren't critical for MVP validation. They depend on earlier phases being stable.
**Delivers:** Window state persistence (position/size/maximized saved to electron-store), tab state persistence across restart, export-to-file (save rendered artifact content), syntax theme customization, workspace file search, MCP auto-discovery file generation, error boundaries for all artifact types, comprehensive Playwright E2E tests, protocol documentation, packaging configuration for all platforms.
**Addresses:** Tab persistence, window restore, export, file search, syntax themes, protocol docs
**Avoids:** UX pitfalls from PITFALLS.md (blank white screen, no loading states, no tab persistence, window position not saved, no error recovery)
**Stack used:** electron-store, Playwright, electron-builder 25

### Phase 7: Plugin System — Phase 2+ Extensibility (v2 Milestone)
**Rationale:** Per PROJECT.md, the plugin/toolbox system is Phase 2. Premature before core product validation. Depends on viewer registry (Phase 2) for extension points.
**Delivers:** Slot/extension registry (sidebar, viewer, toolbar, statusbar slots), plugin manifest format, plugin loading infrastructure, example plugin.
**Addresses:** Future extensibility — not in MVP scope
**Stack used:** Zustand plugin store, dynamic import for plugin bundles

### Phase Ordering Rationale

- **IPC before anything else:** The IPC foundation and preload bridge are prerequisites for all communication between renderer, main process, and utility processes. Built first, and built securely (Pitfall 2 enforced).
- **Performance baseline before viewery:** Phase 1 establishes lazy-loading infrastructure and startup budget. Viewers (Phase 2) and advanced viewers (Phase 4) must not be loaded upfront — enforcing this from day one prevents the 400MB/8s death spiral (Pitfall 1).
- **Tabs before WebSocket:** The WebSocket service needs somewhere to render artifacts. Building the tab system (Phase 2) before WS integration (Phase 3) means Phase 3 can do end-to-end testing with a working UI immediately.
- **WebSocket and MCP are parallelizable:** Both are utility processes communicating via MessagePorts. Once the IPC foundation exists, they can be built in parallel — WS service handles the low-level protocol, MCP wraps it in task-oriented tools.
- **File browser is additive but not blocking MVP:** The MVP can ship without a file browser (agents push artifacts via WS). The file browser enhances the experience but isn't required for the core "see what the agent produced" flow.
- **Plugin system is deliberately deferred:** The viewer registry pattern (Phase 2) is designed to make future plugin integration easier, but plugins themselves require stabilized APIs and product-market fit validation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** MCP tool design — needs testing with real AI agents (Claude Code, Codex) to validate tool count, naming, and descriptions. Protocol session resume format needs a design spike.
- **Phase 4:** HTML sandbox CSP configuration in Electron — Chromium CSP behavior differs from browsers in some edge cases. PDF.js + Electron worker configuration needs verification.
- **Phase 5:** Large workspace file browsing — strategies for lazy-loading directory trees with millions of files (use `fs.readdir` with filtering or embed a dedicated FS library like `ignore-walk`).

Phases with standard patterns (skip research-phase):
- **Phase 1:** Electron scaffolding, IPC architecture, preload bridge — all well-documented in official Electron guides. `electron-vite` handles the build configuration complexity.
- **Phase 2:** React component architecture, Zustand stores, React hooks, Tailwind styling — all standard web development patterns.
- **Phase 6:** Window/tab persistence, export, packaging — `electron-store` and `electron-builder` have well-documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official npm packages, verified version compatibility, explicit "what NOT to use" analysis. All technologies are mature and well-documented. |
| Features | HIGH | Deep competitive analysis of all major products (ChatGPT, Claude, Gemini, Codex). Feature prioritization based on real user expectations. Confidence supported by clear niche gap identification. |
| Architecture | HIGH | Patterns documented with working code examples. Architecture derived from Electron official guides, security best practices, and real-world Electron app patterns. Four-process model is standard for Electron apps with background services. |
| Pitfalls | HIGH | Sources include official Electron docs, real-world case studies (VibeBlaster, GitHub Copilot, Block), CVE data (MCP Git server), and security research (Endor Labs). Recovery strategies and verification criteria provided for each pitfall. |

**Overall confidence:** HIGH — all four research areas have strong, convergent evidence from authoritative sources.

### Gaps to Address

1. **MCP tool effectiveness unvalidated with real agents** — Tool count and descriptions are based on documented anti-patterns and general AI agent research, but haven't been tested with specific agents (Claude Code, Codex) connected to the canvas. **Action:** Schedule a "MCP tool design validation" spike during Phase 3 planning where we connect the WS protocol to actual agents and observe tool selection behavior.

2. **HTML sandbox CSP in Electron context** — CSP behavior in Electron's sandboxed renderer differs from standard Chrome in some edge cases (e.g., `wasm-unsafe-eval`, blob: URL handling). **Action:** Research Electron-specific sandbox quirks during Phase 4 planning; prototype the HTML viewer with a known-vulnerable HTML file to validate CSP effectiveness.

3. **PDF.js memory limits for large documents** — Memory behavior with react-pdf in a multi-tab Electron environment isn't fully characterized. 200-page PDF + 50-page PDF + code viewer simultaneous may exceed tested limits. **Action:** Establish a memory budget for PDF artifacts during Phase 2/4 and verify with heap snapshots during implementation.

4. **Large workspace file browser performance** — The file browser needs to handle projects with hundreds of thousands of files (monorepos). Whether `fs.readdir` with lazy rendering suffices or a more sophisticated approach (e.g., embedded ripgrep or custom FS index) is needed remains unvalidated. **Action:** Defer to Phase 5 planning; start with simple `fs.readdir` + lazy tree, add complexity only if performance issues arise.

## Sources

### Primary (HIGH confidence)
- [Electron Performance Guide](https://www.electronjs.org/docs/latest/tutorial/performance) — Startup optimization, module loading costs
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security) — contextIsolation, sandbox, nodeIntegration
- [Electron IPC Guide](https://www.electronjs.org/docs/latest/tutorial/ipc) — contextBridge patterns, channel design
- [MCP Anti-Patterns: 12 Mistakes](https://chatforest.com/guides/mcp-anti-patterns/) — Comprehensive MCP server design pitfalls (ChatForest, Apr 2026)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — Official MCP SDK documentation
- [electron-vite v5.0.0](https://www.npmjs.com/package/electron-vite) — Electron build tooling docs
- [ws v8.21.0](https://www.npmjs.com/package/ws) — WebSocket library
- [react-shiki v0.9.3](https://www.npmjs.com/package/react-shiki) — Syntax highlighting
- [react-markdown v10.1.0](https://www.npmjs.com/package/react-markdown) — Markdown rendering
- [react-pdf v10.4.1](https://www.npmjs.com/package/react-pdf) — PDF viewing
- [ChatGPT Canvas documentation](https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it) — Feature descriptions
- [Claude Artifacts guide (2026)](https://dev.to/hira_jabeen_ccaa191c13070/ultimate-claude-artifacts-guide-45k3) — Feature analysis
- [Electron Build Instructions (Linux)](https://freesoftwaredevlopment.github.io/electron/docs/development/build-instructions-linux.html) — Linux-specific dependencies
- [Desktop Application Pentesting: Electron](https://lorikeetsecurity.com/blog/desktop-app-pentesting) — Context isolation vulnerabilities

### Secondary (MEDIUM confidence)
- [VibeBlaster Performance Journey](https://www.emadibrahim.com/electron-guide/performance) — Real-world Electron optimization case study
- [Optimizing In-Browser PDF Rendering](https://joyfill.io/blog/optimizing-in-browser-pdf-rendering-viewing) — PDF.js performance bottlenecks (Nov 2025)
- [CodeMirror vs Monaco comparison](https://www.agenthicks.com/research/codemirror-vs-monaco-editor-comparison) — Bundle size, large file handling (Sep 2025)
- [Claude Artifacts vs ChatGPT Canvas (2026)](https://unmarkdown.com/blog/claude-artifacts-vs-chatgpt-canvas) — Feature comparison
- [MCP Protocol Guide (2026)](https://explore.n1n.ai/blog/mcp-tools-2026-model-context-protocol-guide-2026-05-12) — Protocol architecture, adoption
- [Codex App Workspace features (2026)](https://codex.danielvaughan.com/2026/04/17/codex-app-workspace-pr-review-task-sidebar-artifact-viewer/) — Competitor analysis
- [Canvas MCP Server (LMS)](https://github.com/vishalsachdev/canvas-mcp) — Reference MCP server implementation (80+ tools, JSON-RPC 2.0)
- [Electron Architecture Deep Dive](https://www.emadibrahim.com/electron-guide/architecture) — IPC patterns, multi-process model
- [Security-scoped bookmarks (Apple)](https://developer.apple.com/documentation/security/accessing-files-from-the-macos-app-sandbox) — macOS file access persistence
- [The Extension Host: VS Code Plugin Isolation](https://readoss.com/en/microsoft/vscode/extension-host-vscode-isolates-communicates-extensions) — Plugin architecture patterns (Apr 2026)

### Tertiary (LOW confidence) — needs validation during implementation
- MCP tool effectiveness with specific CLI agents (Claude Code, Codex, Cline) — **Action:** Test during Phase 3
- Electron-specific CSP edge cases for HTML sandbox — **Action:** Prototype during Phase 4
- PDF.js memory behavior in multi-tab Electron environment — **Action:** Heap snapshot verification during Phase 2/4
- Large workspace (>100k files) file browser performance — **Action:** Test and optimize during Phase 5

---

*Research completed: 2026-06-11*
*Ready for roadmap: yes*
