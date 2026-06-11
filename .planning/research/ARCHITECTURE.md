# Architecture Research

**Domain:** Electron-based Canvas / Artifact Viewer for AI CLI Agents
**Researched:** 2026-06-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

The AI CLI Studio follows a **four-process Electron architecture** with a strict main/preload/renderer/utility split. The key structural insight is that long-running services (WebSocket server, MCP server) must NOT run in the main process — they belong in utility processes to keep the main process responsive for window lifecycle and IPC routing.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        UTILITY PROCESSES                             │
│                        (Node.js, isolated)                           │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │  WebSocket Server   │  │  MCP Server          │                   │
│  │  (ws package)       │  │  (@modelcontextpro-  │                   │
│  │                     │  │   tocol/sdk)         │                   │
│  │  • Artifact API     │  │                      │                   │
│  │  • Agent commands   │  │  • Tools: open,      │                   │
│  │  • Heartbeat/status  │  │    close, toggle     │                   │
│  └────────┬────────────┘  │  • Resources: state   │                   │
│           │               └────────┬─────────────┘                   │
│           │ MessagePort            │ MessagePort                     │
├───────────┴────────────────────────┴────────────────────────────────┤
│                           MAIN PROCESS                               │
│                           (Node.js)                                  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ App Lifecycle│  │ Window Mgr   │  │ IPC Handler Router       │   │
│  │ (app module) │  │ (BrowserWin) │  │ (namespaced channels)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                              │                       │
│  ┌──────────────┐  ┌──────────────┐          │                       │
│  │ File System  │  │ OS Dialogs   │          │                       │
│  │ Service      │  │ (native)     │          │                       │
│  └──────────────┘  └──────────────┘          │                       │
├──────────────────────────────────────────────┼────────────────────────┤
│                   PRELOAD SCRIPT             │                        │
│                   (contextBridge)            │                        │
│                                              │                        │
│  window.electronAPI = {                      │                        │
│    invoke(channel, args),                    │                        │
│    on(channel, callback),                    │                        │
│    artifact, app, mcp, fs namespaces        │                        │
│  }                                           │                        │
├──────────────────────────────────────────────┼────────────────────────┤
│                   RENDERER PROCESS            │                       │
│                   (React SPA, sandboxed)      │                       │
│                                               │                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    App Shell (Layout)                        │     │
│  │  ┌──────────┐  ┌───────────────────────┐  ┌──────────────┐  │     │
│  │  │ File     │  │   Artifact Canvas      │  │ Status Bar   │  │     │
│  │  │ Browser  │  │                       │  │ (connection)  │  │     │
│  │  │ (sidebar)│  │  ┌─────────────────┐  │  └──────────────┘  │     │
│  │  └──────────┘  │  │ Artifact Tabs   │  │                   │     │
│  │                │  ├─────────────────┤  │                   │     │
│  │                │  │ Artifact Viewer │  │                   │     │
│  │                │  │ (type-dispatched)│  │                   │     │
│  │                │  └─────────────────┘  │                   │     │
│  │                │                       │                   │     │
│  │  ┌───────────────────────────────┐     │                   │     │
│  │  │   Connection Panel            │     │                   │     │
│  │  │   (self-contained / connect)  │     │                   │     │
│  │  └───────────────────────────────┘     │                   │     │
│  └─────────────────────────────────────────┘                   │     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Zustand Stores                             │   │
│  │  useArtifactStore │ useConnectionStore │ useUIStore          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Main Process** | App lifecycle, window creation, IPC handler routing, file system access, OS dialogs | `src/main/` — Electron's `app`, `BrowserWindow`, `ipcMain`, `dialog` modules |
| **WebSocket Utility** | Runs the WebSocket server (self-contained mode) or manages outbound WS connection (agent-connected mode); parses artifact payloads | `src/ws-service/` — `ws` package, `MessageChannelMain` for IPC with main |
| **MCP Utility** | Exposes MCP server with tools (open artifact, close, toggle, list), resources (current state), and prompts | `src/mcp-service/` — `@modelcontextprotocol/sdk`, runs stdio+WebSocket transports |
| **Preload Script** | Secure bridge — exposes only whitelisted IPC methods to renderer via `contextBridge` | `src/preload/index.ts` — typed, minimal, audited |
| **Renderer (React)** | Sandboxed UI — artifact canvas, file browser, tabs, connection panel | `src/renderer/` — React 19 + Vite + Zustand |
| **IPC Handler Router** | Routes renderer requests to correct service, validates and serializes | `src/main/ipc/` — namespaced handlers per domain (artifact, fs, app, ws, mcp) |

