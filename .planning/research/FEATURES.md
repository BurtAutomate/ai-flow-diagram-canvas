# Feature Research

**Domain:** Electron-based Canvas / Artifact Viewer for AI CLI Agents
**Product:** AI Agent Studio
**Researched:** 2026-06-11
**Confidence:** HIGH — based on deep analysis of ChatGPT Canvas, Claude Artifacts, Gemini Canvas, and Codex App

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. These are derived from what every major AI canvas/artifact product (ChatGPT Canvas, Claude Artifacts, Gemini Canvas) already provides as baseline.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Artifact rendering (code blocks)** | The primary reason for the product: see what the agent produced. JS, TS, JSX, TSX, CSS, HTML, SVG must display with syntax highlighting. | LOW | Use a standard code highlighter (Shiki, Prism, or CodeMirror read-only). Award complexity LOW because this is a solved problem with mature libraries. |
| **Artifact rendering (Markdown)** | Agents output plans, docs, specs, and reports in Markdown. Unacceptable to show raw MD. Must render headings, lists, tables, code blocks, images. | LOW | Multiple mature MD renderers (remark, marked, showdown). Award LOW. |
| **Artifact rendering (HTML preview)** | Agents generate HTML/CSS/JS pages (landing pages, dashboards, prototypes). Must render as a live preview. Observed as the most common artifact format per Claude Code users in 2026. | MEDIUM | Requires sandboxed iframe. Security is the complexity factor — can't grant full Node/network access. See Pitfalls. |
| **Artifact rendering (Images)** | Agents reference or generate PNG, JPG, GIF, SVG. Must render inline. | LOW | Native `<img>` tag. SVG needs careful rendering (use `<object>` or sanitized inline). |
| **Preview-First default** | Show the rendered artifact immediately, not the source code. Code should be a toggle away. This is the pattern set by Claude Artifacts and ChatGPT Canvas. | LOW | Two-pane layout with preview as primary. Code view as secondary/toggle. |
| **Code view toggle** | Users need to see the source when they want. Must switch between Preview, Code, and optionally Side-by-Side. | MEDIUM | Layout management: resize, hide/reveal panels, responsive. The toggle itself is easy; smooth resize + sync scroll is MEDIUM. |
| **Multi-tab artifacts** | Agents produce multiple outputs. Users expect to switch between them without losing state. | MEDIUM | Tab bar with close, reorder, scroll. Artifact state preserved when switching. Complexity in memory management and tab lifecycle. |
| **Dark / Light theme** | Both themes are standard in developer tools. Users will file bugs if only one exists. | LOW | CSS custom properties or a theme context. Avoid hard-coded colors. |
| **Cross-platform (Linux, macOS, Windows)** | Electron apps must work on all three. Failing on one platform is a launch blocker. | MEDIUM | Electron handles most abstraction. Platform-specific issues: window chrome, file dialogs, path separators, WebSocket quirks. |
| **WebSocket API** | The control surface for agents. Must support opening artifacts, updating content toggling views, and closing. Bidirectional, persistent. | HIGH | Protocol design is the core complexity. Must define message types, error handling, reconnection, authentication. |
| **Auto-open artifacts** | When an agent sends an artifact via WebSocket, the canvas should open it automatically without user prompt. If the agent sends multiple, they stack in tabs. | MEDIUM | Requires clear protocol semantics: `{ type: "open", payload: { id, kind, content } }`. Race conditions on rapid multi-artifact sends need handling. |

### Differentiators (Competitive Advantage)

