# Pitfalls Research

**Domain:** Electron-based Canvas/Artifact Viewer for AI CLI Agents (MCP + WebSocket)
**Researched:** 2026-06-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Treating the Renderer Like a Normal Web App (No Performance Budget)

**What goes wrong:**
The app starts up slowly (8+ seconds), feels janky when switching tabs, and consumes 400MB+ RAM for what should be a lightweight artifact viewer. Multiple artifact types (PDF, markdown, syntax-highlighted code, live HTML previews) each pull in their own heavy dependencies, all loaded upfront.

**Why it happens:**
Electron bundles a full Chromium engine — baseline ~150MB before any app code. Developers coming from web development don't realize that server-oriented npm modules (e.g., `request`, huge JSON configs) that are fast on a server are catastrophically slow when loaded at Electron startup. Load everything at once because "it works on local dev machine," ship to production where users have 8GB RAM machines.

**How to avoid:**
- Enforce a startup time budget: < 2 seconds to first meaningful paint. Measure with `--cpu-prof` and `--heap-prof` on every PR.
- Lazy-load artifact renderers: don't import PDF.js, Monaco editor, markdown parser at startup. Load them when the user opens that artifact type.
- Use `BrowserWindow` with `show: false`, then `win.show()` only after `ready-to-show` fires.
- Defer non-critical init (analytics, update checks, MCP server startup) with `setImmediate()` or `setTimeout()`.
- Profile module `require()` cost — replace heavy Node.js server modules with lighter alternatives (e.g., `node-fetch` over `request`).

**Warning signs:**
- `app.on('ready')` handler takes > 500ms to complete
- DevTools Performance shows a long "Evaluate Script" block on startup
- `process.memoryUsage().rss` exceeds 250MB at idle with no artifacts open

**Phase to address:**
Phase 1 (Scaffold + Core Shell) — establish performance baseline and lazy-loading architecture before adding any renderers.

---

### Pitfall 2: Leaky IPC — Treating contextBridge as Optional

**What goes wrong:**
The renderer gets direct Node.js access via `nodeIntegration: true` or bypasses `contextBridge`. A prompt injection in a live HTML preview artifact or a malicious agent command can call `require('child_process').exec('rm -rf /')`. Even without malice, memory leaks occur when IPC listeners aren't cleaned up on component unmount, causing "max listener" warnings and stale references that prevent garbage collection.

**Why it happens:**
It's faster to prototype with `nodeIntegration: true` — you can call `fs` directly from React. Developers defer the "proper" IPC + preload refactor and it never gets done. The `contextBridge` pattern feels bureaucratic: define a channel in main, add handler, expose in preload, call from renderer. When things are moving fast, it gets skipped.

**How to avoid:**
- Never set `nodeIntegration: true` or `contextIsolation: false`. This is non-negotiable — enforce as a CI lint rule.
- Define a typed IPC API surface in a shared file (e.g., `shared/ipc-channels.ts`). Every IPC call is a function, not a magic string.
- Use `contextBridge.exposeInMainWorld('api', { ... })` to expose only exactly what the renderer needs — no `ipcRenderer.send` passthrough.
- Clean up IPC listeners in `useEffect` return: `ipcRenderer.removeAllListeners('channel')`. Run `process.listenerCount('channel')` in dev mode to catch leaks.
- For the live HTML preview sandbox, render it in an `<iframe>` with `srcdoc` and `sandbox` attribute — no IPC access at all.

**Warning signs:**
- `(node) MaxListenersExceededWarning: Possible EventEmitter memory leak detected` in console
- Heap snapshots show detached DOM nodes with IPC callback references
- `process.memoryUsage().rss` grows monotonically across artifact tab switches

**Phase to address:**
Phase 1 (Scaffold + Core Shell) — IPC architecture must be correct from day one. Retroactively fixing IPC security boundaries costs weeks of refactoring (proven pattern: VibeBlaster took 2 weeks).

