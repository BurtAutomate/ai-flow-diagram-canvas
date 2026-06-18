# Phase 2: Core Artifact Viewing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 2-Core Artifact Viewing
**Areas discussed:** View Mode Switching UX, Tab Bar Behavior, File Browser Structure, Artifact Loading Strategy

---

## View Mode Switching UX

| Option | Description | Selected |
|--------|-------------|----------|
| Segmented control button group | 3-button group at top of viewer. Always visible, one-click switch. Fits alongside tab bar in chrome area. | ✓ |
| Dropdown menu | Dropdown selector. Cleaner but adds extra click. | |
| Keyboard shortcut + minimal button | Minimal toggle button, power users use shortcut. Cleanest UI but less discoverable. | |

**User's choice:** Segmented control button group with keyboard shortcut (customizable keybinds)
**Notes:** User emphasized discoverability and keyboard customization.

| Option | Description | Selected |
|--------|-------------|----------|
| 50/50 default | Equal halves, predictable, symmetrical | ✓ |
| 60/40 preview-first | Emphasizes preview-first philosophy | |
| Remember last ratio per-tab | Needs Zustand persistence | |

**User's choice:** 50/50 default

| Option | Description | Selected |
|--------|-------------|----------|
| Per-tab | Each tab remembers its own mode | |
| Global | One mode for all tabs | ✓ |
| Per-tab with global toggle override | Max flexibility, more complex UI | |

**User's choice:** Global mode for all tabs

---

## Tab Bar Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scrolling | Tabs shrink to min-width then scroll arrows | |
| Shrinking tabs | All tabs visible, proportionally shrink | |
| Dropdown overflow menu | Tabs fill bar, overflow into » menu | ✓ |

**User's choice:** Tabs shrink to min-width, then overflow into dropdown (» menu)

| Option | Description | Selected |
|--------|-------------|----------|
| Close on hover + drag reorder | Like VS Code | |
| Always visible close + no reorder | Simpler, no DnD overhead | |
| Always visible close + drag reorder | Max flexibility | ✓ |

**User's choice:** Always visible close button + drag reorder

| Option | Description | Selected |
|--------|-------------|----------|
| No limit | User opens what they want | |
| Soft limit (warning at 20) | Warns without blocking | |
| Hard limit at 30 | Prevents memory issues | |

**User's choice:** Hard limit at 5 open tabs with an Artifact Index page listing artifacts
**Notes:** User wants an index-style hub where artifacts are listed and clicking opens as a tab.

---

## File Browser Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Tree view | Standard expand/collapse file tree | ✓ |
| Flat list | Only viewable extensions, no directories | |
| Hybrid with breadcrumb | Flat contents with breadcrumb drill-down | |

**User's choice:** Tree view with expand/collapse

| Option | Description | Selected |
|--------|-------------|----------|
| Hide dotfiles by default | VS Code/File Explorer behavior | |
| Only viewable types | Only files this app can render | |
| Show all including dotfiles | No filtering | ✓ |

**User's choice:** Show all files including dotfiles

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-reveal on tab switch | Scroll tree to current file | ✓ |
| Manual navigation only | Tree stays independent | |

**User's choice:** Auto-reveal on tab switch
**Notes:** User specified default root = project root where CLI agent started. Grayed-out unsupported file types with tooltip referencing Phase 4.

---

## Artifact Loading Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| IPC read via main process | Secure, respects process separation | ✓ |
| File System Access API | No IPC needed, limited Electron integration | |
| Direct renderer fs access | Security downgrade | |

**User's choice:** IPC read via main process (consistent with Phase 1 security model)

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner + full read | Simple, no streaming | |
| Virtualized rendering | Windowed for large files | ✓ |
| Size cap with warning | User decides per large file | |

**User's choice:** Best practice approach — skeleton screens (consistent with Phase 1 D-11) for loading, virtualized windowed rendering for files over 1MB, no hard size cap.

---

## the agent's Discretion

- Specific Shiki configuration (theme selection, language registration)
- Specific drag-and-drop library for tab reordering
- Specific markdown rendering library
- Arrow key navigation for file tree (standard behavior assumed)
- File browser node_modules exclusion (project-standard .gitignore respect assumed)

## Deferred Ideas

- Agent-triggered artifact opening — Phase 3
- PDF viewer, SVG viewer, HTML sandbox, Mermaid renderer — Phase 4
- Drag-and-drop files from OS into app — future consideration
- Search/filter in file browser — future enhancement
