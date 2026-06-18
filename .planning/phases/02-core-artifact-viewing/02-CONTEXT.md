# Phase 2: Core Artifact Viewing - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the primary visual workspace: a tabbed, preview-first artifact viewer with code, markdown, and image renderers, plus a file browser sidebar for artifact discovery. Builds on Phase 1's ViewerRegistry, IPC infrastructure, dark theme, and lazy-loading skeleton screens.

Requirements: UI-01 (preview-first toggle), UI-02 (side-by-side split pane), UI-03 (multi-tab artifacts), UI-04 (file browser), RND-01 (Shiki code highlighting), RND-02 (Obsidianite-themed markdown), RND-04 (inline images), ST-01 (Zustand stores).

</domain>

<decisions>
## Implementation Decisions

### View Mode Switching (UI-01, UI-02)
- **D-01:** Segmented control button group in the chrome area for toggling between preview-only, code-only, and side-by-side modes. Always visible, one-click switch.
- **D-02:** Global view mode — switching affects all tabs simultaneously. Not per-tab.
- **D-03:** Keyboard shortcut (Ctrl+Shift+V or similar) to cycle modes, with user-customizable keybinds.
- **D-04:** Default split ratio 50/50, equal halves. No per-tab persistence of split position.
- **D-05:** Draggable resize handle between panes in side-by-side mode.

### Tab Bar Behavior (UI-03)
- **D-06:** Tab close button (×) always visible on every tab.
- **D-07:** Drag-to-reorder tabs using a drag library (dnd-kit or similar).
- **D-08:** Hard limit of 5 open artifact tabs.
- **D-09:** Artifact Index page serves as the hub — lists artifacts, clicking opens as a tab.
- **D-10:** Overflow behavior: tabs shrink to a fixed min-width, then remaining overflow tabs go into a dropdown (») menu.

### File Browser Structure (UI-04)
- **D-11:** Default root folder is the project directory where the CLI agent started.
- **D-12:** Tree view with expand/collapse arrows on directories.
- **D-13:** Show all files including dotfiles — no extension filtering.
- **D-14:** Auto-reveal: when switching artifact tabs, the file browser scrolls to reveal that file's location in the tree.
- **D-15:** Non-viewable file types (PDF, SVG, HTML, etc.) appear grayed in the tree with a tooltip: "Viewer not available — planned for Phase 4". Not clickable.

### Artifact Loading Strategy
- **D-16:** File content loaded via IPC `fs:readFile` channel through the main process (consistent with Phase 1 security model).
- **D-17:** Skeleton screens (CodeSkeleton / MarkdownSkeleton, existing from Phase 1) shown while IPC read is in flight — not spinners (consistent with Phase 1 D-11).
- **D-18:** For files over 1MB, use virtualized/windowed rendering (only render visible lines). No hard file size cap.
- **D-19:** ViewerRegistry fallback for unsupported types already exists from Phase 1.

### Dependencies & Notes
- **D-20:** Requires new IPC channels: `fs:listDir`, `fs:readFile`, `fs:getFileInfo` — add to preload bridge with Zod validation.
- **D-21:** Zustand stores needed: artifactTabs (open tabs, active tab), uiState (view mode, split position), fileBrowser (tree state, expanded nodes, active path).
- **D-22:** Shiki for syntax highlighting — lazy-loaded per D-10 (React.lazy + Suspense).
- **D-23:** Markdown rendering library TBD by researcher/planner (e.g., react-markdown).

