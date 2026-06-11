# Stack Research

**Domain:** Electron-based Canvas / Artifact Viewer for AI CLI Agents
**Researched:** 2026-06-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Electron | 42.x (stable) | Cross-platform desktop shell | Only viable option for Linux + Windows + macOS from a single codebase. Latest stable is v42.3.3 (Chrome M148, Node 24). Gives access to file system, native windowing, and OS integration. |
| electron-vite | 5.0.0 | Build tooling for Electron | Vite-powered, instant HMR for renderer, hot reload for main process. Single config for main/preload/renderer. Significantly faster than Webpack-based alternatives. v5.0.0 is stable; v6.0.0 is in beta. |
| electron-builder | 25.x | Packaging and distribution | Most mature cross-platform packager (NSIS/DMG/AppImage). 2.4M weekly downloads. Handles code signing, auto-update, and multiple target formats. electron-forge is the "official" alternative but has fewer features and a smaller ecosystem. |
| React | 19.x | UI framework | De facto standard for Electron renderer processes. Large ecosystem of compatible libraries. Component model maps naturally to artifact viewers, tabs, and file browser. |
| TypeScript | 5.x | Type safety | Non-negotiable for a project with WebSocket protocols, MCP interfaces, and complex state management. Catches protocol message format mismatches at compile time. |
| Vite | 6.x | Bundler (via electron-vite) | Fastest bundler available. Native ESM, esbuild-based transforms. Already integrated through electron-vite. |
| Node.js | 22.x LTS | Runtime (bundled with Electron) | Electron 42 ships Node 24, but development should target the Active LTS line. |

