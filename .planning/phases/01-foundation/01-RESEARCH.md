# Phase 1: Foundation — Research

**Researched:** 2026-06-11
**Domain:** Electron desktop shell, IPC architecture, preload bridge, dark theme, lazy-loading infrastructure
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational Electron application shell — a cross-platform desktop scaffold with secure IPC architecture, Zod-validated channels, dark theme, and lazy-loading infrastructure. Every downstream phase depends on this foundation. The key architectural choice is the namespaced IPC router pattern with one Zod schema per channel, enforced through a single audited `contextBridge` preload script. Electron 42.4.0 + electron-vite 5.0.0 provides a modern, fast-bundling scaffold via the official quick-start template. Tailwind CSS 4.3.0 `@theme` directive handles the dark palette, inspired by the Obsidianite reference theme. Lazy-loading uses `React.lazy()` + `Suspense` per viewer type with skeleton screen loading states.

**Primary recommendation:** Scaffold with `npm create @quick-start/create-electron@latest` (note: the package is `@quick-start/create-electron`, NOT `@quick-start/electron`), use layer-first structure (`src/main/`, `src/preload/`, `src/renderer/`), establish the namespaced IPC router with Zod validation from day one, and enforce the performance budget (<2s startup, <200MB idle RAM) as a CI gate.

**Note on versions vs existing research:** The existing `.planning/research/` documents were generated from training data and may reference stale versions. The values below are verified against the npm registry as of 2026-06-11 and should be treated as authoritative.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Project Scaffolding
- **D-01:** Use `npm create @quick-start/electron@latest --template react-ts` — the official electron-vite scaffold. Confirm latest versions at build time (Electron 42.4.0+, electron-vite 5.0.0+, React 19.2.7+, Tailwind CSS 4.3.0+).
- **D-02:** Layer-first structure following electron-vite defaults: `src/main/` (IPC handlers, window management), `src/preload/` (contextBridge, one audited file), `src/renderer/` (React SPA).
- **D-03:** Package as AppImage/DEB (Linux) and NSIS (Windows) for v1. macOS DMG deferred.

#### IPC Architecture
- **D-04:** Namespaced router pattern — `ipcMain.handle()` with `namespace:action` channel naming (e.g., `artifact:open`, `fs:read`, `app:quit`). One source file per namespace.
- **D-05:** One Zod schema per IPC channel — validates both input params and return type. No shared mega-schemas.
- **D-06:** Single `contextBridge.exposeInMainWorld('electronAPI', {...})` with namespaced API surface: `electronAPI.artifact.*`, `electronAPI.fs.*`, `electronAPI.app.*`. One audited preload file.

#### Dark Theme
- **D-07:** Tailwind CSS 4 dark mode via `@theme` directive with CSS custom properties for the palette. No separate theme config file.
- **D-08:** Dark palette inspired by Obsidianite — extract accent/background/text values as reference, adapt for code-viewing readability. Not a direct port.
- **D-09:** Single accent color (teal/blue) with semantic palette (success/green, warning/amber, error/red).

#### Lazy-Loading
- **D-10:** Per-artifact-type lazy loading via `React.lazy()` + `Suspense` — each viewer (CodeViewer, MarkdownViewer, ImageViewer, etc.) is its own chunk loaded on first tab open of that type.
- **D-11:** Skeleton screen loading states matching viewer layout — not spinners.
- **D-12:** Trigger lazy load on tab open, not on app start — optimizes perceived performance.

#### Naming
- **D-13:** Project name — **AI CLI Studio** with npm package name `ai-cli-studio`.

### The Agent's Discretion
- Tailwind dark mode implementation approach (CSS custom properties vs `dark:` class strategy) — use standard Tailwind v4 patterns.
- Specific skeleton screen designs — standard shimmer/skeleton pattern.
- CI tooling (GitHub Actions vs other) — use standard practices for Electron cross-platform builds.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Electron app launches on Linux, Windows, and macOS | Electron 42.4.0 + electron-vite 5.0.0 scaffold provides cross-platform skeleton. electron-builder 26.15.2 handles packaging. Linux AppImage/DEB + Windows NSIS in v1. macOS DMG deferred. |
| FND-02 | Preload bridge enforces contextIsolation with typed IPC via contextBridge | Single `src/preload/index.ts` file with `contextBridge.exposeInMainWorld('electronAPI', {...})`. `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` enforced in BrowserWindow config. |
| FND-03 | All IPC channels validated with Zod schemas | One Zod schema per IPC channel in `src/shared/validators/`. Schema validates input params AND return type. `ipcMain.handle()` wrapper that calls `.parse()` on every invocation. |
| FND-04 | Lazy-loading infrastructure established for artifact renderers | `ViewerRegistry` class with `React.lazy()` per viewer. Skeleton screens via Tailwind `animate-pulse`. Triggered on tab open via Zustand store action. |
| FND-05 | Dark theme applied consistently across all UI | Tailwind CSS 4 `@theme` directive with CSS custom properties. Obsidianite-inspired palette values extracted and adapted. Semantic colors (success/warning/error) defined. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| App window lifecycle | Main process | — | `app.on('ready')`, `BrowserWindow` creation, lifecycle events — all main process APIs |
| IPC routing | Main process | Preload (proxy) | `ipcMain.handle()` registers handlers in main; preload exposes typed wrapper to renderer |
| Input validation | Shared (both sides) | — | Zod schemas in `src/shared/validators/` — imported by both main and renderer for type safety |
| Dark theme styling | Renderer (CSS) | — | Tailwind utility classes in React components; CSS custom properties in `globals.css` |
| UI rendering | Renderer (React) | — | React SPA in sandboxed Chromium renderer; no Node.js access |
| Lazy-loading infrastructure | Renderer (React) | — | `React.lazy()` + `Suspense` in renderer; ViewerRegistry class manages type-to-component mapping |
| Cross-platform packaging | Build pipeline | — | electron-builder 26.15.2 in CI; separate configs per target platform |
| Performance monitoring | Main + Renderer | — | `performance.now()` at startup milestone markers; `process.memoryUsage()` for baseline |
| Security enforcement | Main process | Preload | BrowserWindow config, CSP headers, contextIsolation — all enforced in main process window creation |