---

### Pitfall 3: MCP Server Anti-Patterns — Wrapping Every API as a Tool

**What goes wrong:**
The MCP server exposes 30+ fine-grained tools like `open_artifact`, `get_artifact_status`, `list_tabs`, `switch_tab`, `resize_window`, `set_theme`, `get_theme`, `toggle_code_view` — forcing the AI agent to chain 4+ calls just to do something simple. Tool selection accuracy drops logarithmically with tool count. The agent wastes context window on tool descriptions instead of actual work.

**Why it happens:**
Developers mirror their internal API structure 1:1 as MCP tools. It feels "clean" to have every operation as a distinct tool. They don't realize that AI agents are not API consumers — they're probabilistic reasoners that get confused by too many options. GitHub Copilot cut from 40 to 13 tools and saw measurable improvement. Block rebuilt its Linear MCP server three times, going from 30+ tools to 2.

**How to avoid:**
- Design MCP tools around agent tasks, not internal API endpoints. A single `display_artifact(file_path)` that handles open/switch/code-toggle is better than 6 separate tools.
- Keep total tool count under 15. If you have more, consolidate or question whether every tool needs to exist.
- Write tool descriptions in user/agent language: "Display an artifact file — accepts path, optionally toggles code view" beats "Artifact management endpoint."
- Include what the tool returns in the description, not just what it does.
- Test with real agents: if the agent consistently chooses the wrong tool or chains too many, your tool boundaries are wrong.

**Warning signs:**
- MCP tool list exceeds 15 entries
- Agent takes 3+ tool calls to perform a single user request
- Tool descriptions contain technical jargon instead of task-oriented language
- Two or more tools have nearly identical descriptions and confuse the agent

**Phase to address:**
Phase 3 (WebSocket API + MCP Server) — design toolsets before implementing them.

---

### Pitfall 4: No Input Validation on MCP Tools (Shell Injection)

**What goes wrong:**
The MCP server constructs shell commands or filesystem paths by concatenating user/agent-supplied strings. An attacker (or confused agent) passes `; rm -rf /` as a filename, or `../../etc/passwd` as a path. Even the official Anthropic Git MCP server had three CVEs from unsanitized input (CVE-2025-68143, CVE-2025-68144, CVE-2025-68145). 82% of MCP implementations use filesystem operations vulnerable to path traversal (Endor Labs, 2026).

**Why it happens:**
MCP servers feel like "internal tools" — developers assume the calling agent is trusted. But agents get prompt-injected, users pass unexpected input, and "just for testing" configurations ship to production. Shell command construction with string concatenation is the most common cause.

**How to avoid:**
- Never construct shell commands from tool arguments using template strings or concatenation. Use parameterized subprocess calls: `subprocess.run(["git", "log", "--oneline", branch])`, not `subprocess.run(f"git log --oneline {branch}", shell=True)`.
- Sanitize all filesystem paths: resolve to absolute, ensure they're within allowed directories, reject path traversal patterns (`..`, symlink escapes).
- Validate every tool argument against expected types and ranges — treat all input as untrusted.
- Restrict filesystem access to specific directories via allowlist. Deny access to `.env`, `.ssh`, `.git/config` by default.
- Run MCP server under a dedicated OS user with minimal permissions.

**Warning signs:**
- MCP server uses `shell: true` or string-based shell commands anywhere
- Filesystem operations use string concatenation for paths
- No path normalization before filesystem access
- MCP server runs as root or with user-level OS permissions

**Phase to address:**
Phase 3 (WebSocket API + MCP Server) — security architecture must be part of the implementation, not bolted on later.

---

### Pitfall 5: PDF.js Memory Detonation on Large Documents

**What goes wrong:**
A 100-page PDF document consumes 500MB+ of renderer memory. The UI freezes during page rendering. Tab switching becomes sluggish or crashes entirely. The user opens a second PDF and the app goes OOM.

