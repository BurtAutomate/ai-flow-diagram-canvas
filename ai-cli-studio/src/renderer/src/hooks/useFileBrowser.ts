import { useEffect, useCallback } from 'react'
import { useElectronAPI } from './useElectronAPI'
import { useFileBrowserStore } from '../stores/fileBrowser'

export function useFileBrowser() {
  const electronAPI = useElectronAPI()
  const rootPath = useFileBrowserStore((s) => s.rootPath)
  const setRootPath = useFileBrowserStore((s) => s.setRootPath)
  const setTree = useFileBrowserStore((s) => s.setTree)
  const setLoading = useFileBrowserStore((s) => s.setLoading)
  const loadChildren = useFileBrowserStore((s) => s.loadChildren)
  const toggleExpand = useFileBrowserStore((s) => s.toggleExpand)
  const isExpanded = useFileBrowserStore((s) => s.isExpanded)

  const initRoot = useCallback(async () => {
    if (rootPath) return
    setLoading(true)
    try {
      // Get the project root directory from the main process via IPC
      // (process.cwd() in the renderer returns the wrong path with contextIsolation)
      const cwd = await electronAPI.app.getCwd()
      setRootPath(cwd)
      const entries = await electronAPI.fs.listDir(cwd)
      setTree(entries)
    } catch {
      // Fallback: try home directory
      try {
        const entries = await electronAPI.fs.listDir('/home')
        setTree(entries)
      } catch {
        setTree([])
      }
    } finally {
      setLoading(false)
    }
  }, [electronAPI, rootPath, setRootPath, setTree, setLoading])

  const expandDirectory = useCallback(
    async (dirPath: string) => {
      toggleExpand(dirPath)
      if (!isExpanded(dirPath)) {
        try {
          const entries = await electronAPI.fs.listDir(dirPath)
          loadChildren(dirPath, entries)
        } catch {
          // ignore errors for unreadable directories
        }
      }
    },
    [electronAPI, toggleExpand, isExpanded, loadChildren]
  )

  useEffect(() => {
    initRoot()
  }, [initRoot])

  return {
    initRoot,
    expandDirectory,
  }
}