## Recommended Project Structure

```
ai-cli-studio/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry, window creation
│   │   ├── app.ts                     # App lifecycle (ready, quit, activate)
│   │   ├── menu.ts                    # Application menu (file, edit, view, help)
│   │   ├── window.ts                  # BrowserWindow config & management
│   │   ├── ipc/                       # IPC handler registration
│   │   │   ├── index.ts              # Router: registers all handlers
│   │   │   ├── artifact.ts           # Artifact CRUD, tab management
│   │   │   ├── file-system.ts        # File read/write, directory tree
│   │   │   ├── app.ts               # App state, settings, window controls
│   │   │   ├── connection.ts         # WS server status, mode toggling
│   │   │   └── mcp.ts                # MCP server enable/disable, status
│   │   └── services/                 # Main process services (not utility)
│   │       ├── file-system.ts        # File/directory operations
│   │       └── settings.ts           # Persistent settings (electron-store)
│   │
│   ├── preload/                       # Preload scripts
│   │   └── index.ts                   # contextBridge.exposeInMainWorld('electronAPI', ...)
│   │
│   ├── ws-service/                    # Utility process: WebSocket
│   │   ├── index.ts                   # Entry: forks as utility process
│   │   ├── server.ts                  # WS server (self-contained mode)
│   │   ├── client.ts                  # WS client (agent-connected mode)
│   │   ├── protocol.ts               # Message types, serialization
│   │   ├── router.ts                 # Routes incoming messages to handlers
│   │   └── heartbeat.ts              # Connection keepalive
│   │
│   ├── mcp-service/                   # Utility process: MCP server
│   │   ├── index.ts                   # Entry: forks as utility process
│   │   ├── server.ts                  # MCP server setup (stdio + WS transports)
│   │   ├── tools.ts                   # Tool definitions (open, close, toggle, list, etc.)
│   │   ├── resources.ts              # Resource definitions (current state, tabs)
│   │   └── discovery.ts              # Auto-discovery file for agent detection
│   │
│   ├── shared/                        # Shared types, validators, constants
│   │   ├── types/                     # Artifact, Connection, Settings, IPC types
│   │   │   ├── artifact.ts           # ArtifactDef, ArtifactType, ViewMode
│   │   │   ├── ipc.ts                # IPC channel names, payload types
│   │   │   ├── connection.ts         # ConnectionMode, ServerInfo
│   │   │   └── protocol.ts           # WS protocol message types
│   │   ├── validators/               # Zod schemas for IPC validation
│   │   │   ├── artifact.ts
│   │   │   └── connection.ts
│   │   └── constants.ts              # Default port, channel names, limits
│   │
│   └── renderer/                      # React SPA (sandboxed, Vite-bundled)
│       ├── index.html
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root layout with shell
│       │
│       ├── store/                     # Zustand state stores
│       │   ├── artifact-store.ts      # Open artifacts, active tab, positions
│       │   ├── connection-store.ts    # Mode, status, server info
│       │   ├── ui-store.ts           # Sidebar visibility, theme, preferences
│       │   └── file-browser-store.ts  # File tree, expanded folders
│       │
│       ├── hooks/                     # React hooks
│       │   ├── useElectronAPI.ts      # Typed wrapper for window.electronAPI
│       │   ├── useArtifacts.ts        # Artifact operations hook
│       │   └── useConnection.ts       # Connection state hook
│       │
│       ├── components/                # UI components
│       │   ├── Shell/                 # App shell layout
│       │   │   ├── AppShell.tsx       # Main layout grid
│       │   │   ├── TitleBar.tsx       # Custom title bar (if frameless)
│       │   │   └── StatusBar.tsx      # Connection status, mode indicator
│       │   │
│       │   ├── ArtifactCanvas/        # Core artifact viewing area
│       │   │   ├── ArtifactCanvas.tsx  # Tab container + viewer area
│       │   │   ├── ArtifactTabs.tsx    # Tab bar (open, close, switch)
│       │   │   └── ArtifactViewport.tsx# Active artifact display area
│       │   │
│       │   ├── Viewers/               # Type-specific artifact viewers
│       │   │   ├── ViewerRegistry.tsx  # Maps type -> viewer component
│       │   │   ├── HtmlViewer.tsx      # Sandboxed HTML preview
│       │   │   ├── MarkdownViewer.tsx   # Obsidianite-themed markdown
│       │   │   ├── CodeViewer.tsx      # CodeMirror 6 + syntax highlighting
│       │   │   ├── ImageViewer.tsx     # PNG/JPG/GIF inline render
│       │   │   ├── PdfViewer.tsx       # Embedded PDF viewer
│       │   │   ├── TextViewer.tsx      # Plain text fallback
│       │   │   └── SvgViewer.tsx       # SVG inline render
│       │   │
│       │   ├── FileBrowser/           # File tree sidebar
│       │   │   ├── FileBrowser.tsx
│       │   │   ├── FileTree.tsx       # Recursive tree
│       │   │   └── FileEntry.tsx      # Single file/folder item
│       │   │
│       │   ├── ConnectionPanel/       # Connection management
│       │   │   ├── ConnectionPanel.tsx # Mode selector + status
│       │   │   ├── SelfHostedMode.tsx  # Start server, port config
│       │   │   └── AgentConnectMode.tsx# Host/port input, connect btn
│       │   │
│       │   └── shared/                # Reusable UI primitives
│       │       ├── Button.tsx
│       │       ├── Tooltip.tsx
│       │       ├── IconButton.tsx
│       │       └── Spinner.tsx
│       │
│       └── styles/                    # CSS / Tailwind
│           ├── globals.css
│           └── themes/
│               ├── obsidianite.css    # Markdown viewer theme
│               └── default.css
│
├── electron-builder.yml               # Distribution config
├── vite.config.ts                     # Vite config for renderer
├── electron.vite.config.ts            # electron-vite config
├── tsconfig.json                      # Root TS config
├── tsconfig.main.json                 # Main process TS config
├── tsconfig.preload.json              # Preload TS config
└── package.json
```

