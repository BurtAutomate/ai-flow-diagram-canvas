import { create } from 'zustand'

export interface FileTreeEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  children?: FileTreeEntry[]
}

// File types that can be viewed in Phase 2
const VIEWABLE_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.svg',
  '.json', '.md', '.py', '.rb', '.go', '.rs', '.sh', '.bash',
  '.yml', '.yaml', '.toml', '.xml', '.sql',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp',
])

// File types deferred to Phase 4
const PHASE4_EXTENSIONS = new Set([
  '.pdf', '.html',
])

export function getFileType(fileName: string): 'viewable' | 'phase4' | 'unsupported' {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return 'unsupported'
  if (VIEWABLE_EXTENSIONS.has(`.${ext}`)) return 'viewable'
  if (PHASE4_EXTENSIONS.has(`.${ext}`) || fileName.endsWith('.svg')) return 'phase4'
  return 'unsupported'
}

interface FileBrowserState {
  rootPath: string | null
  expandedPaths: Set<string>
  activeFilePath: string | null
  tree: FileTreeEntry[]
  isLoading: boolean
  setRootPath: (path: string) => void
  setTree: (tree: FileTreeEntry[]) => void
  toggleExpand: (path: string) => void
  setActiveFile: (path: string | null) => void
  setLoading: (loading: boolean) => void
  isExpanded: (path: string) => boolean
  loadDirectory: (dirPath: string, entries: FileTreeEntry[]) => void
  loadChildren: (parentPath: string, entries: FileTreeEntry[]) => void
}

export const useFileBrowserStore = create<FileBrowserState>((set, get) => ({
  rootPath: null,
  expandedPaths: new Set(),
  activeFilePath: null,
  tree: [],
  isLoading: false,

  setRootPath: (path) => set({ rootPath: path }),

  setTree: (tree) => set({ tree }),

  toggleExpand: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedPaths: next }
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  setLoading: (loading) => set({ isLoading: loading }),

  isExpanded: (path) => get().expandedPaths.has(path),

  loadDirectory: (dirPath, entries) =>
    set((state) => {
      const existing = (parent: FileTreeEntry[]): FileTreeEntry[] =>
        parent.map((entry) => {
          if (entry.path === dirPath && entry.isDirectory) {
            return { ...entry, children: entries }
          }
          if (entry.children) {
            return { ...entry, children: existing(entry.children) }
          }
          return entry
        })

      if (state.rootPath === dirPath) {
        return { tree: entries }
      }
      return { tree: existing(state.tree.length > 0 ? state.tree : entries) }
    }),

  loadChildren: (parentPath, entries) =>
    set((state) => {
      const updateTree = (nodes: FileTreeEntry[]): FileTreeEntry[] =>
        nodes.map((node) => {
          if (node.path === parentPath && node.isDirectory) {
            return { ...node, children: entries }
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) }
          }
          return node
        })
      return { tree: updateTree(state.tree) }
    }),
}))