## Standard Stack

### Core

| Library | Version [VERIFIED] | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| Electron | 42.4.0 | Cross-platform desktop shell | Only viable option for Linux + Windows + macOS from single codebase. Ships Chrome M148, Node 24. |
| electron-vite | 5.0.0 | Build tooling | Vite-powered, instant HMR for renderer + hot reload for main. Single config. Upgrading scaffold default recommended. |
| React | 19.2.7 | UI framework | De facto standard for Electron renderer. Large ecosystem, component model fits artifact viewers. |
| React-DOM | 19.2.7 | DOM rendering | Companion to React 19 for browser environment in renderer process. |
| TypeScript | 6.0.3 | Type safety | Non-negotiable for IPC protocol definitions, Zod schema types, and cross-process type sharing. |
| Vite | 8.0.16 | Bundler (via electron-vite) | Fastest bundler. Native ESM, esbuild transforms. Already integrated through electron-vite. |
| Tailwind CSS | 4.3.0 | Styling | Utility-first CSS with `@theme` directive for custom color schemes (Obsidianite-inspired). CSS-first configuration in v4. |
| Zod | 4.4.3 | Runtime validation | Schema validation at IPC boundary. TypeScript-first, zero-dependency, 185M weekly downloads. Generates TS types from schemas. |
| PostCSS | 8.5.15 | CSS processor | Required by Tailwind CSS v4. PostCSS plugin chain handles `@theme` directive and `@import`. |
| autoprefixer | 10.5.0 | CSS vendor prefixes | Standard PostCSS plugin for cross-browser CSS compatibility. |

### Supporting (Phase 1 scope only — excludes future-phase libs like react-shiki, ws, MCP SDK)

| Library | Version [VERIFIED] | Purpose | When to Use |
|---------|-------------------|---------|-------------|
| electron-builder | 26.15.2 | Packaging and distribution | For building AppImage/DEB (Linux) and NSIS (Windows) installers. NOTE: Research docs reference 25.x; 26.15.2 is current. Config format is compatible. |
| @electron-toolkit/preload | Latest | Preload utilities | Provides `electronAPI.ipcRenderer.invoke()` etc. for the preload bridge. Optional — can write custom wrapper. |
| @electron-toolkit/utils | Latest | Main process utilities | Convenience wrappers for `app.isPackaged`, `electronApp`, etc. |
| eslint + prettier | Latest | Code quality | Standard TypeScript tooling. Use `@electron-toolkit/eslint-config-ts` for Electron-aware linting. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| electron-vite 5 | electron-forge | Forge has fewer features and slower builds. electron-vite is faster and better maintained. |
| electron-builder 26 | electron-forge maker | electron-builder has richer packaging config (AppImage, NSIS, DMG). Forge is simpler but less capable. |
| Tailwind CSS 4 | CSS Modules | Tailwind is faster to iterate with; CSS Modules are more explicit. Both work with React. |
| Zod | io-ts / yup | Zod has best TypeScript integration, 185M weekly downloads, generates types automatically. |

**Installation:**

```bash
# Step 1: Scaffold the project (see Implementation Guidance for exact command)
npm create @quick-start/create-electron@latest ai-cli-studio -- --template react-ts

# Step 2: Core dependencies (confirm versions at build time)
npm install react@19 react-dom@19
npm install -D electron@42 electron-vite@5 electron-builder@26 typescript@6
npm install -D tailwindcss@4 postcss autoprefixer
npm install zod@4
npm install @electron-toolkit/preload @electron-toolkit/utils
```

### Scaffold command clarification

The CONTEXT.md decision D-01 specifies `npm create @quick-start/electron@latest` but the actual npm package is **`@quick-start/create-electron`**. The correct commands are:

```bash
# Option A (npm create shorthand — may differ by npm version)
npm create @quick-start/create-electron@latest ai-cli-studio -- --template react-ts

# Option B (explicit npx)
npx @quick-start/create-electron ai-cli-studio --template react-ts

# Option C (alias that may also work — check at runtime)
npm create electron-vite@latest ai-cli-studio -- --template react-ts
```