### the agent's Discretion
- Specific Shiki configuration (theme selection, language registration)
- Specific drag-and-drop library for tab reordering
- Specific markdown rendering library
- Arrow key navigation for file tree (standard behavior assumed)
- File browser node_modules exclusion (project-standard .gitignore respect assumed)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` §Artifact Rendering — RND-01, RND-02, RND-04
- `.planning/REQUIREMENTS.md` §UI — UI-01, UI-02, UI-03, UI-04
- `.planning/REQUIREMENTS.md` §State & Persistence — ST-01
- `.planning/ROADMAP.md` §Phase 2 — Phase goal, success criteria, dependencies

### Phase 1 Foundation
- `.planning/phases/01-foundation/01-CONTEXT.md` — All Phase 1 decisions (IPC pattern, lazy-loading, skeleton screens, dark theme)
- `.planning/phases/01-foundation/01-UI-SPEC.md` — Design system (color palette, typography, spacing, component specs)
- `.planning/research/SUMMARY.md` §Phase 1 — Research findings and stack recommendations (if available)

### Existing Code
- `ai-cli-studio/src/renderer/components/viewers/ViewerRegistry.ts` — Lazy-loading registry to extend
- `ai-cli-studio/src/renderer/src/components/ui/Skeleton.tsx` — CodeSkeleton/MarkdownSkeleton components
- `ai-cli-studio/src/renderer/src/assets/styles/globals.css` — Dark theme palette and skeleton animation
- `ai-cli-studio/src/preload/index.ts` — Preload bridge to extend with fs IPC channels
- `ai-cli-studio/src/shared/types/ipc.ts` — IPC channel constants to extend
- `ai-cli-studio/src/renderer/src/App.tsx` — Root component to modify
- `ai-cli-studio/src/shared/types/window.d.ts` — ElectronAPI type definitions to extend
- `ai-cli-studio/package.json` — Current dependencies (lucide-react, zod available)

### No external specs
All requirements captured in decisions above — no external SPEC.md or ADR files for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ViewerRegistry** (`src/renderer/components/viewers/ViewerRegistry.ts`) — Register `CodeViewer`, `MarkdownViewer`, `ImageViewer` via lazy-loaded definitions with skeleton fallbacks
- **CodeSkeleton + MarkdownSkeleton** (`src/renderer/src/components/ui/Skeleton.tsx`) — Existing skeleton components for loading states
- **Skeleton CSS** (`src/renderer/src/assets/styles/globals.css` line 61-71) — Shimmer animation ready
- **IconButton** (`src/renderer/src/components/ui/IconButton.tsx`) — For tab close buttons, chrome controls
- **useElectronAPI hook** (`src/renderer/src/hooks/useElectronAPI.ts`) — Pattern for IPC call hooks; extend for file system operations
- **Dark theme palette** (`src/renderer/src/assets/styles/globals.css`) — Color tokens for all surfaces
- **WelcomeScreen** (`src/renderer/src/components/WelcomeScreen.tsx`) — Current root view; replace with tabbed artifact view

### Established Patterns
- **Namespaced IPC** — `namespace:action` naming (`app:getVersion`, `window:minimize`). Extend with `fs:readFile`, `fs:listDir`
- **Zod-validated IPC** — One schema per channel. Apply to new fs channels
- **React.lazy + Suspense + Skeleton** — ViewerRegistry pattern for per-viewer lazy loading
- **Tailwind CSS 4 @theme** — Custom properties for all colors
- **Zustand** (from ST-01 requirement) — Use for artifactTabs, uiState, fileBrowser stores

### Integration Points
- `App.tsx` replaces `<WelcomeScreen />` with a new layout: file browser sidebar + tab bar + active viewer panel
- `ViewerRegistry` needs 3 viewer registrations (code/markdown/image) plus the 3 lazy-loaded components
- `preload/index.ts` needs `fs:listDir`, `fs:readFile`, `fs:getFileInfo` added to electronAPI
- `src/shared/types/ipc.ts` needs new IPC channel constants
- `src/shared/types/window.d.ts` needs fs methods added to ElectronAPI interface
- `src/main/ipc/` needs new handler modules for file system operations

</code_context>

<specifics>
## Specific Ideas

- File browser root = project root directory where CLI agent started
- Artifact Index page as the hub — no separate index screen; file browser IS the index
- 5-tab hard limit keeps the UI focused; overflow goes into a dropdown
- Grayed-out unsupported file types in the tree with Phase 4 tooltip — sets user expectations

</specifics>

<deferred>
## Deferred Ideas

- **Agent-triggered artifact opening** — Phase 3 (WebSocket API / Agent Communication)
- **PDF viewer, SVG viewer, HTML sandbox, Mermaid renderer** — Phase 4 (Advanced Artifacts)
- **Drag-and-drop files from OS into app** — future consideration (not in any phase yet)
- **Search/filter in file browser** — future enhancement (not scoped)

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Core Artifact Viewing*
*Context gathered: 2026-06-11*