**Why it happens:**
PDF.js renders PDF pages to canvas elements in memory. By default, it renders all pages upfront and keeps them in the DOM. Developers don't implement virtual scrolling, page unloading, or canvas reuse. Electron's Chromium has no special PDF optimization — it treats PDF.js like any other heavy web page. The `pdfjs-dist` library's default viewer is designed for browser tabs (single document at a time), not for a multi-tab artifact viewer.

**How to avoid:**
- Implement viewport-aware rendering: only render pages visible in the scroll view. Unload off-screen pages and their canvas resources.
- Use a virtual scroller (e.g., `react-window`) for multi-page PDFs — recycle canvas elements as the user scrolls.
- Limit concurrent PDF documents: unload PDF when its tab is not active. Store only page count and metadata, not rendered pages.
- Set a PDF page count warning at 50+ pages before loading.
- Consider using `requestAnimationFrame` or `IdleCallback` for page rendering to avoid blocking the UI thread.
- For very large PDFs (>200 pages), show a "this PDF is large, render on demand?" prompt.

**Warning signs:**
- Opening a PDF causes 200MB+ heap spike
- PDF tab switch shows blank white for >2 seconds
- `chrome://inspect` shows hundreds of canvas elements from off-screen PDF pages
- Renderer process crashes with "Out of Memory" on moderate PDFs

**Phase to address:**
Phase 2 (Artifact Rendering — core renderers) — PDF renderer must include memory management from day one.

---

### Pitfall 6: Syntax Highlighting Freezes on Large Code Files

**What goes wrong:**
Opening a 5000-line code file causes a 3-second freeze. The editor highlights only the first 200 lines, leaving the rest unstyled. Switching to a large minified JS file (single 50KB line) crashes the tokenizer entirely.

**Why it happens:**
CodeMirror 6 uses a lazy tokenizer that gives up after a few hundred lines by default. Monaco Editor handles large files better but has a 5-10MB bundle size cost. Both editors render every line in the viewport — but the tokenizer/parser must run on the entire visible document. TypeScript/TSX files are especially expensive because the parser must disambiguate JSX tags from generic type parameters.

**How to avoid:**
- Use Monaco Editor for the code view (better large-file performance out of the box) with viewport-aware rendering (it handles this internally).
- If using CodeMirror 6, configure the tokenizer for accuracy-over-performance in readonly mode (this is a code viewer, not an editor).
- For minified/single-line files, format them first with prettier before loading into the editor.
- Set a file size warning at 1MB+ before loading into syntax highlighter. Offer plaintext fallback.
- Virtualize the line rendering: Monaco does this by default; CodeMirror 6 needs `drawSelection` and proper viewport configuration.
- Never block the main process — syntax highlighting operates entirely in the renderer. Use Web Workers if you need parallel processing.

**Warning signs:**
- Opening a large code file causes >1s renderer freeze
- Syntax highlighting stops at line ~200 (CodeMirror lazy tokenizer limit)
- DevTools shows long "Recalculate Style" or "Parse HTML" frames
- Bundle analysis shows Monaco at 5MB+ or CodeMirror at 300KB+ (acceptable for a viewer)

**Phase to address:**
Phase 2 (Artifact Rendering — code view) — choose Monaco over CodeMirror for this use case (viewer-first, large files). Test with real-world AI-generated code files before shipping.

---

### Pitfall 7: WebSocket Reconnection Chaos

**What goes wrong:**
The agent disconnects briefly (network glitch, process restart). The WebSocket client reconnects but doesn't restore state — tabs are lost, open artifacts disappear, the "session" is broken. Both self-hosted mode (Electron runs server) and agent-connected mode (agent runs server) have different reconnect failure modes. In self-hosted mode, the agent might reconnect to a different port. In agent mode, the Electron client reconnects but sends garbage as "resume state."