**Action for planner:** Verify the scaffold command works on the target machine before building the plan. The official `electron-vite` docs at [https://electron-vite.org/guide/](https://electron-vite.org/guide/) show the canonical scaffolding approach.

## Package Legitimacy Audit

> Run against npm registry on 2026-06-11. All packages in the Core stack are verified.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| electron@42.4.0 | npm | 8+ yrs | 4.35M/wk | github.com/electron/electron | OK [CITED: npm registry — well-known, high-traffic package] | Approved |
| electron-vite@5.0.0 | npm | 3+ yrs | 550K/wk | github.com/alex8088/electron-vite | OK [CITED: npm registry] | Approved |
| react@19.2.7 | npm | 12+ yrs | 134M/wk | github.com/facebook/react | OK [CITED: npm registry — well-known, high-traffic package] | Approved |
| react-dom@19.2.7 | npm | 12+ yrs | 126M/wk | github.com/facebook/react | OK [CITED: npm registry] | Approved |
| tailwindcss@4.3.0 | npm | 6+ yrs | 110M/wk | github.com/tailwindlabs/tailwindcss | OK [CITED: npm registry] | Approved |
| postcss@8.5.15 | npm | 10+ yrs | 225M/wk | github.com/postcss/postcss | OK [CITED: npm registry] | Approved |
| autoprefixer@10.5.0 | npm | 11+ yrs | 62M/wk | github.com/postcss/autoprefixer | OK [CITED: npm registry] | Approved |
| typescript@6.0.3 | npm | 12+ yrs | 205M/wk | github.com/microsoft/TypeScript | OK [CITED: npm registry] | Approved |
| zod@4.4.3 | npm | 5+ yrs | 185M/wk | github.com/colinhacks/zod | OK [CITED: npm registry] | Approved |
| electron-builder@26.15.2 | npm | 8+ yrs | 2.48M/wk | github.com/electron-userland/electron-builder | OK [CITED: npm registry] | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (all "too-new" false positives are well-established packages with millions of weekly downloads and verified repo URLs — these are safe to use)

**Postinstall audit:** No postinstall scripts found on any Phase 1 Core package (electron, electron-vite, react, react-dom, zod all return empty/null for `scripts.postinstall`). Verified via `npm view <pkg> scripts.postinstall`.

## Architecture Patterns

### System Architecture Diagram (Phase 1 Scope)

This diagram shows only the components Phase 1 builds. Future phases add utility processes (WebSocket, MCP) and artifact viewers.

```
                         ┌──────────────────────────────────┐
                         │        MAIN PROCESS               │
                         │        (Node.js)                  │
                         │                                   │
                         │  ┌─────────────────────────────┐  │
                         │  │  App lifecycle (app.ts)      │  │
                         │  │  • ready, quit, activate     │  │
                         │  │  • BrowserWindow config      │  │
                         │  │    - contextIsolation: true   │  │
                         │  │    - sandbox: true            │  │
                         │  │    - nodeIntegration: false   │  │
                         │  └──────────────┬──────────────┘  │
                         │                 │                  │
                         │  ┌──────────────▼──────────────┐  │
                         │  │  IPC Handler Router          │  │
                         │  │  src/main/ipc/index.ts       │  │
                         │  │                              │  │
                         │  │  ┌──────────┐┌──────────┐   │  │
                         │  │  │app: IPC  ││window:   │   │  │
                         │  │  │handlers  ││msg/proc  │   │  │
                         │  │  │(app.ts)  ││handlers  │   │  │
                         │  │  └──────────┘└──────────┘   │  │
                         │  │  ┌──────────┐               │  │
                         │  │  │(more in  │               │  │
                         │  │  │future    │               │  │
                         │  │  │phases)   │               │  │
                         │  │  └──────────┘               │  │
                         │  └─────────────────────────────┘  │
                         └──────────────┬───────────────────┘
                                        │ ipcMain.handle()
                                        ▼
                   ┌──────────────────────────────────────────┐
                   │         PRELOAD BRIDGE                    │
                   │         src/preload/index.ts              │
                   │                                           │
                   │  contextBridge.exposeInMainWorld(         │
                   │    'electronAPI', {                       │
                   │      app: { quit, getVersion, ... },      │
                   │      window: { minimize, close, ... },    │
                   │      // future namespaces: artifact, fs,  │
                   │      // connection, mcp                   │
                   │    }                                      │
                   │  )                                        │
                   └──────────────────┬───────────────────────┘
                                      │ window.electronAPI
                                      ▼
                   ┌──────────────────────────────────────────┐
                   │     RENDERER PROCESS (React SPA)          │
                   │     src/renderer/                         │
                   │                                           │
                   │  ┌─────────────────────────────────────┐  │
                   │  │  App Shell (Layout)                  │  │
                   │  │  ┌──────────────────────────────┐   │  │
                   │  │  │  // Phase 1: placeholder UI   │   │  │
                   │  │  │  // Will hold tab bar,        │   │  │
                   │  │  │  // canvas, sidebar in P2     │   │  │
                   │  │  └──────────────────────────────┘   │  │
                   │  └─────────────────────────────────────┘  │
                   │                                           │
                   │  ┌─────────────────────────────────────┐  │
                   │  │  ViewerRegistry (lazy-load infra)    │  │
                   │  │  • type → React.lazy() map           │  │
                   │  │  • skeleton component per type       │  │
                   │  │  • Suspense boundary per viewer      │  │
                   │  └─────────────────────────────────────┘  │
                   │                                           │
                   │  ┌─────────────────────────────────────┐  │
                   │  │  Zustand stores (Phase 2+)           │  │
                   │  │  useUIStore: dark mode, sidebar      │  │
                   │  └─────────────────────────────────────┘  │
                   └──────────────────────────────────────────┘

Data flow (IPC invocation):
  [React Component]
      │ useElectronAPI hook
      ▼
  window.electronAPI.app.quit()
      │
      ▼
  [Preload Bridge]
      │ ipcRenderer.invoke('app:quit')
      ▼
  [Main Process IPC Handler]
      │ Zod schema validation
      │ Handler executes
      ▼
  [Return value or void]
```

### Recommended Project Structure

```
ai-cli-studio/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry, window creation, ipc registration
│   │   ├── app.ts                     # App lifecycle (ready, quit, activate)
│   │   └── ipc/                       # IPC handler registration
│   │       ├── index.ts              # Router: registers all handlers
│   │       ├── app.ts               # App-level IPC (quit, getVersion, etc.)
│   │       └── window.ts            # Window management IPC (minimize, close, etc.)
│   │
│   ├── preload/                       # Preload scripts
│   │   └── index.ts                   # contextBridge.exposeInMainWorld('electronAPI', ...)
│   │                                  # One audited file — the security boundary
│   │
│   ├── shared/                        # Shared types, validators, constants
│   │   ├── types/
│   │   │   ├── ipc.ts                # IPC channel names, payload types
│   │   │   └── window.d.ts           # Type declarations for window.electronAPI
│   │   ├── validators/               # Zod schemas for IPC validation
│   │   │   ├── app.ts
│   │   │   └── window.ts
│   │   └── constants.ts              # App name, version channel, limits
│   │
│   └── renderer/                      # React SPA (sandboxed, Vite-bundled)
│       ├── index.html
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root component with shell layout
│       ├── assets/
│       │   └── styles/
│       │       └── globals.css       # Tailwind directives + CSS custom properties
│       ├── components/
│       │   └── ui/                   # Shared UI primitives
│       │       ├── Skeleton.tsx      # Reusable skeleton screen component
│       │       └── IconButton.tsx    # Basic icon button
│       └── hooks/
│           └── useElectronAPI.ts     # Typed wrapper for window.electronAPI
│
├── electron-builder.yml               # Distribution config
├── electron.vite.config.ts            # electron-vite config (main/preload/renderer)
├── tsconfig.json                      # Root TS config
├── tsconfig.web.json                  # Renderer TS config
├── tsconfig.node.json                 # Main + preload TS config
├── postcss.config.mjs                 # PostCSS config for Tailwind v4
├── package.json
└── .github/
    └── workflows/
        └── build.yml                  # CI: lint, test, build for Linux + Windows
```

### File Structure Rationale

- **`src/main/ipc/namespaced`**: One file per namespace, not one giant handler file. Each exports a `register(services)` function that takes typed service dependencies. This is the pattern specified by D-04.
- **`src/preload/index.ts`**: A single audited file (D-06). Every method is typed, minimal, and explicitly whitelisted. This file is the security boundary — review it on every change.
- **`src/shared/validators/`**: Zod schemas live in `shared/` because both main (for validation) and renderer (for type inference) need them. The schemas define the IPC contract.
- **`src/shared/types/window.d.ts`**: Augments the `Window` interface with `electronAPI` property. This file is imported by the renderer to get type safety on `window.electronAPI.*`.
- **`src/renderer/components/viewers/`**: The viewer directory is set up in Phase 1 as empty placeholder files or skeleton components. The actual rendering implementations come in Phase 2, but the lazy-loading infrastructure (ViewerRegistry, React.lazy patterns, suspense boundaries) is established now.
- **`src/renderer/hooks/useElectronAPI.ts`**: Encapsulates `window.electronAPI` access behind typed hooks. Provides `invoke()` method and event subscription. This prevents raw `window.electronAPI` access in components.

### Pattern 1: Namespaced IPC Router with Zod Validation

**What:** Each domain (app, window, artifact, fs) has its own handler file in `src/main/ipc/`. A central router imports and registers all handlers. Every `ipcMain.handle()` validates inputs and return values with Zod schemas from `src/shared/validators/`.

**When to use:** Always — this is the core architectural pattern for Phase 1 (D-04, D-05).

**Example:**

```typescript
// src/shared/validators/app.ts
import { z } from 'zod'

export const AppQuitSchema = z.object({
  force: z.boolean().default(false),
})

export const AppQuitResult = z.object({
  success: z.boolean(),
  error: z.string().optional(),
})

// src/main/ipc/app.ts
import { ipcMain, app } from 'electron'
import { AppQuitSchema, AppQuitResult } from '../../shared/validators/app'

export function registerAppIPC() {
  ipcMain.handle('app:quit', async (_event, payload) => {
    const params = AppQuitSchema.parse(payload)
    try {
      app.quit()
      return AppQuitResult.parse({ success: true })
    } catch (error) {
      return AppQuitResult.parse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion()
  })
}

// src/main/ipc/index.ts
import { registerAppIPC } from './app'
import { registerWindowIPC } from './window'

export function registerAllIPC() {
  registerAppIPC()
  registerWindowIPC()
  // Future phases add: registerArtifactIPC(), registerFSIPC(), etc.
}

// src/main/index.ts
import { BrowserWindow, app } from 'electron'
import { registerAllIPC } from './ipc'

app.whenReady().then(() => {
  registerAllIPC()
  // Create window...
})
```

**Source:** [CITED: Electron IPC Guide — official docs]

### Pattern 2: Typed Preload Bridge with Context Isolation

**What:** A single audited preload file exposes a namespaced API via `contextBridge.exposeInMainWorld()`. The renderer accesses it through `window.electronAPI.*` with full TypeScript types.

**When to use:** Always — this is the security boundary (D-06).

**Example:**

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

// Typed API surface
const electronAPI = {
  app: {
    quit: (force?: boolean) => ipcRenderer.invoke('app:quit', { force }),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  // Event listener subscription (for main→renderer events)
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

// Expose to renderer — one call, one object
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type this for the renderer:
// src/shared/types/window.d.ts
export interface ElectronAPI {
  app: {
    quit: (force?: boolean) => Promise<void>
    getVersion: () => Promise<string>
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

**Source:** [CITED: Electron contextBridge official docs]

### Pattern 3: Viewer Registry with React.lazy() + Skeleton

**What:** A registry class maps artifact type strings to lazy-loaded React components. Each viewer is its own chunk, loaded on first use via `React.lazy()`. Skeleton screens show during loading.

**When to use:** Phase 1 establishes this infrastructure; Phase 2 populates it with real viewers.

**Example:**

```typescript
// src/renderer/components/viewers/ViewerRegistry.tsx
import { ComponentType, LazyExoticComponent, ReactNode, lazy, Suspense } from 'react'

// Type for artifact types (expandable in future phases)
export type ArtifactType = 'code' | 'markdown' | 'html' | 'image' | 'pdf' | 'svg'

interface ViewerProps {
  content: string
  language?: string
  title?: string
}

interface ViewerDefinition {
  component: LazyExoticComponent<ComponentType<ViewerProps>>
  Skeleton: ComponentType<ViewerProps>
}

class ViewerRegistry {
  private viewers = new Map<string, ViewerDefinition>()

  register(type: string, def: ViewerDefinition): void {
    this.viewers.set(type, def)
  }

  getViewer(type: string): ViewerDefinition | undefined {
    return this.viewers.get(type)
  }

  render(type: string, props: ViewerProps): ReactNode {
    const def = this.viewers.get(type)
    if (!def) {
      return <div className="text-text-faint p-4">Unsupported artifact type: {type}</div>
    }
    return (
      <Suspense fallback={<def.Skeleton {...props} />}>
        <def.component {...props} />
      </Suspense>
    )
  }
}

export const viewerRegistry = new ViewerRegistry()

// Example registration (Phase 2 will replace with actual viewer imports):
// viewerRegistry.register('code', {
//   component: lazy(() => import('./CodeViewer')),
//   Skeleton: CodeSkeleton,
// })
```

**Source:** [CITED: React.lazy + Suspense official docs]

### Pattern 4: Tailwind v4 Dark Theme with CSS Custom Properties

**What:** Tailwind CSS 4 uses CSS-first configuration via the `@theme` directive. CSS custom properties define the Obsidianite-inspired palette. Components use Tailwind utility classes referencing these custom properties.

**When to use:** This is the only theme approach (D-07, D-08, D-09).

**Example:**

```css
/* src/renderer/assets/styles/globals.css */
@import "tailwindcss";

/* Obsidianite-inspired dark palette */
/* Extracted key values from ~/code/CUSTOM_AI_Coding_Agent/01_Intro/Obsidianite/theme.css */
@theme {
  /* Base surface colors */
  --color-bg-primary: #100e17;
  --color-bg-secondary: #191621;
  --color-bg-tertiary: #0d0b12;
  --color-bg-elevated: #1e1a2e;

  /* Text colors */
  --color-text-primary: #bebebe;
  --color-text-secondary: #8a8a8a;
  --color-text-faint: #7aa2f7;
  --color-text-accent: #0fb6d6;

  /* Accent — teal/blue palette (D-09) */
  --color-accent-primary: #0fb6d6;
  --color-accent-hover: #13cef0;
  --color-accent-muted: rgba(14, 210, 247, 0.5);

  /* Semantic palette (D-09) */
  --color-status-success: #17b978;
  --color-status-warning: #ffc93c;
  --color-status-error: #f95959;

  /* Borders */
  --color-border-default: rgba(14, 210, 247, 0.15);
  --color-border-accent: rgba(14, 210, 247, 0.3);

  /* Code */
  --color-code-bg: #191621;
  --color-code-text: #0fb6d6;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 0.6rem;
}
::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 999px;
}
::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

/* Skeleton animation */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

**Source:** [CITED: Tailwind CSS v4 documentation — @theme directive]

### Pattern 5: Performance Budget Measurement

**What:** Startup time and memory usage are measured at specific milestone markers. A CI gate enforces <2s startup and <200MB idle RAM.

**When to use:** This is Phase 1's success criteria — establish the measurement infrastructure now.

**Example:**

```typescript
// src/main/index.ts - startup time measurement
const START_TIME = performance.now()

app.whenReady().then(() => {
  const mainReady = performance.now()
  console.log(`[PERF] app.whenReady: ${(mainReady - START_TIME).toFixed(1)}ms`)

  const mainWindow = new BrowserWindow({
    show: false,  // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  // Show window only when ready
  mainWindow.once('ready-to-show', () => {
    const showTime = performance.now()
    console.log(`[PERF] ready-to-show: ${(showTime - START_TIME).toFixed(1)}ms`)
    mainWindow.show()

    // Log memory baseline
    const mem = process.memoryUsage()
    console.log(`[PERF] RSS: ${(mem.rss / 1024 / 1024).toFixed(1)}MB`)
    console.log(`[PERF] Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`)

    // Assert performance budget
    if (showTime - START_TIME > 2000) {
      console.warn(`[PERF] ⚠️ Startup exceeds 2s budget: ${(showTime - START_TIME).toFixed(1)}ms`)
    }
    if (mem.rss > 200 * 1024 * 1024) {
      console.warn(`[PERF] ⚠️ Idle RSS exceeds 200MB: ${(mem.rss / 1024 / 1024).toFixed(1)}MB`)
    }
  })

  mainWindow.loadURL(/* Vite dev URL or file path */)
})
```

### Anti-Patterns to Avoid (Phase 1 specific)

- **Disabling contextIsolation for convenience:** Never set `contextIsolation: false`. One XSS in an HTML preview artifact becomes a full RCE. Enforce as a CI lint rule from day one (file: `src/main/index.ts`, line: `BrowserWindow` config).
- **Giant IPC switch statement:** Avoid a single IPC handler file that switches on channel name. Use the namespaced router pattern — one file per namespace. See Pattern 1.
- **Loading all viewer bundles at startup:** Phase 2 will add actual viewers. The Phase 1 lazy-loading infrastructure (Registry + React.lazy + Suspense) must ensure they're never loaded at app start. No viewer imports in the main renderer bundle.
- **Mutating `contextBridge.exposeInMainWorld` across multiple calls:** One call, one API object (D-06). Multiple calls create fragile dependencies and make auditing impossible.
- **Using `ipcRenderer.sendSync`:** This is synchronous and blocks the renderer. Always use async `ipcRenderer.invoke()` for request-response, and `ipcRenderer.on()` for events.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform Electron scaffolding | Manual Vite + Electron setup | `@quick-start/create-electron` | Official electron-vite template — handles main/preload/renderer build configs, HMR, PostCSS integration out of the box |
| IPC bridge between main and renderer | Custom MessageChannel or direct ipcRenderer access | `contextBridge.exposeInMainWorld` | Built into Electron, designed for security, automatically handles process boundary serialization |
| Runtime input validation at IPC boundary | Manual type checks in each handler | Zod schemas | Zod 4 is 185M/wk downloads, generates TypeScript types, produces clear error messages, handles nested/optional/default |
| CSS state management for theme | JavaScript-based theme toggling with inline styles | Tailwind CSS custom properties + `@theme` | Tailwind v4's CSS-first approach eliminates runtime theme logic — CSS custom properties cascade naturally |
| Cross-platform packaging (installer creation) | Manual fpm/NSIS scripts | electron-builder 26 | Handles AppImage, DEB, NSIS, DMG — including code signing, auto-update, icon conversion, dependency bundling |
| Code splitting / lazy loading | Manual dynamic import orchestration | `React.lazy()` + `Suspense` | Built into React 19, handles loading states, error boundaries, and chunk naming automatically |

**Key insight:** Every item in the Don't Hand-Roll table is a solved problem with a battle-tested library. The libraries handle edge cases that a custom solution would discover only in production (e.g., electron-builder handles AppImage sandbox permissions; React.lazy() automatically handles chunk loading failures).

## Common Pitfalls (Phase 1)

### Pitfall 1: Scaffold Command Mismatch

**What goes wrong:** The CONTEXT.md references `npm create @quick-start/electron@latest` but the actual npm package is `@quick-start/create-electron`. Running the wrong command fails or scaffolds an unexpected project.

**Why it happens:** The `@quick-start` namespace has multiple packages: `create-electron` (scaffold), `electron-vite` (build tool), and `electron` (the runtime). The create command is `create-electron`.

**How to avoid:** Verify the exact command works before building the plan. Use `npx @quick-start/create-electron@latest ai-cli-studio --template react-ts` as the fallback. The official docs at [https://electron-vite.org/guide/](https://electron-vite.org/guide/) show the canonical approach.

### Pitfall 2: Tailwind v3 Config Format with v4

**What goes wrong:** Installing Tailwind CSS 4 and writing a `tailwind.config.js` file from memory (the v3 format). Tailwind v4 uses CSS-first configuration via `@theme` directive — the `tailwind.config.js` file is no longer used.

**Why it happens:** Tailwind v4 (released early 2025) changed from JS config to CSS-first config. Most online examples still show the v3 format.

**How to avoid:** Use `@import "tailwindcss"` at the top of your CSS file. Use the `@theme` directive for palette configuration (see Pattern 4). Do NOT create a `tailwind.config.js` file. The PostCSS config is minimal:

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Pitfall 3: Not Measuring Performance from Day One

**What goes wrong:** The app starts at 1.2s and 120MB RAM during Phase 1 (good). By Phase 2 (with 4 artifact viewers added), it's 4s and 350MB. Nobody noticed because the baseline wasn't tracked.

**Why it happens:** Performance regressions are invisible without measurement. The `ready-to-show` and `process.memoryUsage()` instrumentation must be in place before any weight is added.

**How to avoid:** Instrument startup time and memory in `src/main/index.ts` (see Pattern 5). Log to console in dev mode. Add a CI check that fails if startup >2s or idle RSS >200MB. Use `--cpu-prof` and `--heap-prof` on every PR in CI.

### Pitfall 4: Leaking IPC Listeners on Component Unmount

**What goes wrong:** The renderer subscribes to a main-process event (e.g., `window:state-changed`) but doesn't clean up the listener when the component unmounts. Over time, `MaxListenersExceededWarning` appears and stale listeners prevent garbage collection.

**Why it happens:** The `ipcRenderer.on()` subscription pattern is imperative — React's `useEffect` cleanup must explicitly call `ipcRenderer.removeListener()`.

**How to avoid:** The preload bridge's `on()` method returns a cleanup function. Components should call this cleanup in their `useEffect` return:

```typescript
// In a React component
useEffect(() => {
  const cleanup = window.electronAPI.on('window:state-changed', (state) => {
    // handle state change
  })
  return cleanup  // unsubscribe on unmount
}, [])
```

### Pitfall 5: Forgetting `sandbox: true` in BrowserWindow

**What goes wrong:** The app works fine in development. In production, the renderer has more privileges than intended because `sandbox: true` was omitted from `webPreferences`.

**Why it happens:** Electron's defaults changed over versions, and many templates don't include `sandbox: true` by default.

**How to avoid:** Always set all three security flags explicitly on `BrowserWindow`:

```typescript
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,   // REQUIRED
    sandbox: true,             // REQUIRED
    nodeIntegration: false,    // REQUIRED
  },
})
```

Add a CI lint check that parses `src/main/index.ts` for these three settings.

## Code Examples

### Common Operation 1: Main Process Window Creation with Security

```typescript
// src/main/index.ts
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerAllIPC } from './ipc'

const START_TIME = performance.now()
let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,  // Performance: don't show until ready-to-show
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,   // Security: non-negotiable
      sandbox: true,             // Security: non-negotiable
      nodeIntegration: false,    // Security: non-negotiable
    },
  })

  // Security: open external links in system browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Performance: show window only when content is ready
  mainWindow.once('ready-to-show', () => {
    const elapsed = performance.now() - START_TIME
    console.log(`[PERF] ready-to-show: ${elapsed.toFixed(1)}ms`)
    mainWindow?.show()
  })

  // Load the renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerAllIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