### Key Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| ws | 8.21.0 | WebSocket server in main process | Zero-dependency, 221M weekly downloads, battle-tested Autobahn compliance. We control both server and client (both in the Electron process), so Socket.IO's protocol overhead and fallback transports are unnecessary. |
| @modelcontextprotocol/sdk | 1.29.0 | MCP server implementation | Official TypeScript SDK from Anthropic. 24M weekly downloads, actively maintained (78 releases). Supports Streamable HTTP transport, tools/resources/prompts, and OAuth. This is the canonical MCP library. |
| react-shiki | 0.9.3 | Syntax highlighting | Wraps Shiki v4 (VS Code's TextMate grammar engine). Renders React elements (no `dangerouslySetInnerHTML`). Supports 200+ languages, multi-theme (light/dark), dynamic imports for minimal bundle. Far more accurate than highlight.js or Prism. |
| react-markdown | 10.1.0 | Markdown rendering | React-component-based markdown renderer (no XSS vector). Unified/remark ecosystem enables extensibility through plugins. Supports custom component overrides for Obsidianite-themed preview. |
| react-pdf | 10.4.1 | PDF viewing | Wraps PDF.js with clean React component API (`<Document>`, `<Page>`). 4M weekly downloads. v10 is ESM-only with updated PDF.js 5.3.31. Works inside Electron renderer with proper worker configuration. |
| remark-gfm | 4.x | GitHub Flavored Markdown plugin | Adds tables, task lists, strikethrough, auto-link URLs. Required companion to react-markdown for full markdown support. |
| Tailwind CSS | 4.x | Styling | Utility-first CSS with `@theme` directive for custom color schemes (Obsidianite theme). Built-in dark mode via `class` strategy. v4 has improved CSS-first configuration and zero-config setup. |
| @radix-ui/react-tabs | 1.x | Accessible tab primitives | Headless, unstyled tab components for artifact tab management. Composable API, WAI-ARIA compliant, no CSS baggage. |
| @radix-ui/react-scroll-area | 1.x | Custom scroll areas | Cross-platform custom scrollbars for the file browser and code views. Necessary because native scrollbars differ across platforms. |
| lucide-react | 0.x | Icons | Clean, consistent icon set for file browser, tabs, and toolbar. Tree-shakeable, no icon font overhead. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit and integration testing | Native Vite integration, same API as Jest, 3x faster. Use with React Testing Library. |
| Playwright | E2E testing | Industry standard for Electron E2E tests. Direct Electron support for testing window management, IPC, and WebSocket connections. |
| ESLint + Prettier | Code quality | Standard TypeScript project tooling. Use `@electron-toolkit/eslint-config-ts` for Electron-aware linting. |
| electron-devtools-installer | Chrome DevTools for Electron | Install React DevTools and other extensions automatically in dev mode. |

## Installation

```bash
# Scaffold the project
npm create @quick-start/electron@latest ai-agent-studio -- --template react-ts
cd ai-agent-studio

# Core Electron + UI
npm install react@19 react-dom@19
npm install -D electron@42 electron-vite@5 electron-builder@25 typescript@5

# WebSocket
npm install ws@8
npm install -D @types/ws

# MCP
npm install @modelcontextprotocol/sdk@1

# Syntax highlighting
npm install react-shiki@0 shiki@4

# Markdown
npm install react-markdown@10 remark-gfm@4

# PDF
npm install react-pdf@10

# Styling
npm install -D tailwindcss@4 postcss autoprefixer

# UI primitives
npm install @radix-ui/react-tabs@1 @radix-ui/react-scroll-area@1
npm install lucide-react

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| ws (WebSocket) | Socket.IO | If you need automatic reconnection, rooms, and fallback transports for third-party clients. Not needed here — our client and server are both in-process. |
| electron-vite | electron-forge | If you prefer the "official" Electron toolchain and tighter integration with GitHub releases. Forge has fewer features and slower builds. |
| electron-builder | electron-forge maker | If you want a single vendor for build+packaging. Forge's maker system is simpler but less capable than electron-builder's configuration. |
| react-shiki | react-syntax-highlighter | If you need the simplest possible API and don't care about highlighting accuracy or modern React patterns. react-syntax-highlighter wraps deprecated Prism.js (last updated 2022). |
| react-markdown | marked + dangerouslySetInnerHTML | If you don't care about XSS prevention and prefer the simplicity of HTML string output. marked is faster but unsafe. |
| react-pdf | pdfjs-dist directly | If you need full control over the PDF viewer UI (custom toolbar, virtual scrolling, annotations). react-pdf is simpler for basic viewing. |
| Tailwind CSS | CSS Modules | If you prefer scoped styles over utility classes. Tailwind is faster to iterate with. |
| @radix-ui/react-tabs | Headless UI | Radix has better TypeScript types and a more composable API. Both are valid choices. |
| Vitest | Jest | Jest requires complex Vite compatibility config. Vitest works out of the box with electron-vite projects. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Socket.IO | Adds 40KB+ of protocol overhead (HTTP long polling fallback, custom event format, rooms). We control both server and client in the same Electron process — raw WebSocket is simpler, faster, and the standard protocol. | ws |
| CodeMirror 6 | It's a full code editor (~2MB) with undo stack, selection management, input handling. For display-only syntax highlighting (what we need for code preview), use a highlighter, not an editor. | react-shiki |
| react-syntax-highlighter | Wraps highlight.js/Prism.js — both have been superseded. Prism.js has had no updates since 2022. highlight.js uses `dangerouslySetInnerHTML`. Bundle is ~500KB for all languages. | react-shiki |
| Monaco Editor | Weighs ~25MB. Designed for a full IDE experience. Massively overkill for a code view toggle. | react-shiki |
| marked | Outputs raw HTML strings that require `dangerouslySetInnerHTML` to render — creates XSS attack surface. No plugin system for custom component overrides. | react-markdown |
| Redux / Zustand | Overkill for artifact/tab state. The app has at most a few dozen state values (active tab, artifacts list, connection status, file tree). React context + useReducer handles this cleanly. | React context + hooks |
| Next.js | An SSR meta-framework. We're building a desktop app — no server-side rendering, no routing, no static generation. | React + Vite (direct) |
| jQuery | Legacy library. Electron ships Chrome M148 which has full ES2024 support. No reason to use jQuery in 2026. | Native DOM APIs |
| webpack (directly) | Slow dev server rebuilds, complex config. electron-vite replaces it entirely. | electron-vite (Vite) |

## Stack Patterns by Variant

**If you need to support older Electron versions (pre-v40):**
- Use `react 18` instead of `react 19` (React 19 is only guaranteed with Electron 40+)
- Pin `react-pdf` to v9.x (v10 requires ESM and PDF.js 5.x)
- Keep `react-markdown` at v9.x (v10 requires React 18+)

**If the MCP server needs to run as a separate process (not embedded in Electron):**
- Use `@modelcontextprotocol/sdk` with `StdioServerTransport`
- The agent starts the MCP server as a child process via stdio
- This is the standard MCP server pattern used by Claude Code and Codex
- No change to the WebSocket layer — it remains for the agent ↔ canvas high-level API

**If you need rich code editing (not just display):**
- Add `@uiw/react-codemirror` for interactive code editing
- Keep `react-shiki` for display-only mode (it's 10x lighter than CodeMirror)
- Render `react-shiki` when the code is in view-only mode; swap to CodeMirror when editing

**If you need collaborative/real-time artifact editing:**
- Replace `ws` directly with Yjs + y-websocket for CRDT-based syncing
- Keep the WebSocket layer for control messages; add Yjs for document sync
- This is a Phase 2+ concern — not needed for MVP

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| electron@42 | electron-vite@5, electron-builder@25 | Confirmed compatible as of June 2026 |
| react-markdown@10 | react@18+, react-shiki@0.9+ | Custom component overrides react-shiki for code blocks |
| react-pdf@10 | react@18+, vite bundler | ESM-only — requires Vite/electron-vite (not Webpack 4) |
| react-shiki@0.9 | shiki@4 (bundled dependency) | Auto-installs compatible shiki version |
| @modelcontextprotocol/sdk@1 | Node 18+, TypeScript 5+ | Supports Streamable HTTP and SSE transports |
| ws@8 | Node 18+ (Electron 42 ships Node 24) | Zero native dependencies, works universally |
| Tailwind CSS v4 | PostCSS 8+, Vite | Requires PostCSS config; incompatible with v3 `tailwind.config.js` format |

## Sources

- [npm: electron-vite v5.0.0](https://www.npmjs.com/package/electron-vite) — Electron build tooling docs
- [npm: ws v8.21.0](https://www.npmjs.com/package/ws) — WebSocket server library
- [npm: @modelcontextprotocol/sdk v1.29.0](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — Official MCP SDK
- [npm: react-shiki v0.9.3](https://www.npmjs.com/package/react-shiki) — Shiki-based React syntax highlighter
- [npm: react-markdown v10.1.0](https://www.npmjs.com/package/react-markdown) — React markdown renderer
- [npm: react-pdf v10.4.1](https://www.npmjs.com/package/react-pdf) — React PDF viewer
- [electron-vite.org: Getting Started](https://electron-vite.org/guide) — Scaffolding guide
- [Electron releases page](https://endoflife.date/electron) — Electron version timeline
- [npm-compare: ws vs socket.io](https://npm-compare.com/nodejs-websocket,socket.io,uws,ws) — WebSocket library comparison
- [shiki.style: Guide](https://shiki.style/guide) — Shiki syntax highlighting documentation
- [npm-compare: highlight.js vs prismjs vs shiki](https://npm-compare.com/highlight.js,prismjs,react-syntax-highlighter,shiki) — Syntax highlighting comparison
- [Model Context Protocol docs](https://modelcontextprotocol.io) — MCP specification and SDK docs

---
*Stack research for: AI Agent Studio — Electron-based Canvas / Artifact Viewer*
*Researched: 2026-06-11*