### Structure Rationale

- **`src/main/`:** Main process is Node.js-only. It owns window lifecycle, IPC routing, and delegates long-running work to utility processes. Never imports renderer code.
- **`src/preload/`:** A single audited file that defines the complete API surface between main and renderer. Every method is typed, validated, and minimal. Security boundary.
- **`src/ws-service/` and `src/mcp-service/`:** Separate utility processes — each can fail, restart, or be disabled independently without affecting the other or the UI. The `MessageChannelMain` API bridges them to the main process.
- **`src/shared/`:** Types and validators shared across all processes. Prevents IPC message mismatch. Zod schemas enforce runtime validation at the IPC boundary.
- **`src/renderer/`:** Standard React SPA structure. No direct Node.js access. All system interaction goes through `window.electronAPI` (preload bridge). Zustand stores are kept separate from components.
- **Viewers as a registry pattern:** Rather than a giant switch statement, the `ViewerRegistry` maps artifact types to viewer components. This makes Phase 2+ plugin architecture trivial — plugins register new viewers into the registry.

## Architectural Patterns

### Pattern 1: Process Isolation for Background Services

**What:** Run the WebSocket server and MCP server in Electron `utilityProcess` instances instead of the main process or renderer.

**When to use:** Any long-running service, network listener, or crash-prone component that doesn't need direct window access.

**Trade-offs:**
- **Pros:** Crash isolation — a WS crash doesn't take down the UI. Clear resource boundaries. Each service gets its own V8 heap. Restartable independently.
- **Cons:** More complex IPC (MessagePort instead of direct function calls). Slightly higher memory footprint per process. Must handle process lifecycle explicitly.

**Example:**
```typescript
// src/main/index.ts – spawning the WebSocket utility process
import { utilityProcess, MessageChannelMain } from 'electron'

const { port1, port2 } = new MessageChannelMain()
const wsProcess = utilityProcess.fork(
  path.join(__dirname, '../ws-service/index.js')
)

// Pass port2 to the utility process
wsProcess.postMessage({ type: 'init', port: config.wsPort }, [port2])

// port1 stays in main process — relay messages between WS service and renderer
port1.on('message', (event) => {
  const { type, payload } = event.data
  if (type === 'artifact:open') {
    mainWindow.webContents.send('artifact:open', payload)
  }
})
port1.start()
```

### Pattern 2: Dual-Mode Connection Strategy

**What:** The app supports two connection modes — self-contained (Electron runs the WS server) and agent-connected (agent runs the server, Electron is a client). The architecture abstracts this behind a unified connection interface.