**Why it happens:**
WebSocket reconnection logic is treated as an afterthought. The implementation handles the "happy path" — connect, send messages, disconnect — but not the "unhappy path" — reconnect with state recovery, duplicate message handling, re-subscription. Developers assume connections are reliable on localhost, but agent restarts, port conflicts, and sleep/resume cycles cause disconnections.

**How to avoid:**
- Design a session protocol with an explicit `resume` capability: on reconnect, send a session ID, and the server returns the current state (open tabs, artifact contents).
- Implement exponential backoff reconnection with jitter: 1s, 2s, 4s, 8s, 16s, max 30s.
- Use a heartbeat/ping-pong every 15s to detect silent disconnections (TCP connections can drop without notification on some networks).
- In self-hosted mode, the Electron main process should track the server port and expose it for reconnection.
- In agent mode, the Electron client should broadcast its reconnect attempt via a configurable callback channel so the agent knows the viewer is ready again.
- Never auto-reconnect more than 5 times without user notification — show a UI state "Connection lost — reconnecting..."

**Warning signs:**
- WebSocket `onclose` fires and the app doesn't recover
- After reconnect, open artifact tabs are empty or missing
- Agent sends commands that are silently dropped because the server hasn't finished re-initializing
- Duplicate events trigger double-renders after reconnect

**Phase to address:**
Phase 3 (WebSocket API + MCP Server) — session recovery and reconnection protocol must be spec'd before WebSocket implementation.

---

### Pitfall 8: Cross-Platform File Path Chaos (Linux Especially)

**What goes wrong:**
The app works perfectly on macOS during development, but on Linux: file paths with spaces break, `~` is not expanded, symlinks fail, AppImage can't read/write to certain directories, the file browser shows `/proc` and `/sys`, and permissions errors on every `fs.writeFile` because the snap/flatpak/appimage sandbox is different. On Windows, forward slashes vs backslashes cause path comparison failures.

**Why it happens:**
Electron apps inherit Node.js `path` module behavior, but platform-specific quirks are easily missed:
- Linux: `xdg-portal` file chooser doesn't support `defaultPath` before portal v4. AppImage sandbox restricts filesystem access. Snap packages have strict confinement.
- macOS: App Sandbox requires security-scoped bookmarks for persistent access to user-chosen directories. Without bookmarks, access is lost on app restart.
- Windows: `C:\Users` vs `C:/Users`, case-insensitive paths, long path issues (>260 chars).
- All platforms: symlink handling differs — some apps accidentally follow symlinks outside the allowed directory.

**How to avoid:**
- Normalize all paths with `path.resolve()` immediately on input. Store absolute paths internally.
- Use `app.getPath('userData')` and `app.getPath('home')` instead of hardcoding paths.
- Test on all three platforms in CI — use GitHub Actions with Linux, Windows, macOS runners.
- For Linux: build as AppImage (most portable) and test with `--no-sandbox` for environments without user namespaces.
- For macOS MAS distribution: implement security-scoped bookmarks from day one (hard to retrofit).
- Never assume `~` expands — always use `path.resolve()` or `app.getPath('home')`.
- Implement a path sandbox: the file browser should not show system directories (`/proc`, `/sys`, `/dev`, `/etc`, `/boot`).

**Warning signs:**
- File paths constructed with string concatenation instead of `path.join()`
- File browser shows system/proc directories
- CI pipeline doesn't test on all 3 platforms
- Using `paths.relative()` without `path.resolve()` first
- Any code that compares paths with `===` instead of `path.relative()` or `fs.realpathSync()`

