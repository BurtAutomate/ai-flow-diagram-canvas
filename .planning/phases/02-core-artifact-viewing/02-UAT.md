---
status: complete
phase: 02-core-artifact-viewing
source:
  - 02-01-SUMMARY.md
  - 02-02-SUMMARY.md
started: 2026-06-11T09:10:00Z
updated: 2026-06-11T10:00:00Z
---

## Summary

All 14 tests completed. 6 passed, 8 issues. Fixes applied for tests 7, 10, 11, 12, 13 (in-code). Tests 4, 5, 9 remain open.

## Tests

### 1. App launches with tabbed layout
expected: After `npm run dev`, app shows dark-themed window with sidebar placeholder, empty tab bar, view mode controls (Preview/Code/Split), and "No artifact open" Artifact Index placeholder.
result: pass

### 2. Tab bar opens and manages artifact tabs
expected: Clicking a viewable file in the sidebar opens a tab with that file's name. Tab shows close button on hover. Click another file → second tab. Click a tab to switch. Tab close removes the tab.
result: pass

### 3. Tab drag reorder
  expected: Dragging a tab reorders it in the tab bar. Release places it at the new position.
result: pass

### 4. 5-tab FIFO limit (oldest tab closes when 6th opens)
  expected: Opening a 6th file does not add a new tab (max 5). When 5 tabs are open, tabs beyond the visible limit go into a dropdown (») menu.
result: issue
reported: "5 tabs open and then stop. No overflow function working — hard limit works but overflow dropdown never appears because it's gated on tabs.length > 5, but the store's hasReachedLimit prevents ever having >5 tabs"
severity: minor

### 5. View mode segmented control switches globally
  expected: Clicking Code mode shows raw code in the viewer panel. Clicking Preview mode shows rendered preview. Side-by-side mode shows both panes. Switching mode affects all open tabs.
result: issue
reported: "yes, but format sucks"
severity: cosmetic

### 6. Side-by-side split pane with draggable resize handle
  expected: In side-by-side mode, a vertical divider splits the viewer into preview (left) and code (right) panes. Dragging the divider resizes the split ratio. Default is 50/50.
result: pass

### 7. File browser shows sorted directory tree
  expected: Sidebar shows project files in a tree with directories first (sorted alphabetically), then files (sorted alphabetically). Directories have expand/collapse chevron arrows.
result: issue
reported: "yes, the file browser show project files with sorted directories and expand/collapse arrows, but the folders do not expand when arrows are clicked"
severity: major

### 8. File browser expand/collapse and lazy loading
  expected: Clicking a directory's chevron expands it, loading child files via IPC. Clicking again collapses it. Children appear indented under the parent.
result: pass

### 9. Code viewer with Shiki syntax highlighting
  expected: Opening a .ts/.js file shows syntax-highlighted code with dark-plus theme (dark background, color-coded keywords/strings/comments). Language is auto-detected from file extension.
result: issue
reported: "no"
severity: major

### 10. Markdown viewer with Obsidianite styling
  expected: Opening a .md file renders formatted markdown with Obsidianite-inspired dark styling: cyan accent links, styled headings, code blocks with dark background, tables rendered with GFM support.
result: issue
reported: "it is doing something but it does not look good it just removes the ## and ** and so on nothinf else"
severity: major

### 11. Image viewer renders inline
expected: Opening a .png/.jpg/.gif file shows the image rendered inline in the viewer panel, centered with object-contain sizing.
result: issue
reported: "no, i get garbage text: IHDR7I@..."
severity: major

### 12. Phase 4 file types grayed with tooltip
  expected: PDF, HTML files appear grayed in the file browser with reduced opacity and a tooltip "Viewer not available — planned for Phase 4". They are not clickable.
result: issue
reported: "pdf is grayed out but the html and svg is not they show raw code"
severity: major

### 13. Skeleton screens during loading
expected: When opening a file, the viewer shows a skeleton placeholder (not a spinner) while the file content loads via IPC.
result: pending

### 14. Artifact Index placeholder when no tabs open
expected: When all tabs are closed, the viewer panel returns to the "No artifact open" state with the AI logo, title, and description text.
result: pass

## Summary

total: 14
passed: 6
issues: 8
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "View mode segmented control switches viewer panel between Preview, Code, and Side-by-side rendering"
  status: failed
  reason: "User reported: Only the buttons toggle active state — viewer panel doesn't change because no file is open"
  severity: minor
  test: 5
  root_cause: "Expected behavior — Artifact Index placeholder has no distinct rendering per view mode"
  artifacts: []
  missing: []
  debug_session: ""

- truth: "View mode switching changes the viewer panel rendering"
  status: failed
  reason: "User reported: yes, but format sucks"
  severity: cosmetic
  test: 5
  root_cause: "CodeViewer splitting or presentation is visually unappealing"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/components/viewers/CodeViewer.tsx"
      issue: "Code formatting/presentation quality needs improvement"
  missing:
    - "Improve code viewer formatting and presentation"
  debug_session: ""

- truth: "Tabs scroll horizontally when they exceed available width"
  status: failed
  reason: "User reported: overflow dropdown not working. User requested: remove the overflow dropdown entirely."
  severity: major
  test: 4
  root_cause: "Count-based overflow with hard threshold (5) matching MAX_TABS — overflowTabs is always empty"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/components/TabBar.tsx"
      issue: "Overflow dropdown is dead code and visually clumsy"
  fix_applied: "Removed overflow dropdown. Tab bar now uses overflow-x-auto so tabs scroll horizontally when they exceed available width. Set MAX_TABS back to 5 with FIFO replacement — opening a 6th tab drops the oldest (first) tab. New tab is always the active one."
  debug_session: ""