### Common Operation 2: useElectronAPI Hook

```typescript
// src/renderer/hooks/useElectronAPI.ts
import { useCallback } from 'react'

interface ElectronAPI {
  app: {
    quit: (force?: boolean) => Promise<void>
    getVersion: () => Promise<string>
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

export function useElectronAPI(): ElectronAPI {
  return (window as Window & { electronAPI: ElectronAPI }).electronAPI
}

export function useAppVersion() {
  const api = useElectronAPI()
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    api.app.getVersion().then(setVersion)
  }, [api])

  return version
}
```

### Common Operation 3: Skeleton Screen Component

```typescript
// src/renderer/components/ui/Skeleton.tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        background: 'linear-gradient(90deg, var(--color-bg-secondary) 25%, var(--color-bg-elevated) 50%, var(--color-bg-secondary) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

// Example: Code viewer skeleton
export function CodeSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

// Example: Markdown viewer skeleton
export function MarkdownSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/4" />
      <div className="h-4" /> {/* spacer */}
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 JS config (`tailwind.config.js`) | Tailwind v4 CSS-first config (`@theme` directive) | 2025-02 (v4.0.0) | Phase 1 must use CSS-first config. No `tailwind.config.js` file. PostCSS plugin changed to `@tailwindcss/postcss`. |
| Electron v31 (Chrome M122) | Electron v42 (Chrome M148, Node 24) | 2026 ongoing | Latest Electron is 10 major versions ahead of what many tutorials cover. Newer Chrome has improved DevTools, Security, CSS features. |
| Zod v3 | Zod v4 | 2025-12 (v4.0.0) | Zod v4 has improved inference, smaller bundle, new `.pipe()` API. Phase 1 should use v4. Import via `z` as before. |
| electron-builder v25 | electron-builder v26 | 2025-10 (v26.0.0) | Minor breaking changes in config format. Check electron-builder docs for NSIS/AppImage config updates. |
| React 18 | React 19 | 2025-04 (v19.0.0) | React 19 has better concurrent features, new hook APIs. The scaffold template may default to React 18 — upgrade manually. |
| TypeScript 5.x | TypeScript 6.x | 2026-03 (v6.0.0) | TS 6 has some breaking changes (new defaults for `noUncheckedIndexedAccess`). Test existing types on upgrade. |

**Deprecated/outdated:**
- **`tailwind.config.js` format** (Tailwind v3): Replaced by CSS-first `@theme` in v4. Don't create this file.
- **`electron-forge`**: Still maintained but slower builds and fewer features than `electron-vite`.
- **Zod v3**: Still works but v4 has better TypeScript inference and smaller bundle. Use v4 for new projects.
- **`marked` library**: XSS via `dangerouslySetInnerHTML`. Not in Phase 1 scope, but good to note for later.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npm create @quick-start/create-electron@latest --template react-ts` produces a scaffold with correct security defaults (contextIsolation: true, sandbox: true) | Standard Stack / Architecture Patterns | Scaffold may ship with insecure defaults. Mitigation: Verify BrowserWindow config after scaffold and override if needed. |
| A2 | `@quick-start/create-electron` produces `electron.vite.config.ts`, not `electron-vite.config.ts` | Implementation Guidance | File name mismatch. Mitigation: Check the actual file created by the scaffold. |
| A3 | Tailwind CSS 4 `@theme` directive works with Vite/electron-vite out of the box | Standard Stack | PostCSS config may need manual setup. Mitigation: Verify postcss.config.mjs is created correctly. |
| A4 | electron-builder 26 config format is backward-compatible with most v25 examples | Standard Stack | Some v25 config examples may not work. Mitigation: Reference electron-builder v26 docs for config format. |
| A5 | React 19 `lazy()` + `Suspense` has no breaking changes from React 18 for this use case | Architecture Patterns | If React 19 changed lazy/loading behavior, the lazy-loading infrastructure may need adjustments. Mitigation: Test lazy loading works with a mock viewer component. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Which exact scaffold command works on this machine?**
   - What we know: CONTEXT.md D-01 specifies `npm create @quick-start/electron@latest` but the npm package is `@quick-start/create-electron`.
   - What's unclear: Whether `npm create @quick-start/create-electron@latest` or `npx @quick-start/create-electron` works, and whether the `--template react-ts` flag is correct.
   - Recommendation: **Plan for scaffold to be a single-step verification task.** The planner should designate a `checkpoint:verify-scaffold` as the very first task that runs the scaffold command, confirms the output, and adjusts subsequent tasks if the structure differs.