**Phase to address:**
Phase 1 (Scaffold + Core Shell) — file system abstraction layer must be platform-aware from the start. Cross-platform CI in Phase 0/1.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `nodeIntegration: true` | Faster prototyping, direct fs access | Security vulnerability — one XSS = full RCE. Rewrite costs 2+ weeks. | Never. Use contextBridge properly. |
| Store artifact state in global variables | Quick to implement, no React state management | Memory leaks, stale state on HMR, can't serialize for session recovery | Only for throwaway prototypes. Not for any code merged to main. |
| Single heavy WebSocket connection for everything | Simple to set up | Head-of-line blocking: one large artifact transfer delays all other messages | Phase 1 MVP only. Refactor to multiplexed or multiple connections by Phase 3. |
| Hardcoded paths ("~/projects/") | Works on developer's machine | Breaks on any other machine. Breaks on Linux. | Never — always use dialogs or config files. |
| Ship all artifact renderers in main bundle | Simple import structure | 10MB+ startup bundle. Slow first paint. | Only for Phase 1 MVP with 2-3 artifact types. Lazy-load by Phase 2. |
| Use `console.log` for MCP server debugging | Fastest way to debug | stdout IS the MCP transport — `console.log` corrupts JSON-RPC messages. | Never. Use `console.error` or a log file. |
| MCP tool = API endpoint mapping | Minimal design effort | Agent confusion from too many tools. Context window waste. | Never for production. Acceptable only during initial API exploration. |
| Skip macOS sandbox bookmarks | Works without Apple Developer Program membership | Users must re-authorize file access on every restart. App rejected from Mac App Store. | Never if MAS distribution is planned. Acceptable only for direct-download builds. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **MCP Server ↔ Agent** | Exposing every internal function as a tool, leading to 30+ tools with vague descriptions | Design 5-10 task-oriented tools with explicit, agent-readable descriptions. Test with real agents. |
| **WebSocket ↔ Agent (agent runs server)** | Assuming the agent's server URL stays constant across restarts | Implement a discovery mechanism: advertise the WebSocket URL via a well-known file, env var, or CLI flag. |
| **WebSocket ↔ Electron (self-hosted)** | Picking a hardcoded port that conflicts with other apps | Use port 0 (OS assigns) and communicate the assigned port back to the agent via stdout or a file. |
| **File Browser ↔ OS filesystem** | Listing all files starting from `/` or `C:\` | Start from a configurable project root. Filter system directories, hidden files, and binary blobs. |
| **HTML Preview ↔ Renderer** | Rendering live HTML artifacts in the same process as the app UI | Use sandboxed `<iframe>` with `srcdoc` + `sandbox` attribute. No nodeIntegration in that iframe. |
| **Code View ↔ Syntax Highlighter** | Loading the full Monaco bundle even for non-code artifacts | Only load the syntax highlighter component when the user opens a code artifact. Lazy-load Monaco's language services. |
| **PDF Viewer ↔ PDF.js** | Re-rendering all PDF pages whenever the tab switches | Cache rendered canvases per page. Only re-render if the PDF content changed. |
| **Auto-updater ↔ Platform** | Using the same updater config for macOS, Windows, Linux | macOS needs code signing + notarization. Linux needs repo-based updates (AppImageUpdate). Windows needs Squirrel or MSI. Each has different setup. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Load all renderers at startup** | 8+ second startup time, 400MB idle RAM | Lazy-load artifact renderers. Show loading states for each artifact type. | Immediately — even the first demo feels slow. |
| **Keep PDF canvases in memory** | 500MB+ RAM with 3 PDF tabs open | Virtualize PDF page rendering. Unload canvases for off-screen pages and inactive tabs. | At ~50 pages per document or 2+ open PDF tabs. |
| **No virtual scrolling in file browser** | File browser renders 10k+ DOM nodes | Virtualize the file list. Only render visible rows. | At ~1000 files in a directory. |
| **Monaco loaded for every code view** | 5-10MB bundle always in memory, even for non-code artifacts | Lazy-load Monaco only when a code-type artifact is opened. Use plain `<pre>` for non-code text. | Always — Monaco is always heavy. Acceptable only for code artifacts. |
| **Blocking main process with IPC** | UI freezes when saving files or reading directories | Use async IPC (`ipcMain.handle` / `ipcRenderer.invoke`). Never use synchronous `ipcRenderer.sendSync`. | On any filesystem operation > 100ms. |
| **No debounce on file system watchers** | File browser refreshes 50 times when a directory changes | Debounce file watcher events (50-100ms). Batch updates into a single render. | When watching a directory with active file writes (e.g., git operations, builds). |
| **Single WebSocket connection for all artifact data** | Large artifact transfer blocks control messages | Use separate channels or connections for data transfer vs control commands. Stream large artifacts in chunks. | When artifacts exceed ~1MB. |
| **No page unload for PDF.js** | Memory grows unbounded as user scrolls through PDF | Implement viewport-aware rendering: render 2-3 pages ahead/behind, unload the rest. | At ~20+ pages viewed in a session. |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Live HTML artifact renders without sandbox** | XSS → RCE: malicious HTML artifact can run `require('child_process')` | Always render HTML artifacts in `<iframe sandbox>` with `srcdoc`. No Node.js access. |
| **MCP server accepts paths without normalization** | Path traversal: agent reads `../../../etc/passwd` | Resolve all paths with `path.resolve()` and validate they're within allowed directory tree. |
| **WebSocket API has no authentication** | Any process on localhost can control the canvas | Use a connection token (generated at startup, passed via CLI args or env) for WebSocket auth. |
| **Disabling `contextIsolation` for "convenience"** | Full renderer compromise via any XSS | Enforce `contextIsolation: true` via CI lint. Never disable. |
| **Shipping with DevTools accessible** | Users can inspect internals, modify behavior | Check `app.isPackaged` before registering DevTools shortcuts. Strip debug features in production. |
| **MCP server runs with user-level permissions** | Prompt injection → full filesystem access | Run MCP server in a restricted process. Containerize if possible. Restrict filesystem access to specific directories. |
| **No CSP on HTML preview iframe** | Script injection via CSS/JS in markdown or HTML artifacts | Set `Content-Security-Policy` on the iframe that blocks inline scripts and restricts connections to `none`. |
| **File browser exposes system files** | User accidentally opens/deletes system files | Filter out `/proc`, `/sys`, `/dev`, `/etc`, `/boot`, and hidden dotfiles by default. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No loading state for artifacts** | User clicks an artifact, nothing happens for 2-3 seconds, thinks app is broken | Show a skeleton loader or progress indicator immediately. "Rendering 3/12 pages..." |
| **Blank white screen on startup** | User thinks the app failed to launch | Show a splash screen or "initializing" state while renderers load. VS Code does this well. |
| **File browser shows thousands of irrelevant files** | User can't find their project files | Start from a project root. Show common source files by default. Filter `node_modules`, `.git`, `dist/`. Offer a ".source-files-only" toggle. |
| **App doesn't remember window position/size** | User resizes the window, closes app, reopens — back to default size | Save `BrowserWindow` bounds to `app.getPath('userData')` and restore on next launch. |
| **No tab persistence across restart** | User had 5 artifacts open, closes app, reopens — empty canvas | Persist tab state to disk (artifact paths + view modes). Restore on next launch. |
| **MCP server not disable-able** | Agent that doesn't use MCP gets log spam and errors | Make MCP server opt-in via `--enable-mcp` flag. Default to off. |
| **Agent-connected mode requires manual URL entry** | User has to find and paste a WebSocket URL | Auto-discover via well-known port or IPC socket path. Fall back to manual entry with a "connect" button. |
| **PDF viewer has no zoom controls** | User can't read small text in dense PDFs | Always show zoom in/out and fit-to-width controls. Remember zoom level per document session. |
| **No error recovery — stuck on "loading" forever** | User opens a corrupted artifact, sees endless spinner | Set a loading timeout (10s). Show "Failed to render — [error message]" with "Open as text" fallback. |

## "Looks Done But Isn't" Checklist

- [ ] **HTML Artifact Preview:** Often missing sandbox restrictions — verify `<iframe>` has `sandbox` attribute and no Node.js access
- [ ] **File Browser:** Often shows system directories — verify it starts from project root and filters `/proc`, `/sys`, `.git`, `node_modules`
- [ ] **Tab Persistence:** Often missing — verify tab state survives app restart
- [ ] **Window State:** Often not saved — verify window position/size restores on relaunch
- [ ] **MCP Server Disable:** Often not implemented — verify `--no-mcp` flag completely disables the MCP server
- [ ] **WebSocket Auth:** Often missing — verify connection token is required even on localhost
- [ ] **PDF Memory Cleanup:** Often not tested — verify closing a PDF tab frees its canvas memory (check heap snapshot)
- [ ] **IPC Listener Cleanup:** Often forgotten — verify no IPC listeners leak across hot reload or tab switches
- [ ] **Cross-Platform CI:** Often only runs on macOS — verify Linux AppImage and Windows MSI builds in CI
- [ ] **Error Boundaries:** Often missing per-artifact-type — verify a broken PDF doesn't crash the code view or the whole app
- [ ] **Large File Handling:** Often not tested with >5MB files — verify behavior with a 10MB minified JS file and a 200-page PDF
- [ ] **Offline State:** Often assumed always connected — verify the app shows a meaningful "disconnected" state when WebSocket drops

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Memory leak from unclosed IPC listeners | LOW | Add `removeAllListeners()` in cleanup. Take heap snapshot before/after to confirm fix. |
| MCP server with too many tools | MEDIUM | Consolidate tools behind task-oriented facades. Deprecate old tools with description pointing to new ones. |
| PDF.js OOM on large documents | MEDIUM | Add viewport-aware rendering. Implement page unload. Set max concurrent pages. |
| macOS sandbox file access lost on restart | LOW | Add security-scoped bookmark persistence. Store bookmarks in user preferences. |
| WebSocket reconnection loses state | HIGH | Implement session resume protocol. Store tab state in main process memory. |
| Cross-platform path bugs in production | HIGH | Add path normalization layer. Fix and release hotfix. Add CI test for the specific path pattern. |
| Accidental console.log breaks MCP transport | LOW | Redirect all debug output to stderr. Use `electron-log` or similar for structured logging. |
| Syntax highlighting fails on large file | LOW | Fall back to plaintext view with "file too large for syntax highlighting" message. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Renderer not lazy-loaded (Pitfall 1) | Phase 1 (Scaffold + Core Shell) | Lighthouse/DevTools showing < 2s startup, < 200MB idle RAM |
| contextBridge bypassed (Pitfall 2) | Phase 1 (Scaffold + Core Shell) | Code review: no `nodeIntegration: true`, all IPC through `contextBridge` |
| MCP tool count explosion (Pitfall 3) | Phase 3 (WebSocket API + MCP Server) | Tool list ≤ 15 items; agent tests show < 2 calls per command |
| MCP input validation missing (Pitfall 4) | Phase 3 (WebSocket API + MCP Server) | Pen test: path traversal, shell injection, argument validation |
| PDF.js memory detonation (Pitfall 5) | Phase 2 (Artifact Rendering — core) | Heap snapshot stable across 10 PDF tab switches; 200-page PDF loads within 300MB |
| Syntax highlighting freeze (Pitfall 6) | Phase 2 (Artifact Rendering — code) | 5000-line code file renders in < 500ms; minified 50KB single-line file highlights |
| WebSocket reconnection chaos (Pitfall 7) | Phase 3 (WebSocket API + MCP Server) | Kill/recover test: open artifact, kill server, restart — all tabs restored |
| Cross-platform path bugs (Pitfall 8) | Phase 1 (Scaffold + Core Shell) | CI passes on Linux, Windows, macOS; AppImage launches and browses files |
| No loading state for artifacts | Phase 2 (Artifact Rendering) | Every artifact type shows a loading skeleton before content |
| Tab persistence missing | Phase 1 (Scaffold + Core Shell) | Close app with 3 tabs, reopen — tabs restored with correct content |
| Window state not saved | Phase 1 (Scaffold + Core Shell) | Window position/size restored across restarts on all platforms |
| HTML artifact sandbox bypass | Phase 2 (Artifact Rendering — HTML) | `<iframe sandbox>` enforcement; no Node.js access from HTML preview |
| MCP server not disable-able | Phase 3 (WebSocket API + MCP Server) | `--no-mcp` flag; server process not spawned; zero MCP-related errors |
| No error boundaries per artifact | Phase 2 (Artifact Rendering) | Corrupted file in one tab doesn't crash other tabs or the app |

## Sources

- [Electron Performance Guide (official)](https://www.electronjs.org/docs/latest/tutorial/performance) — startup time optimization, module loading costs
- [Electron Security Best Practices (official)](https://www.electronjs.org/docs/latest/tutorial/security) — contextIsolation, sandbox, nodeIntegration
- [Electron IPC Guide (official)](https://www.electronjs.org/docs/latest/tutorial/ipc) — contextBridge patterns, channel design
- [MCP Anti-Patterns: 12 Mistakes That Break Your AI Agent Setup](https://chatforest.com/guides/mcp-anti-patterns/) — comprehensive MCP server design pitfalls (ChatForest, Apr 2026)
- [Debugging MCP Servers: Tips and Best Practices](https://www.mcpevals.io/blog/debugging-mcp-servers-tips-and-best-practices) — JSON-RPC debugging, transport issues
- [Electron Security Guide (Emad Ibrahim)](https://www.emadibrahim.com/electron-guide/security) — security architecture, process model
- [VibeBlaster Performance Journey (Emad Ibrahim)](https://www.emadibrahim.com/electron-guide/performance) — real-world performance optimization case study
- [Electron Architecture Deep Dive (Emad Ibrahim)](https://www.emadibrahim.com/electron-guide/architecture) — IPC patterns, multi-process model
- [Optimizing In-Browser PDF Rendering](https://joyfill.io/blog/optimizing-in-browser-pdf-rendering-viewing) — PDF.js performance bottlenecks (Nov 2025)
- [CodeMirror vs Monaco Editor comparison](https://www.agenthicks.com/research/codemirror-vs-monaco-editor-comparison) — bundle size, large file handling (Sep 2025)
- [MCP Server Troubleshooting Guide](https://enterprisecontextmanagement.com/article/troubleshooting-mcp-server-connections) — common connection and permission issues (Jan 2026)
- [Electron Build Instructions (Linux)](https://freesoftwaredevlopment.github.io/electron/docs/development/build-instructions-linux.html) — Linux-specific dependencies and quirks
- [Debugging and Troubleshooting Common Electron Issues](https://blog.openreplay.com/debugging-troubleshooting-electron-issues/) — IPC listener cleanup, RSS vs heap monitoring (Nov 2025)
- [Desktop Application Penetration Testing: Electron Security](https://lorikeetsecurity.com/blog/desktop-app-pentesting) — nodeIntegration, contextIsolation vulnerabilities (Feb 2026)
- [The Extension Host: How VS Code Isolates Extensions](https://readoss.com/en/microsoft/vscode/extension-host-vscode-isolates-communicates-extensions) — plugin architecture patterns (Apr 2026)
- [MacOS App Sandbox File Access Guide](https://developer.apple.com/documentation/security/accessing-files-from-the-macos-app-sandbox) — security-scoped bookmarks

---

*Pitfalls research for: AI CLI Studio (Electron Canvas / Artifact Viewer with MCP + WebSocket)*
*Researched: 2026-06-11*
