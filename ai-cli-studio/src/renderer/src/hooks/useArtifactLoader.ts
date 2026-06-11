import { useCallback } from 'react'
import { useElectronAPI } from './useElectronAPI'
import { useArtifactTabsStore } from '../stores/artifactTabs'

function inferArtifactType(fileName: string): 'code' | 'markdown' | 'image' {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext ?? '')) return 'image'
  if (ext === 'md' || ext === 'mdx') return 'markdown'
  return 'code'
}

export function useArtifactLoader() {
  const electronAPI = useElectronAPI()
  const openTab = useArtifactTabsStore((s) => s.openTab)
  const setTabContent = useArtifactTabsStore((s) => s.setTabContent)

  const openFile = useCallback(
    async (filePath: string, fileName: string) => {
      const type = inferArtifactType(fileName)
      const tabId = filePath

      openTab({
        id: tabId,
        title: fileName,
        filePath,
        type,
        content: null,
        isLoading: true,
      })

      try {
        const content = await electronAPI.fs.readFile(filePath)
        setTabContent(tabId, content)
      } catch {
        setTabContent(tabId, '// Error loading file')
      }
    },
    [electronAPI, openTab, setTabContent]
  )

  return { openFile }
}