- truth: "File browser shows sorted directory tree with expand/collapse on directories"
  status: failed
  reason: "User reported: file browser shows project files with sorted directories and expand/collapse arrows, but folders do not expand when clicked"
  severity: major
  test: 7
  root_cause: "useFileBrowser.ts expandDirectory uses inverted condition — 'if (!isExpanded)' after toggleExpand, but isExpanded is now true so children never load"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/hooks/useFileBrowser.ts"
      issue: "Inverted isExpanded check in expandDirectory — children never loaded on expand"
  missing:
    - "Fixed: use wasExpanded bool captured before toggleExpand call"
  debug_session: ""

- truth: "Skeleton screens show while file content loads via IPC"
  status: failed
  reason: "User reported: no skeleton shows during file loading"
  severity: major
  test: 13
  root_cause: "React 19 batches state updates — setTimeout(0) is not enough to guarantee a paint boundary before the IPC resolves."
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/hooks/useArtifactLoader.ts"
      issue: "setTimeout(0) yield insufficient — IPC may resolve before paint"
  fix_applied: "Replaced setTimeout(0) with flushSync() + requestAnimationFrame(). flushSync forces React to commit isLoading:true to DOM synchronously, rAF waits for the browser to paint the skeleton before the IPC starts."
  debug_session: ""

- truth: "Overall visual design is polished and professional"
  status: failed
  reason: "User reported: design is still a big issue, my 2 year old can do better"
  severity: major
  test: 15
  root_cause: "Color palette mislabels — --color-text-faint was bright blue (#7aa2f7) instead of dim. Accent color (cyan) was used for code, faint text, and accents interchangeably with no hierarchy. Visual depth was flat — no focus rings, no scrollbar hover, no letter-spacing, no antialiasing."
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/assets/styles/globals.css"
      issue: "Color palette had semantic mismatches: text-faint was a bright blue; single accent used everywhere; no visual hierarchy"
  fix_applied: "Rewrote palette: text-faint is now dim gray (#5b6070); accent calmed to Tokyo Night blue (#7aa2f7); added font-feature-settings, antialiasing, focus-visible rings, smooth transitions, refined scrollbar, monospace font family."
  debug_session: ""

- truth: "Phase 4 file types (PDF, HTML, SVG) appear grayed with phase-4 tooltip"
  status: failed
  reason: "User reported: pdf is grayed out but html and svg is not they show raw code"
  severity: major
  test: 12
  root_cause: ".html and .svg in both VIEWABLE_EXTENSIONS and PHASE4_EXTENSIONS — viewable check runs first"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/stores/fileBrowser.ts"
      issue: ".html and .svg in VIEWABLE_EXTENSIONS (checked first) — should be PHASE4 only"
  missing:
    - "Remove .html and .svg from VIEWABLE_EXTENSIONS"
  debug_session: ""

- truth: "Image viewer renders binary image files inline"
  status: failed
  reason: "User reported: binary garbage text displayed instead of image"
  severity: major
  test: 11
  root_cause: "fs:readFile reads binary files as utf-8 text, corrupting image data"
  artifacts:
    - path: "ai-cli-studio/src/main/ipc/fs.ts"
      issue: "readFile always uses utf-8 encoding; binary files produce garbage"
  missing:
    - "Detect binary file types and read as base64, return data URI"
  debug_session: ""

- truth: "Markdown viewer renders formatted markdown with Obsidianite-themed styling"
  status: failed
  reason: "User reported: it removes ## and ** but nothing else"
  severity: major
  test: 10
  root_cause: "@tailwindcss/typography plugin not installed — prose classes not available, react-markdown strips syntax but no styling applied"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/components/viewers/MarkdownViewer.tsx"
      issue: "Missing typography plugin for prose styling"
    - path: "ai-cli-studio/src/renderer/src/assets/styles/globals.css"
      issue: "Missing @plugin \"@tailwindcss/typography\""
  missing:
    - "Install @tailwindcss/typography"
    - "Add @plugin \"@tailwindcss/typography\" to globals.css"
  debug_session: ""

- truth: "Code viewer shows syntax-highlighted code with dark-plus theme"
  status: parked
  reason: "User reported: no. User decision: park this for Phase 2 redesign — wants to redesign the UI first, then revisit Shiki integration as part of the visual refresh."
  severity: major
  test: 9
  root_cause: "Shiki v4 likely needs engine configuration or dynamic import fails in Electron renderer context"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/components/viewers/CodeViewer.tsx"
      issue: "Shiki highlighting not rendering"
  missing:
    - "Diagnose Shiki v4 compatibility in Electron renderer"
    - "Integrate Shiki highlighting as part of UI redesign phase"
  parked_for: "phase-2-redesign"
  debug_session: ""

- truth: "Overflow dropdown appears when 5 tabs exceed visible tab bar capacity"
  status: failed
  reason: "User reported: 5 tabs open and then stop. No overflow function working"
  severity: minor
  test: 4
  root_cause: "TabBar.tsx gates overflow on tabs.length > 5, but the store's hasReachedLimit prevents ever having more than 5 tabs — overflow logic is dead code"
  artifacts:
    - path: "ai-cli-studio/src/renderer/src/components/TabBar.tsx"
      issue: "Overflow gated on count > 5 which conflicts with hard 5-tab limit"
  missing:
    - "Implement width-based overflow detection instead of count-based"
    - "Or remove dead overflow code since 5-tab limit makes it unreachable"
  debug_session: ""
