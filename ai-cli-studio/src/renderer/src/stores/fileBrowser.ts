import { create } from 'zustand'

export interface FileTreeEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  children?: FileTreeEntry[]
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
}))