2. **Does electron-vite's default BrowserWindow config include all three security flags?**
   - What we know: The official template should set `contextIsolation: true` (Electron defaults to true since v12). But `sandbox: true` is NOT the default — it must be explicitly set.
   - What's unclear: Whether the scaffold template sets `sandbox: true`.
   - Recommendation: **Plan for a task that audits and hardens `src/main/index.ts`** to explicitly set all three security flags regardless of scaffold defaults.

3. **Which Node.js version does the environment provide?**
   - What we know: The environment has Node.js v24.15.0 as confirmed by `node --version`.
   - This is already answered — Electron 42 ships Node 24, so this is compatible.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All phases | ✓ | 24.15.0 | — |
| npm | Package management | ✓ | 11.16.0 | — |
| Git | Version control | ✓ | (git available per ls output) | — |
| Electron (via scaffold) | Desktop shell | ✗ (to install) | — | Install via npm |
| electron-vite (via scaffold) | Build tool | ✗ (to install) | — | Install via npm |
| PostgreSQL | Not required for Phase 1 | — | — | — |
| Redis | Not required for Phase 1 | — | — | — |
| Docker | Not required for Phase 1 | — | — | — |

**Missing dependencies with no fallback:** None for Phase 1 — all deps are npm-installable.
**Missing dependencies with fallback:** None.

