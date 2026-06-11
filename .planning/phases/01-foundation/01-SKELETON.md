# Walking Skeleton — AI CLI Studio

**Phase:** 1
**Generated:** 2026-06-11

## Capability Proven End-to-End

"Developer launches the AI CLI Studio desktop app, sees a dark-themed welcome screen, and reads the application version loaded via secure IPC from the main process."

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Desktop framework | Electron 42.4.0 + electron-vite 5.0.0 | Only viable option for Linux + Windows + macOS from single codebase. electron-vite provides fast HMR, PostCSS integration, and one-click scaffolding via `@quick-start/create-electron`. |
| Language | TypeScript 6.0.3 (strict) | Non-negotiable for IPC protocol definitions, Zod type inference, and cross-process type sharing between main/preload/renderer. |
| UI framework | React 19.2.7 | De facto standard for Electron renderers. `React.lazy()` + `Suspense` is the built-in code-splitting mechanism for lazy-loading artifact viewers. |
| Build tooling | electron-vite 5 (Vite 8) | Vite-powered bundler with instant HMR for renderer; separate build targets for main, preload, and renderer processes. Single config file. |
| CSS framework | Tailwind CSS 4.3.0 (via @theme) | Utility-first CSS with CSS-first configuration. `@theme` directive handles Obsidianite-inspired palette without JavaScript runtime. No `tailwind.config.js` needed. |
| IPC validation | Zod 4.4.3 | Schema validation on every IPC channel boundary. TypeScript-first, generates types from schemas, 185M weekly downloads. One schema per channel — no mega-schemas. |
| IPC architecture | Namespaced router (`namespace:action`) | `ipcMain.handle()` with `namespace:action` channel naming. One source file per namespace (`src/main/ipc/app.ts`, `src/main/ipc/window.ts`). Central router registers all handlers. |
| Preload bridge | Single contextBridge.exposeInMainWorld | Single audited file (`src/preload/index.ts`). Exposes namespaced `electronAPI` object (`electronAPI.app.*`, `electronAPI.window.*`, `electronAPI.on`). Exact one call — no fragmentation. |
| Security boundary | contextIsolation: true, sandbox: true, nodeIntegration: false | All three flags explicitly set in BrowserWindow config. CI-enforced via test parsing `src/main/index.ts`. Renderer runs in sandboxed Chromium with no Node.js access. |
| Packaging | electron-builder 26.15.2 | Linux targets: AppImage + DEB. Windows target: NSIS. macOS DMG deferred to post-v1. |
| Dark palette | Obsidianite-inspired | Background #100e17, text #bebebe, accent #0fb6d6 (teal). Semantic colors for success (green), warning (amber), error (red). Values extracted from local Obsidianite reference theme. |
| Lazy-loading | ViewerRegistry + React.lazy() + Suspense | Per-artifact-type lazy loading. Each viewer is its own chunk loaded on first tab open (per D-12). Skeleton screens (shimmer animation) as Suspense fallback — not spinners (per D-11). |
| Performance measurement | performance.now() + process.memoryUsage() | Startup milestone markers logged at `app.whenReady` and `ready-to-show`. Baseline RSS and heap used logged at first show. Budget warnings at 2s startup / 200MB idle RSS. |
| Test framework | Vitest + jsdom + @testing-library/react | Vite-native test runner. jsdom environment for React component tests. @testing-library/react for component assertions. |
| CI/CD | GitHub Actions (matrix: ubuntu-latest + windows-latest) | Lint → typecheck → test → build → package per platform. No macOS runner (macOS packaging deferred). |
| Icon library | Lucide React (installed, minimal Phase 1 use) | Installed to establish dependency tree. Phase 2 will use Lucide icons for tab bar, file browser, and window controls. |
| Font | Inter (Google Fonts) | Primary font family. Loaded via `<link>` in `index.html`. Weights: 400, 500, 600, 700. |

## Stack Touched in Phase 1

- [x] Project scaffold (`@quick-start/create-electron` + react-ts template)
- [x] Build pipeline (electron-vite, three-target compilation)
- [x] CSS pipeline (Tailwind v4 @theme, PostCSS, autoprefixer)
- [x] Test infrastructure (Vitest, jsdom, @testing-library/react)
- [x] TypeScript configuration (3 tsconfig files: root, web/renderer, node)
- [x] IPC routing — one namespace handler file per domain (app, window)
- [x] IPC validation — Zod schema per channel, both input params and return type
- [x] Preload bridge — single contextBridge call, namespaced electronAPI object
- [x] IPC React hook — typed `useElectronAPI()` and `useAppVersion()`
- [x] Dark theme — full Obsidianite-inspired palette via @theme directive
- [x] Welcome screen — centered brand heading + tagline + version via IPC
- [x] Skeleton components — shimmer animation, CodeSkeleton and MarkdownSkeleton variants
- [x] ViewerRegistry — lazy-loading infrastructure for Phase 2 artifact viewers
- [x] UI primitive components — Skeleton, IconButton
- [x] Performance instrumentation — startup time + memory baseline logging
- [x] Security hardening — all three BrowserWindow security flags enforced
- [x] Packaging config — electron-builder.yml for Linux AppImage/DEB + Windows NSIS
- [x] CI workflow — GitHub Actions matrix build for ubuntu + windows
- [x] Local development — `npm run dev` for HMR workflow

## Out of Scope (Deferred to Later Slices)

- Artifact viewers (CodeViewer, MarkdownViewer, ImageViewer) — Phase 2
- Tab bar and multi-tab artifact management — Phase 2
- Preview-first UI with code toggle — Phase 2
- Side-by-side split pane with resize handle — Phase 2
- File browser sidebar — Phase 2
- Zustand state stores for artifacts/tabs/UI — Phase 2
- Shiki syntax highlighting for code — Phase 2
- WebSocket server/client for agent communication — Phase 3
- MCP server for agent tool access — Phase 3
- HTML sandbox iframe with CSP — Phase 4
- PDF viewer (PDF.js integration) — Phase 4
- Mermaid diagram renderer — Phase 4
- SVG interactive renderer — Phase 4
- shadcn component library — Phase 2 (deferred per UI-SPEC)
- macOS DMG packaging — Post-v1
- Light theme — v2
- Plugin system — v2+

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2: Core Artifact Viewing** — Tabbed preview-first UI with code/markdown/image renderers, file browser sidebar, Zustand state management, and Shiki syntax highlighting.
- **Phase 3: Agent Communication** — WebSocket protocol for bidirectional agent control, dual-mode connectivity (self-contained + agent-connected), MCP server with canvas-control tools, and session resume with exponential backoff.
- **Phase 4: Advanced Artifacts** — Sandboxed HTML preview (srcdoc + sandbox + CSP), interactive SVG rendering, PDF viewer with page navigation, and Mermaid diagram rendering from syntax.