**When to use:** Always — this is a core architectural feature, not an optimization.

**Trade-offs:**
- **Pros:** Works in both standalone and CI/headless agent workflows. Developer can run against a server they control during development. Users without access set up the server themselves.
- **Cons:** Two code paths to maintain. Need to handle reconnection, port conflicts, mode switching at runtime.

**Example:**
```typescript
// src/ws-service/index.ts – unified connection interface
type ConnectionMode = 'self-contained' | 'agent-connected'

interface ConnectionConfig {
  mode: ConnectionMode
  port?: number        // self-contained: port to listen on
  host?: string        // agent-connected: host to connect to
  agentPort?: number   // agent-connected: port to connect to
}

async function startConnection(config: ConnectionConfig) {
  if (config.mode === 'self-contained') {
    const server = new WebSocketServer({ port: config.port ?? 9170 })
    // Notify main process of server start
    process.parentPort.postMessage({ type: 'status', status: 'listening', port: config.port })
  } else {
    const client = new WebSocket(`ws://${config.host}:${config.agentPort}`)
    client.on('open', () => {
      process.parentPort.postMessage({ type: 'status', status: 'connected' })
    })
    client.on('close', () => {
      process.parentPort.postMessage({ type: 'status', status: 'disconnected' })
    })
  }
}
```

### Pattern 3: Namespaced IPC with Zod Validation

**What:** Every IPC channel is namespaced (e.g., `artifact:open`, `fs:read-file`) and all messages are validated with Zod schemas at the main process boundary.

**When to use:** Always — prevents the renderer from sending invalid data to the main process, which is the most common Electron security flaw.

**Trade-offs:**
- **Pros:** Type safety across process boundary. Schema-as-documentation. Automatic error messages on mismatch. Prevents half the OWASP Electron attack surface.
- **Cons:** Boilerplate per channel. Slight runtime validation overhead (negligible).

**Example:**
```typescript
// src/main/ipc/artifact.ts
import { ipcMain } from 'electron'
import { z } from 'zod'

const OpenArtifactSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['html', 'markdown', 'code', 'image', 'pdf', 'svg', 'text']),
  title: z.string().min(1).max(200),
  content: z.string(),
  language: z.string().optional(),
})

export function registerArtifactIPC(services: Services) {
  ipcMain.handle('artifact:open', async (event, payload) => {
    const parsed = OpenArtifactSchema.parse(payload)
    // forward to WebSocket utility process
    services.wsService.send({ type: 'artifact:open', payload: parsed })
    // update internal state
    return { success: true, id: parsed.id }
  })

  ipcMain.handle('artifact:close', async (event, artifactId: string) => {
    // ...
  })
}
```

### Pattern 4: Viewer Registry (Strategy Pattern)

**What:** A registry that maps artifact type strings to React viewer components. New viewers register themselves, and the `ArtifactViewport` dispatches to the correct one.

**When to use:** When you have multiple artifact types with different rendering needs. Essential for the Phase 2+ plugin architecture.

**Trade-offs:**
- **Pros:** No giant switch statement. Plugins add viewers by registering. Each viewer is isolated and independently testable.
- **Cons:** Requires registry infrastructure. Dynamic imports can make bundling trickier.

**Example:**
```typescript
// src/renderer/components/Viewers/ViewerRegistry.tsx
import { ComponentType, LazyExoticComponent, lazy } from 'react'

interface ViewerDefinition {
  type: ArtifactType | string
  component: LazyExoticComponent<ComponentType<ViewerProps>>
  priority?: number  // lower = higher priority for matching
}

class ViewerRegistry {
  private viewers: Map<string, ViewerDefinition> = new Map()

  register(type: string, def: ViewerDefinition) {
    this.viewers.set(type, def)
  }

  getViewer(type: string): LazyExoticComponent<ComponentType<ViewerProps>> {
    const def = this.viewers.get(type)
    if (!def) return this.viewers.get('text')!  // fallback
    return def.component
  }
}

export const viewerRegistry = new ViewerRegistry()