## Validation Architecture

Since `workflow.nyquist_validation` is `true` (or absent) in config.json, this section is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (native Vite integration) + @testing-library/react |
| Config file | `vitest.config.ts` (or `electron.vite.config.ts` — check scaffold output) |
| Quick run command | `npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | Electron app launches | smoke (manual in Phase 1) | `npm run build && npx electron-builder --linux` | ❌ Wave 0 |
| FND-01 | Build produces executable for target platform | e2e (CI) | `npm run build` succeeds | ❌ Wave 0 |
| FND-02 | contextBridge exposes typed electronAPI | unit | `npx vitest run src/renderer/hooks/useElectronAPI.test.ts` | ❌ Wave 0 |
| FND-03 | IPC channels validate with Zod schemas | unit | `npx vitest run src/shared/validators/` | ❌ Wave 0 |
| FND-04 | React.lazy() + Suspense infrastructure exists | unit | `npx vitest run src/renderer/components/viewers/` | ❌ Wave 0 |
| FND-05 | Dark theme CSS properties applied | visual (manual) | Manual check in Electron window | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=dot` (quick smoke test)
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/main/index.test.ts` — verify BrowserWindow config has correct security flags
- [ ] `src/shared/validators/app.test.ts` — verify Zod schemas accept/reject correct payloads
- [ ] `src/renderer/hooks/useElectronAPI.test.ts` — verify typed wrapper works (mock contextBridge)
- [ ] `src/renderer/components/viewers/ViewerRegistry.test.ts` — verify registry maps types correctly, suspense boundary exists
- [ ] `vitest.config.ts` — framework install/configuration if not scaffolded
- [ ] Setup Playwright for E2E tests (Phase 1 can skip — add in Phase 2 when there's UI to test)

## Security Domain

> `security_enforcement` is enabled (true in config.json). This section is required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schemas on every IPC channel — validate both input params and return type |
| V6 Cryptography | no | No cryptographic operations in Phase 1 scope |
| V8 File I/O | partial | File paths handled in main process only; renderer has no filesystem access |
| V9 Communication Security | partial | IPC channels are internal (same machine); WebSocket in Phase 3 |
| V14 Configuration | yes | BrowserWindow security flags must never be weakened |

### Security Requirements Specific to Phase 1

| Security Control | Where Enforced | Verification |
|-----------------|----------------|--------------|
| `contextIsolation: true` | `src/main/index.ts` — BrowserWindow config | CI lint check parsing the file |
| `sandbox: true` | `src/main/index.ts` — BrowserWindow config | CI lint check parsing the file |
| `nodeIntegration: false` | `src/main/index.ts` — BrowserWindow config | CI lint check parsing the file |
| Single audited preload file | `src/preload/index.ts` — no other preload files allowed | Code review: check no second `exposeInMainWorld` call |
| No `dangerouslySetInnerHTML` | Phase 1 has no renderers using this (Phase 2 concern) | ESLint rule: `react/no-danger` |
| No `ipcRenderer.sendSync` | Preload bridge — only expose `invoke()` | Code review: preload file grep for `sendSync` |
| CSP for renderer | BrowserWindow `webPreferences` or meta tag | Verify CSP blocks inline scripts |
| No eval in production | BrowserWindow config: `webSecurity: true` | Default in Electron, verify not overridden |

### Known Threat Patterns for Electron

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via untrusted artifact content | Tampering | Sandboxed renderer (`sandbox: true`), no `nodeIntegration`, no `contextBridge` from renderer |
| IPC injection (malformed channel payloads) | Tampering | Zod schema validation on every IPC handler |
| Path traversal (file system access) | Information Disclosure | File operations in main process only; renderer has no direct file access |
| Prompt injection via artifact → RCE | Elevation of Privilege | `contextIsolation: true` prevents renderer XSS from reaching Node.js |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — Electron 42.4.0, electron-vite 5.0.0, React 19.2.7, Tailwind CSS 4.3.0, Zod 4.4.3, TypeScript 6.0.3, Vite 8.0.16, electron-builder 26.15.2 versions confirmed via `npm view`
- [VERIFIED: npm registry] — Package legitimacy audit via `gsd-tools query package-legitimacy check`
- [VERIFIED: npm registry] — Postinstall script audit via `npm view <pkg> scripts.postinstall`
- [CITED: Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security) — contextIsolation, sandbox, nodeIntegration
- [CITED: Electron IPC Guide](https://www.electronjs.org/docs/latest/tutorial/ipc) — contextBridge patterns
- [CITED: Tailwind CSS v4 documentation](https://tailwindcss.com/docs/theme) — @theme directive
- [CITED: React.lazy + Suspense](https://react.dev/reference/react/lazy) — Code splitting pattern
- [VERIFIED: Obsidianite reference] — `~/code/CUSTOM_AI_Coding_Agent/01_Intro/Obsidianite/theme.css` — palette values extracted

### Secondary (MEDIUM confidence)
- [CITED: electron-vite official docs](https://electron-vite.org/guide/) — Scaffolding guide, build config
- [CITED: Zod v4 docs](https://zod.dev) — Schema validation patterns
- [CITED: electron-builder docs](https://www.electron.build) — AppImage/NSIS configuration
- [ASSUMED] — `@electron-toolkit/preload` and `@electron-toolkit/utils` convenience packages — valid utilities for preload/main bridges

### Tertiary (LOW confidence)
- [ASSUMED] — The exact scaffold output structure from `@quick-start/create-electron@1.0.30` — may differ from expectations. **Verification:** Run scaffold as first task and inspect output.
- [ASSUMED] — Vite 8.0.16 compatibility with electron-vite 5.0.0 — minor version bumps should be compatible but should be verified during scaffold task.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry; package legitimacy audited
- Architecture: HIGH — patterns from Electron official docs, well-established React/Zod patterns
- Pitfalls: HIGH — specific to Phase 1 scope, based on documented Electron security and performance patterns
- Obsidianite palette: HIGH — values directly extracted from reference file

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (30 days for stable packages; Electron and npm packages may have minor point releases but major version changes are unlikely in 30 days)
