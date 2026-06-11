# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 1-Foundation
**Areas discussed:** Project scaffolding, IPC channel design, Dark theme & Obsidianite, Lazy-loading strategy

---

## Project Scaffolding

| Option | Description | Selected |
|--------|-------------|----------|
| Quick-start template | `npm create @quick-start/electron@latest` — correct main/preload/renderer split, HMR, PostCSS | ✓ |
| Manual setup | Full control over every config file | |

**User's choice:** Quick-start template — with explicit note to confirm latest versions (June 2026: Electron 42.4.0, electron-vite 5.0.0, React 19.2.7, Tailwind CSS 4.3.0)
**Notes:** User wants latest versions verified at build time.

| Option | Description | Selected |
|--------|-------------|----------|
| Feature-based | Group by Electron layer then by feature | |
| Layer-first | electron-vite defaults — src/main, src/preload, src/renderer | ✓ |

**User's choice:** Layer-first structure

| Option | Description | Selected |
|--------|-------------|----------|
| Linux only | AppImage/DEB | |
| Linux + macOS | AppImage + DMG | |
| All three | Linux + macOS + Windows | |
| Linux + Windows | AppImage/DEB + NSIS | ✓ |

**User's choice:** Linux + Windows v1, macOS later

| Option | Description | Selected |
|--------|-------------|----------|
| ai-agent-studio | npm-style name | |
| com.aistudio.app | Reverse-domain appId | |

**User's choice:** Renamed project to **AI CLI Studio** — package name `ai-cli-studio`

---

## IPC Channel Design

| Option | Description | Selected |
|--------|-------------|----------|
| Namespaced router | Single `ipcMain.handle()` with `namespace:action` routing, one file per namespace | ✓ |
| Per-channel handlers | Separate `ipcMain.handle()` calls in central file | |

**User's choice:** Namespaced router (after agent recommended it as best practice)

| Option | Description | Selected |
|--------|-------------|----------|
| One schema per channel | Each IPC channel has its own Zod schema | ✓ |
| Shared mega-schema | Single discriminated union schema | |

**User's choice:** One Zod schema per channel

| Option | Description | Selected |
|--------|-------------|----------|
| Namespaced contextBridge | Single `exposeInMainWorld('electronAPI', { artifact: {...}, fs: {...}, app: {...} })` | ✓ |
| Per-module bridges | Multiple `exposeInMainWorld()` calls | |

**User's choice:** Namespaced contextBridge

---

## Dark Theme & Obsidianite

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind dark mode | `dark:` variant + CSS custom properties via `@theme` | ✓ |
| Pure CSS custom properties | Framework-agnostic, more verbose | |

**User's choice:** Let agent decide. Agent chose Tailwind dark mode.

| Option | Description | Selected |
|--------|-------------|----------|
| Inspired palette | Extract key color values from Obsidianite, adapt for code viewing | ✓ |
| Full Obsidianite port | Match exact colors — warmer/sepia tones | |
| Custom dark theme | Build from scratch, Obsidianite as mood board | |

**User's choice:** Inspired palette

| Option | Description | Selected |
|--------|-------------|----------|
| Single accent + semantic | Teal/blue accent + green/amber/red semantic colors | ✓ |
| Multi-accent palette | Several user-selectable accents | |

**User's choice:** Single accent + semantic colors

---

## Lazy-Loading Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Per viewer | Individual React.lazy() per CodeViewer, MarkdownViewer, etc. | ✓ |
| Per group | Group viewers by category | |

**User's choice:** Per viewer

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton screens | Shimmer skeleton matching viewer layout | ✓ |
| Spinner + label | Simple loading spinner | |

**User's choice:** Skeleton screens

| Option | Description | Selected |
|--------|-------------|----------|
| On tab open | Trigger React.lazy() when artifact tab opens | ✓ |
| On app start | Preload viewer bundles after app loads | |

**User's choice:** On tab open

---

## Agent's Discretion
- Tailwind dark mode implementation approach (CSS variables vs `dark:` class)
- Specific skeleton screen designs
- CI tooling choice

## Deferred Ideas
None.