// Built-in registrations
viewerRegistry.register('html', {
  type: 'html',
  component: lazy(() => import('./HtmlViewer')),
})
viewerRegistry.register('markdown', {
  type: 'markdown',
  component: lazy(() => import('./MarkdownViewer')),
})
// ... etc
```

### Pattern 5: Tab-Based Artifact State Management

**What:** Each open artifact lives in a Zustand store as a tab with its own view mode state, position, and content. The store is the single source of truth for what's open.

**When to use:** Always — multiple open artifacts is a core requirement.

**Trade-offs:**
- **Pros:** Clear state model. Easy to persist/restore tabs. Each tab is independant.
- **Cons:** Need to handle tab lifecycle (close, reorder, max tabs, memory).

**Example:**
```typescript
// src/renderer/store/artifact-store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface ArtifactTab {
  id: string
  title: string
  type: ArtifactType
  viewMode: 'preview' | 'code' | 'split'
  content: string
  language?: string
  lastAccessed: number
}

interface ArtifactState {
  tabs: ArtifactTab[]
  activeTabId: string | null
  maxTabs: number

  openArtifact: (artifact: ArtifactDef) => void
  closeArtifact: (id: string) => void
  setActiveTab: (id: string) => void
  setViewMode: (id: string, mode: ViewMode) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
}

export const useArtifactStore = create<ArtifactState>()(
  immer((set) => ({
    tabs: [],
    activeTabId: null,
    maxTabs: 20,

    openArtifact: (artifact) =>
      set((state) => {
        // If already open, just switch to it
        const existing = state.tabs.find((t) => t.id === artifact.id)
        if (existing) {
          state.activeTabId = artifact.id
          return
        }
        // Enforce max tabs (close least recently used)
        if (state.tabs.length >= state.maxTabs) {
          const lru = [...state.tabs].sort(
            (a, b) => a.lastAccessed - b.lastAccessed
          )[0]
          state.tabs = state.tabs.filter((t) => t.id !== lru.id)
        }
        state.tabs.push({ ...artifact, viewMode: 'preview', lastAccessed: Date.now() })
        state.activeTabId = artifact.id
      }),

    closeArtifact: (id) =>
      set((state) => {
        state.tabs = state.tabs.filter((t) => t.id !== id)
        if (state.activeTabId === id) {
          state.activeTabId = state.tabs[state.tabs.length - 1]?.id ?? null
        }
      }),
    // ...
  }))
)
```

### Pattern 6: Plugin/Slot Architecture (Phase 2+)

**What:** A slot-based plugin system where extensions register React components for named UI slots (e.g., `toolbox:sidebar`, `viewer:custom-type`). Built on Zustand for reactive plugin state.

**When to use:** Phase 2 — the extensible toolbox platform. Not needed for MVP.

**Trade-offs:**
- **Pros:** True extensibility without modifying core. Third-party developers write plugins. Slots are explicit contract points.
- **Cons:** Significant upfront design. Overhead if only used internally. Must define stable slot API before plugins exist.

**Example:**
```typescript
// src/renderer/plugin/plugin-system.ts
interface PluginManifest {
  id: string
  name: string
  version: string
  slots: PluginSlot[]
}

interface PluginSlot {
  name: string
  component: React.ComponentType<SlotProps>
  targetArea: 'sidebar' | 'viewer' | 'toolbar' | 'statusbar'
}

class PluginManager {
  private store: PluginStore

  register(manifest: PluginManifest, slots: PluginSlot[]) {
    slots.forEach((slot) => {
      this.store.addExtension(slot.targetArea, {
        pluginId: manifest.id,
        slotName: slot.name,
        component: slot.component,
      })
    })
  }
}
```

## Data Flow

### Request Flow (Agent Opens Artifact via WebSocket)

```
[AI CLI Agent]
    │
    │ JSON-RPC over WebSocket
    │ { method: "artifact/open", params: { id, type, title, content } }
    ▼
[WebSocket Utility Process]
    │
    │ Validates payload, routes to handler
    │ Notifies main process via MessagePort
    ▼
[Main Process — IPC Router]
    │
    │ Validates with Zod schema
    │ Updates internal artifact state
    │ Forwards to renderer via webContents.send('artifact:open', payload)
    ▼
[Preload Bridge]
    │
    │ Passes through (no transformation needed)
    ▼
[Renderer — artifact-store.ts]
    │
    │ Zustand store: adds tab, sets active
    │ Triggers re-render: ArtifactTabs updates
    ▼
[React Component Tree]
    │
    │ ArtifactCanvas → ArtifactTabs + ArtifactViewport
    │ ArtifactViewport → viewerRegistry.getViewer(type) → <HtmlViewer />
    ▼
[User Sees Artifact]
```

### Connection Lifecycle

```
[App Start]
    │
    ▼