Features that set the product apart. These are areas where AI Agent Studio can beat ChatGPT Canvas, Claude Artifacts, and Codex App for its specific niche — CLI coding agents.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **MCP Server (disable-able)** | Agents control the canvas via MCP tools (open_artifact, update_artifact, toggle_view, list_files, etc.). This is the ONLY native canvas available as an MCP tool — competitors don't offer this. Claude Artifacts only recently got MCP integration for external tools (Oct 2025), but no agent can programmatically control the canvas itself. | HIGH | MCP server exposes tools using JSON-RPC 2.0 stdio or HTTP. Must be disableable for agents that don't need it. The MCP surface IS the product's competitive moat — it makes AI Agent Studio controllable from any MCP-compatible agent (Claude Code, Codex, Cursor, Cline, etc.). |
| **Dual-mode operation (Self-contained vs Agent-connected)** | Self-contained: Studio runs its own local server, agent connects to it. Agent-connected: agent runs the server, Studio connects. No competitor offers both modes. Users can use Studio standalone or integrate into existing agent workflows. | HIGH | Two different startup flows. Self-contained: Studio starts HTTP/WS server, agent connects via MCP or WS. Agent-connected: agent starts server, Studio connects as a client. Both modes must share the same rendering backend. |
| **File browser with workspace scope** | Shows current project root with optional workspace/directory filtering. Agents write files to disk; users need to browse and preview them. Claude web Artifacts has no file browser at all. Codex App has basic file browser but no MCP-controlled file selection. | MEDIUM | Directory tree view, file type icons, integrated preview (click a file to preview it in the same viewer). Must handle large projects (millions of files) — lazy-load directory contents. |
| **Side-by-side Preview + Code** | Not just toggle but simultaneous view. Resizable panels. Users developing with agents need to see both. Claude Artifacts only toggles; ChatGPT Canvas shows side-by-side for documents. | MEDIUM | Split pane with drag handle. Sync scroll between code and preview for HTML. Remember user's preferred split ratio. |
| **PDF viewer embedded** | Agents output PDF reports. Users expect inline PDF viewing. Claude Artifacts recently added PDF support. ChatGPT Canvas does not render PDF. | MEDIUM | Use pdf.js or native Electron PDF viewer. Must handle large PDFs, embedded fonts, forms. |
| **SVG preview (interactive)** | Agents produce SVG diagrams, icons, illustrations. Must render as interactive SVG (tooltips, hover effects, animations) not just static images. | LOW | Render SVG inline with proper sandbox. Support embedded CSS and basic interactivity. |
| **Mermaid diagram rendering** | Agents increasingly output Mermaid diagrams (flowcharts, sequence diagrams, Gantt charts). Claude Artifacts supports this natively; ChatGPT Canvas doesn't. | LOW | Mermaid.js library renders in-browser. Complex diagrams may be slow — consider lazy rendering or cancellation of in-flight renders. |
| **Obsidianite-inspired Markdown theme** | A distinctive, polished Markdown viewer inspired by the Obsidianite design. Not just another GitHub-flavored MD viewer. Gives the product visual identity. | LOW | CSS-only customization layered on top of the standard MD renderer. Must not break accessibility. |
| **Privacy-first: no network requests from artifacts** | HTML artifacts render in a sandbox with NO network access by default. Users can optionally enable it. ChatGPT Canvas has an enterprise toggle for this. Claude blocks all external network calls from artifacts. We match Claude's approach: locked down by default. | MEDIUM | CSP headers, iframe sandbox attributes, no `fetch`/`XMLHttpRequest`. Electron renderer must use separate session with blocked requests. Explicit opt-in flow for network access. |
| **MCP tools for file system access** | MCP server exposes `read_file`, `write_file`, `list_directory`, `search_files` tools. Makes the Studio act as a file system gateway for agents. Combined with file browser, this replaces the need for a separate file-explorer MCP server. | HIGH | File operations through MCP must respect workspace scope. Security boundary: agent can only read/write within project root. Path traversal protection is critical. |
| **Agent-to-canvas communication protocol** | A well-documented, typed WebSocket protocol that any agent can implement. Clear spec with TypeScript types, message format, error codes. Not just "it works" — documented so agents in any language can integrate. | MEDIUM | Protocol docs in the repo. TypeScript types exported as npm package. Reference client implementations for Python, JS, shell. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Based on analysis of what ChatGPT Canvas, Claude Artifacts, and similar products have struggled with or explicitly avoided.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **In-UI code editing** | Users want to fix agent output without switching to an IDE. ChatGPT Canvas does this for text/code. | Scope creep: turns a viewer into an editor. Multiplies complexity (dirty state tracking, save/unsave, undo/redo, monaco embed). Users already have editors — the artifact viewer's job is to show, not to edit. The agent edits; the user views. | Save artifact to file, open in external editor, re-send to agent. The Studio is a viewer + file browser, not an IDE. |
| **Persistent artifact storage across sessions** | Users want to reopen artifacts from yesterday's session. Claude Artifacts has 20MB project storage. | State management nightmare. Artifacts are outputs of ephemeral agent sessions. Persisting them creates expectations of a full document management system (search, organize, delete). Adds database dependency, migration concerns, UI surface area. | Artifacts map to files on disk (the agent writes files). Users browse them through the file browser. For session-cache, use a simple directory with temp artifacts that map to real file paths. |
| **Publishing artifacts to public URLs** | Users want to share rendered artifacts with colleagues. Claude has Publish button; ChatGPT does not. | Public URLs require server infrastructure, auth, rate limiting, abuse prevention. A local desktop app hosting public URLs is a security anti-pattern. If sharing is needed, export to HTML and share via existing tools (Slack, GitHub, hosted services). | Export as HTML/Markdown file → share via existing channels. The Studio itself should not become a web server for external access. |
| **Reactive/stateful artifact runtime (live React)** | Users want to run interactive React apps inside artifacts (like Claude's reactive artifacts). | Enormous security surface. Stateful apps require managing React lifecycle, npm packages, API calls, localStorage. Single-file artifacts break immediately when users need dependencies. Error states are hard to handle. Performance unpredictability. | Keep artifacts static. The agent generates HTML/CSS/JS that renders statically. If a user needs a full React app, the agent writes it to disk and the user opens it in a browser. The Studio's HTML preview handles simple interactive apps but not production-grade stateful runtimes. |
| **Collaborative editing / real-time multi-user** | Teams want to collaborate on artifacts together. | Out of scope per PROJECT.md. Multi-user sync (CRDT, OT) is a massive engineering effort that distracts from the core value prop. Even ChatGPT Canvas and Claude Artifacts don't do real-time collaboration. | File-based sharing. Write artifact to disk, commit to git, share the file. |
| **Rich text editor for Markdown** | Users want WYSIWYG editing of Markdown artifacts. | Scope creep: encoding bar, toolbar, shortcuts, image uploads. Turns the previewer into a full CMS. The agent edits; the user views. If the user needs to edit, they open the file in their editor. | Export to file → edit in native editor. The viewer is read-only by design. |
| **Plugin system for custom artifact types** | Users want to render custom file types (CSV tables, Graphviz, etc.). | Plugin architecture requires stabilization of multiple APIs (rendering hooks, lifecycle, state access, IPC). Premature before core product is validated. Can be Phase 2+ feature. | Start with standard types (HTML, MD, code, images, SVG, Mermaid, PDF). Add new renderers as built-in support based on demand, not a plugin API. |
| **Theming beyond dark/light (custom accent colors, fonts)** | Users want pixel-level control over the viewer appearance. | UX maintenance burden. Custom themes require testing each renderer. Users will file bugs when Obsidianite theme breaks their custom setup. Increases support load. | Ship two polished themes (dark + light). Add a small set of accent color options if requested. No custom CSS injection. |

## Feature Dependencies

```
Artifact rendering (any type)
    └──requires──> WebSocket API (to receive artifact content)
                       └──requires──> Basic Electron window + React app shell

Multi-tab artifacts
    └──requires──> Artifact rendering (at least one type)
    └──enhances──> WebSocket API (tabId in open/update/close messages)

Code view toggle
    └──requires──> Artifact rendering (code highlighting lib)
    └──enhances──> Multi-tab artifacts (per-tab view state)

Side-by-side view
    └──requires──> Code view toggle (split pane logic)
    └──requires──> Artifact rendering (preview pane)

MCP Server
    └──requires──> WebSocket API (MCP tools map to WS commands internally)
    └──enhances──> File browser (MCP file system tools)

File browser
    └──requires──> Basic Electron app shell (fs access via main process)
    └──enhances──> Multi-tab artifacts (open file → new artifact tab)

HTML preview sandbox
    └──requires──> Artifact rendering (HTML type)
    └──conflicts──> Network access by default (must be opt-in)

PDF viewer
    └──requires──> Artifact rendering (PDF type)
    └──requires──> pdf.js or Electron native PDF

Mermaid rendering
    └──requires──> Artifact rendering (Markdown or dedicated type)
    └──requires──> Mermaid.js library

Dual-mode operation (self-contained vs agent-connected)
    └──requires──> WebSocket API (both modes use same protocol)
    └──requires──> Startup configuration / CLI flags

MCP file system tools
    └──requires──> MCP Server
    └──requires──> File browser backend (fs operations in main process)
```

### Dependency Notes

- **Multi-tab requires artifact rendering:** You can't have tabs without at least one renderable artifact type. Build the renderers before the tab system.
- **MCP Server requires WebSocket API:** Internally, MCP tools should delegate to the same artifact management logic as the WebSocket API. Don't build two separate control systems.
- **Dual-mode requires WebSocket API:** Both modes use the same protocol, just the connection direction changes. Protocol must be transport-agnostic (works over WS in self-contained mode, over stdio or custom WS in agent-connected mode).
- **HTML sandbox conflicts with network access:** By default, the sandbox blocks all network requests. Users must explicitly opt in. This is a deliberate security choice (matching Claude's approach, different from ChatGPT Canvas's enterprise toggle).

## MVP Definition

### Launch With (v1) — Minimum Viable Product

The set of features needed to validate: "Will CLI agent users adopt a native artifact viewer?"

- **ARTF-01** — Electron app launches on Linux, Windows, and macOS
- **ARTF-02** — Agent can open an artifact via WebSocket API (auto-detect, agent command, user command)
- **ARTF-03** — Artifact renders in Preview-First view with Code-View toggle (side-by-side also available)
- **ARTF-04** — Multiple artifacts open in tabs, switchable by clicking
- **ARTF-05** — HTML artifacts render as live previews (sandboxed, no network)
- **ARTF-06** — Markdown artifacts render with Obsidianite-inspired themed viewer
- **ARTF-07** — Code artifacts (JS, TS, JSX, TSX, CSS, HTML, SVG) display with syntax highlighting and code view
- **ARTF-08** — Image artifacts (PNG, JPG, GIF) render inline
- **ARTF-09** — PDF artifacts render in an embedded viewer
- **ARTF-10** — File browser shows current project root with optional workspace scope
- **ARTF-11** — MCP server is exposed and can be disabled
- **ARTF-12** — Agent can control the canvas — open, update, toggle, resize — via high-level API over WebSocket
- **ARTF-13** — Self-contained mode (Electron runs its own local server)
- **ARTF-14** — Agent-connected mode (agent runs a server, Electron connects)

### Add After Validation (v1.x)

Features to add once core is working and user feedback confirms demand.

- **SVG interactive preview** — Low complexity. Use case: agents producing diagrams, icons, data visualizations. Trigger: user requests or 3+ issues filed.
- **Mermaid diagram rendering** — Low complexity. Use case: agents outputting flowcharts and sequence diagrams in Mermaid format. Trigger: observed usage pattern in agent outputs.
- **Artifact version history (per-tab undo/redo)** — MEDIUM complexity. Capture snapshot on each update message from agent. Trigger: users report losing work when agent re-sends artifact.
- **Syntax theme customization** — MEDIUM complexity. Allow selecting from popular themes (Monokai, Dracula, GitHub Light, etc.). Trigger: user requests for specific syntax themes.
- **Workspace-scoped file search** — MEDIUM complexity. Full-text search across project files. Trigger: file browser usage indicates users need search.
- **Export to file** — LOW complexity. Save rendered artifact content to disk. Trigger: users asking "how do I save this?"

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- **Add-on toolbox apps** — Beyond file browser (diagram tool, API tester, DB viewer). Requires plugin/host API. Phase 2+ per PROJECT.md.
- **Custom artifact type plugins** — Requires stabilized plugin API. Premature until core viewer is validated across all standard types.
- **Reactive/stateful artifact runtime** — Running live React/stateful apps. Requires significant security review and sandbox investment. Not needed for MVP.
- **Collaborative editing / multi-user** — Out of scope per PROJECT.md.
- **Network access toggle for HTML preview** — Requires CSP customization, session management, proxy configuration. Only build if users demand it.
- **Publishing artifacts to URLs** — Server infrastructure required. Probably never appropriate for a local desktop app.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Artifact rendering (code) | HIGH | LOW | P1 |
| Artifact rendering (Markdown) | HIGH | LOW | P1 |
| Artifact rendering (HTML preview) | HIGH | MEDIUM | P1 |
| Artifact rendering (Images) | HIGH | LOW | P1 |
| Preview-First default | HIGH | LOW | P1 |
| Code view toggle | HIGH | MEDIUM | P1 |
| Multi-tab artifacts | HIGH | MEDIUM | P1 |
| Dark / Light theme | MEDIUM | LOW | P1 |
| Cross-platform | HIGH | MEDIUM | P1 |
| WebSocket API | CRITICAL | HIGH | P1 |
| Auto-open artifacts | HIGH | MEDIUM | P1 |
| MCP Server (disable-able) | HIGH | HIGH | P1 |
| Dual-mode operation | HIGH | HIGH | P1 |
| File browser with workspace scope | MEDIUM | MEDIUM | P1 |
| Side-by-side Preview + Code | HIGH | MEDIUM | P1 |
| PDF viewer embedded | MEDIUM | MEDIUM | P1 |
| SVG interactive preview | MEDIUM | LOW | P2 |
| Mermaid diagram rendering | MEDIUM | LOW | P2 |
| Obsidianite-inspired Markdown theme | MEDIUM | LOW | P1 |
| Privacy-first sandbox (no network) | HIGH | MEDIUM | P1 |
| MCP file system tools | HIGH | HIGH | P2 |
| Agent-to-canvas protocol docs | MEDIUM | MEDIUM | P1 |
| Syntax theme customization | LOW | MEDIUM | P2 |
| Workspace file search | MEDIUM | MEDIUM | P2 |
| Artifact version history | LOW | MEDIUM | P2 |
| Export to file | MEDIUM | LOW | P2 |

**Priority key:**
- **P1:** Must have for launch. Product is broken without it.
- **P2:** Should have, add when possible. High value per cost.
- **P3:** Nice to have, future consideration. Low urgency.

## Competitor Feature Analysis

| Feature | ChatGPT Canvas | Claude Artifacts | Gemini Canvas | Codex App | Our Approach |
|---------|---------------|-----------------|---------------|-----------|-------------|
| **Artifact rendering** | Code, Text (Markdown) | HTML, React, SVG, Mermaid, Markdown, PDF | HTML, React, Markdown | Browser-based preview | Code, MD, HTML, SVG, Images, PDF, Mermaid |
| **Preview-First default** | Yes (document) | Yes (rendered) | Yes (rendered) | No (code-first) | Yes (preview-first) |
| **Code view toggle** | View code tab | Code/Preview tabs | Toggle button | Code only | Toggle + Side-by-side |
| **Multi-tab** | Multiple documents | Single artifact + version history | Single | Task-based panels | Full tab system |
| **Live code rendering** | No (shows code only) | Yes (React/HTML/SVG) | Yes (HTML/React) | Limited | HTML only (sandboxed) |
| **File browser** | No | No | No | Basic | Full tree with preview |
| **MCP integration** | No | External MCP tools (Oct 2025) | No | MCP support | Built-in MCP server first-class |
| **WebSocket control** | No (HTTP API via GPT Actions) | No | No | No | Core protocol — bidirectional |
| **Version history** | Yes (back button) | Yes (version selector) | No | No | Planned (v1.x) |
| **Publish/Share** | No | Yes (public URL) | Yes (export) | No (writes files to disk) | Export to file only |
| **Persistent storage** | Session-only | 20MB per project | Session-only | Filesystem | Filesystem (artifacts → files) |
| **Sandbox security** | Enterprise toggle | No network | Limited | OS sandbox | No network by default |
| **Cross-platform** | Web, Windows, Mac (mobile soon) | Web, mobile | Web | Win, Mac, Linux | Win, Mac, Linux (Electron) |
| **Theming** | Light/Dark | Light/Dark | Light/Dark | System | Dark/Light + Obsidianite MD theme |
| **Dual-mode** | N/A | N/A | N/A | N/A | Self-contained + Agent-connected |
| **PDF rendering** | No | Yes (recent) | No | No | Yes (embedded viewer) |
| **Mermaid diagrams** | No | Yes | No | No | Yes |

### Key Takeaways from Competitor Analysis

1. **No existing product targets CLI agents specifically.** ChatGPT Canvas, Claude Artifacts, and Gemini Canvas are embedded in chat UIs. Codex App is close but focuses on the task management, not artifact viewing as a primary workflow. This is our niche.

2. **MCP is our strongest differentiator.** No competitor offers a native MCP server for canvas control. This gives agents direct programmatic control — the closest alignment to the "agent controls the canvas" vision.

3. **Dual-mode operation is unique.** Every competitor is server-dependent (cloud). Self-contained mode means zero external dependencies — the app starts, runs its own server, agents connect locally. Agent-connected mode fits agents that already run a server.

4. **Preview-first with side-by-side is the right default.** Claude Artifacts proves users want to see rendered output immediately. ChatGPT Canvas proves users want side-by-side editing. Combining preview-first default with option to side-by-side hits both expectations.

5. **Privacy-first sandbox matches the market leader.** Claude Artifacts blocks all network calls from artifacts. We should match this by default. Security-conscious users (enterprises, security researchers) will choose us over ChatGPT Canvas which requires admin toggles.

6. **We skip what doesn't fit our niche.** No public publishing (not a web service). No reactive/stateful artifact runtime (too complex, not needed for CLI agent outputs). No collaborative editing (desktop app, not a web platform).

## Sources

- [ChatGPT Canvas official documentation](https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it) — Feature descriptions, code execution, network access toggles
- [Claude Artifacts guide (2026)](https://dev.to/hira_jabeen_ccaa191c13070/ultimate-claude-artifacts-guide-45k3) — Six renderable types, limitations, single-file constraint
- [Claude Artifacts vs ChatGPT Canvas comparison (2026)](https://unmarkdown.com/blog/claude-artifacts-vs-chatgpt-canvas) — Feature-by-feature breakdown
- [Claude Artifacts limitations (2026)](https://aitoolscapital.com/blog/how-to-use-claude-artifacts-2026) — No external network, no persistent storage, single-file only, no backend
- [ChatGPT Canvas vs Claude Artifacts (2026)](https://aimemory.pro/blog/chatgpt-canvas-vs-claude-artifacts) — Inline editing, version history, live preview comparison
- [Claude Generative UI vs Canvas vs Artifacts](https://www.mindstudio.ai/blog/what-is-claude-generative-ui-vs-canvas-artifacts) — Interaction model differences: Canvas is editing environment, Artifacts is execution environment
- [Codex App Workspace features](https://codex.danielvaughan.com/2026/04/17/codex-app-workspace-pr-review-task-sidebar-artifact-viewer/) — PR review pane, task sidebar, artifact viewer for PDFs/spreadsheets
- [Claude Code: HTML as agent artifact](https://x.com/minchoi/status/2055018928942830054) — Trend of agents switching from Markdown to HTML artifacts
- [Codex CLI npm package](https://www.npmjs.com/package/%40openai/codex) — Desktop app, MCP support, cross-platform
- [MCP Protocol Guide (2026)](https://explore.n1n.ai/blog/mcp-tools-2026-model-context-protocol-guide-2026-05-12) — MCP architecture, 97M monthly SDK downloads, universal adoption
- [MCP Developer Guide (2026)](https://lushbinary.com/blog/mcp-model-context-protocol-developer-guide-2026/) — stdio vs HTTP transport, three primitives (tools, resources, prompts)
- [Electron Security Best Practices](https://www.emadibrahim.com/electron-guide/security) — contextIsolation, sandbox, nodeIntegration, IPC patterns
- [OpenAI WebSocket API](https://apidog.com/blog/openai-websocket-api/) — WebSocket mode for agentic workflows, 40% faster end-to-end execution
- [Outbound-only WebSocket bridge for local agents](https://dev.to/ctrlnodeai/building-an-outbound-only-websocket-bridge-for-local-ai-agents-2o6g) — Security-first agent communication patterns
- [Canvas MCP Server (LMS)](https://github.com/vishalsachdev/canvas-mcp) — Real-world MCP server design: 80+ tools, JSON-RPC 2.0, stdio + HTTP transports — reference architecture for our MCP server
- PROJECT.md — ARTF-01 through ARTF-14 requirements, constraints, scope boundaries

---
*Feature research for: AI Agent Studio (Electron Canvas / Artifact Viewer for AI CLI Agents)*
*Researched: 2026-06-11*
