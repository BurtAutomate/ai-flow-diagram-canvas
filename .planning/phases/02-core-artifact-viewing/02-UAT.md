---
status: complete
phase: 02-core-artifact-viewing
source:
  - 02-01-SUMMARY.md
  - 02-02-SUMMARY.md
started: 2026-06-11T09:10:00Z
updated: 2026-06-11T09:15:00Z
---

## Current Test

[testing complete — 2 passed, 3 issues, 9 blocked]

## Tests

### 1. App launches with tabbed layout
expected: After `npm run dev`, app shows dark-themed window with sidebar placeholder, empty tab bar, view mode controls (Preview/Code/Split), and "No artifact open" Artifact Index placeholder.
result: pass

### 2. Tab bar opens and manages artifact tabs
expected: Clicking a viewable file in the sidebar opens a tab with that file's name. Tab shows close button on hover. Click another file → second tab. Click a tab to switch. Tab close removes the tab.
result: issue
reported: "No files to click — file browser sidebar is empty"
severity: major

### 3. Tab drag reorder
expected: Dragging a tab reorders it in the tab bar. Release places it at the new position.
result: blocked
blocked_by: prior-phase
reason: "File browser empty — no tabs to test drag reorder"

### 4. 5-tab hard limit and overflow dropdown
expected: Opening a 6th file does not add a new tab (max 5). When 5 tabs are open, tabs beyond the visible limit go into a dropdown (») menu.
result: blocked
blocked_by: prior-phase
reason: "File browser empty — no tabs to test limit"

### 5. View mode segmented control switches globally
expected: Clicking Code mode shows raw code in the viewer panel. Clicking Preview mode shows rendered preview. Side-by-side mode shows both panes. Switching mode affects all open tabs.
result: issue
reported: "Only the buttons toggle active state — viewer panel doesn't change because no file is open"
severity: minor

### 6. Side-by-side split pane with draggable resize handle
expected: In side-by-side mode, a vertical divider splits the viewer into preview (left) and code (right) panes. Dragging the divider resizes the split ratio. Default is 50/50.
result: blocked
blocked_by: prior-phase
reason: "No file open to see split pane behavior"

### 7. File browser shows sorted directory tree
expected: Sidebar shows project files in a tree with directories first (sorted alphabetically), then files (sorted alphabetically). Directories have expand/collapse chevron arrows.
result: issue
reported: "No files to click — file browser sidebar is empty"
severity: major

### 8. File browser expand/collapse and lazy loading
expected: Clicking a directory's chevron expands it, loading child files via IPC. Clicking again collapses it. Children appear indented under the parent.
result: blocked
blocked_by: prior-phase
reason: "No files displayed to expand"

### 9. Code viewer with Shiki syntax highlighting
expected: Opening a .ts/.js file shows syntax-highlighted code with dark-plus theme (dark background, color-coded keywords/strings/comments). Language is auto-detected from file extension.
result: blocked
blocked_by: prior-phase
reason: "Cannot open files — file browser empty"

### 10. Markdown viewer with Obsidianite styling
expected: Opening a .md file renders formatted markdown with Obsidianite-inspired dark styling: cyan accent links, styled headings, code blocks with dark background, tables rendered with GFM support.
result: blocked
blocked_by: prior-phase
reason: "Cannot open files — file browser empty"

### 11. Image viewer renders inline
expected: Opening a .png/.jpg/.gif/.svg file shows the image rendered inline in the viewer panel, centered with object-contain sizing.
result: blocked
blocked_by: prior-phase
reason: "Cannot open files — file browser empty"

### 12. Phase 4 file types grayed with tooltip
expected: PDF, HTML files appear grayed in the file browser with reduced opacity and a tooltip "Viewer not available — planned for Phase 4". They are not clickable.
result: blocked
blocked_by: prior-phase
reason: "No files displayed to verify grayed types"

### 13. Skeleton screens during loading
expected: When opening a file, the viewer shows a skeleton placeholder (not a spinner) while the file content loads via IPC.
result: blocked
blocked_by: prior-phase
reason: "Cannot open files — file browser empty"

### 14. Artifact Index placeholder when no tabs open
expected: When all tabs are closed, the viewer panel returns to the "No artifact open" state with the AI logo, title, and description text.
result: pass

## Summary

total: 14
passed: 2
issues: 3
pending: 0
skipped: 0
blocked: 9

## Gaps

- truth: "File browser sidebar shows project files in a sorted tree that users can click to open as tabs"
  status: failed
  reason: "User reported: No files to click — file browser sidebar is empty"
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "View mode segmented control switches viewer panel between Preview, Code, and Side-by-side rendering"
  status: failed
  reason: "User reported: Only the buttons toggle active state — viewer panel doesn't change because no file is open"
  severity: minor
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "File browser sidebar shows sorted directory tree with expand/collapse"
  status: failed
  reason: "User reported: No files to click — file browser sidebar is empty"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