[Main Process — app.ts]
    │
    │ Spawns WS Utility Process (always, for heartbeat)
    │ Spawns MCP Utility Process (if enabled in settings)
    │
    ├── [SELF-CONTAINED MODE]───────────────┐
    │   WS Utility starts WebSocketServer    │
    │   on configured port (default: 9170)   │
    │   Waits for agent connections          │
    │                                        │
    ├── [AGENT-CONNECTED MODE]──────────────┐
    │   WS Utility starts as client          │
    │   Connects to agent's WS server        │
    │   Reconnects on disconnect (exponential│
    │   backoff)                             │
    │                                        │
    └────────────────────────────────────────┘
    │
    ▼
[Agent Connects/Sends Artifact]
    │
    ▼
[Artifact flows through pipeline above]
```

### State Management

```
[Main Process Store]  ──── (source of truth for settings, filesystem)
    │
    │ IPC: state sync via preload bridge
    │ Libraries: electron-store for persistence
    ▼
[Renderer Zustand Stores]
    │
    ├── useArtifactStore    — tabs[], activeTabId, viewModes
    ├── useConnectionStore  — mode, status, host, port
    ├── useUIStore          — sidebar open, theme, prefs
    └── useFileBrowserStore — tree, expanded, selected file
    │
    │ Components subscribe to specific slices (prevents re-renders)
    ▼
[React Components]
```

### Key Data Flows

1. **Agent → Artifact Flow:** Agent sends JSON-RPC over WS → WS Utility Process validates → Main process forwards → Renderer adds tab → Viewer component renders content. End-to-end latency target: <50ms for tab creation, <500ms for content rendering.

2. **User → File Browser Flow:** User clicks file tree → renderer calls `window.electronAPI.invoke('fs:read-dir', path)` → Preload serializes → Main process reads filesystem → Returns file list → Zustand store updates → Tree re-renders.

3. **Agent → MCP Tool Flow:** Agent calls MCP tool `studio_open_artifact` → MCP Utility Process receives → Forwards to Main → Main opens artifact → Sends event to Renderer → Renderer updates. Response goes back through MCP server with success/failure.

4. **Mode Switch Flow:** User toggles from self-contained to agent-connected → UI calls `connection:switch-mode` → Main kills WS utility process → Respans with new config → Updates connection status → UI shows new state.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1 user (personal tool) | Current architecture is correct and sufficient |
| 1-10 users (team sharing studio) | Add instance isolation — each user runs their own Electron instance. No server-side changes needed |
| 10-100 users (shared workspace) | Consider a headless server mode (Electron not needed). The WS protocol is already decoupled. Build a standalone WebSocket server that multiple studio instances connect to |

### Scaling Priorities

1. **First bottleneck: Tab memory.** 50+ large artifacts (especially HTML previews) can exhaust renderer memory. Mitigation: lazy-load inactive tab content, destroy preview iframes for background tabs, set `maxTabs` default to 20.

2. **Second bottleneck: IPC congestion.** Rapid artifact updates (e.g., streaming content) can flood IPC. Mitigation: use `requestAnimationFrame`-based throttling in renderer, batch updates from utility processes.

3. **Third: MCP server conflicts.** Multiple agents connecting to the same MCP server simultaneously. Mitigation: session isolation in MCP utility process, per-connection state.

## Anti-Patterns

### Anti-Pattern 1: Running the WebSocket Server in the Main Process

**What people do:** Starting the WS server directly in the main process because it's easier — just `new WebSocketServer()` in the main entry.

**Why it's wrong:** The main process is single-threaded and responsible for window lifecycle, menu events, and IPC routing. A busy WS server (many agents, high-frequency messages) blocks the event loop, causing UI lag, missed menu events, and unresponsive window operations.

**Do this instead:** Always fork WS and MCP servers into utility processes. The main process should be a thin router, not a server host.

### Anti-Pattern 2: Exposing Full Node.js to the Renderer

**What people do:** Setting `nodeIntegration: true` and `contextIsolation: false` for convenience, especially during prototyping.

**Why it's wrong:** This is the #1 security vulnerability in Electron apps. The renderer runs untrusted content (HTML previews, markdown with inline JS). Any XSS becomes a full RCE with Node.js access.

**Do this instead:** Keep `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`. Expose only specific IPC methods through the preload script. Validate all IPC payloads with Zod.

### Anti-Pattern 3: Giant IPC Switch Statement

**What people do:** A single `ipcMain.handle('*', ...)` handler that switches on channel name, or one monolithic handler file with all channel logic.

**Why it's wrong:** Impossible to test, easy to forget channels, hard to find bugs. The handler file grows unboundedly.

**Do this instead:** Namespaced handler files per domain (`artifact.ts`, `fs.ts`, `connection.ts`). Each exports a `register(services)` function. The IPC router imports and calls each one.

### Anti-Pattern 4: Direct Filesystem Access from Renderer

**What people do:** Reading/writing files directly in a React component using `node:fs` via the preload bridge.

**Why it's wrong:** File operations are blocking and slow. Doing them in the renderer (even with IPC) encourages patterns that block UI updates. Also conflates UI logic with I/O.

**Do this instead:** Filesystem operations go through the main process, which queues them and returns results async. The renderer should treat file operations as remote calls with latency.

### Anti-Pattern 5: Mixing Renderer and Main Code in Same Build

**What people do:** Using the same build configuration for main, preload, and renderer code, importing Node modules in renderer files.

**Why it's wrong:** The renderer code gets bundled with Node.js APIs that fail at runtime in a sandboxed environment. Main code gets browser globals it shouldn't have.

**Do this instead:** Separate build configs for main (target: node), preload (target: node, but sandbox-aware), and renderer (target: browser). Use `electron-vite` which handles this natively.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| AI CLI Agent (OpenCode, Claude Code, Codex) | WebSocket JSON-RPC — agent sends artifact payloads, control commands | Self-contained mode: agent connects to Electron's WS server. Agent-connected mode: Electron connects to agent's WS server |
| AI CLI Agent (via MCP) | MCP stdio or WebSocket transport — agent calls tools on Electron's MCP server | MCP must be disableable. Auto-discovery via `mcp.json` config file |
| Local Filesystem | `fs` module in main process — read/write files, directory tree | Never from renderer. Main process as file I/O proxy |
| OS (menus, notifications, dialogs) | Electron native APIs from main process | Used for file picker dialogs, notification toasts, system tray |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Main ↔ WS Utility Process | `MessageChannelMain` (MessagePort) | Bidirectional, structured messages. Ports passed at fork time |
| Main ↔ MCP Utility Process | `MessageChannelMain` (MessagePort) | Same pattern as WS service |
| Main → Renderer | `webContents.send(channel, data)` | Event streaming from main to renderer |
| Renderer → Main | `ipcRenderer.invoke(channel, args)` → `ipcMain.handle` | Request-response pattern. Preload bridge provides `window.electronAPI.invoke()` |
| WS Utility ↔ MCP Utility | Should NOT communicate directly | Both report to main process. Main coordinates cross-service actions |
| Renderer ↔ Renderer (multiple windows) | Via main process IPC relay | Don't share Zustand stores across windows. Sync through main |

## Build Order Implications

The component boundaries above dictate a dependency-based build order:

| Phase | What to Build | Depends On |
|-------|---------------|------------|
| **1. Electron Scaffold** | Main process, window creation, preload shell, renderer bootstrap, build config | Nothing |
| **2. IPC Foundation** | IPC router, namespaced handlers (app, artifact), Zod validation, preload bridge | Phase 1 |
| **3. Artifact Tab System** | Zustand store, ArtifactTabs, ArtifactCanvas, basic viewer switching | Phase 2 |
| **4. Core Viewers** | HtmlViewer, MarkdownViewer, CodeViewer (CodeMirror), ImageViewer, TextViewer | Phase 3 |
| **5. WebSocket Service** | WS utility process, protocol, dual-mode (server + client), connection UI | Phase 2 |
| **6. Agent Integration** | End-to-end artifact flow: agent → WS → main → renderer | Phases 4 + 5 |
| **7. File Browser** | File system IPC, FileTree component, file open integration | Phase 2 |
| **8. MCP Server** | MCP utility process, tools, resources, auto-discovery, disable toggle | Phase 5 |
| **9. PDF Viewer** | PDF viewer integration | Phase 4 |
| **10. Plugin System** | Slot/extension registry, plugin loading (Phase 2+) | Phase 3 |

**Key dependency:** Phase 5 (WebSocket) and Phase 8 (MCP) are independent — they can be built in parallel once the IPC foundation (Phase 2) is in place.

---

*Architecture research for: AI CLI Studio — Electron-based Canvas / Artifact Viewer for AI CLI Agents*
*Researched: 2026-06-11*
