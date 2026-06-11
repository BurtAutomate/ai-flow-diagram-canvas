import { type FC, useRef } from 'react'
import { useArtifactTabsStore } from '../stores/artifactTabs'
import { useUiStateStore } from '../stores/uiState'
import { ResizeHandle } from './ResizeHandle'
import { viewerRegistry } from '../../components/viewers/ViewerRegistry'

const ArtifactIndex: FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-text-faint">
    <div className="w-16 h-16 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
      <span className="text-accent-primary text-2xl font-bold">AI</span>
    </div>
    <h2 className="text-lg font-medium text-text-secondary mb-1">No artifact open</h2>
    <p className="text-sm text-text-faint">Browse files to open an artifact, or connect an agent</p>
  </div>
)

export const ViewerPanel: FC = () => {
  const tabs = useArtifactTabsStore((s) => s.tabs)
  const activeTabId = useArtifactTabsStore((s) => s.activeTabId)
  const viewMode = useUiStateStore((s) => s.viewMode)
  const splitPosition = useUiStateStore((s) => s.splitPosition)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  if (!activeTab) {
    return (
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <ArtifactIndex />
      </div>
    )
  }

  const renderPreview = () => {
    if (activeTab.isLoading) {
      const def = viewerRegistry.getViewer(activeTab.type)
      if (def?.skeleton) {
        const SkeletonComponent = def.skeleton
        return <SkeletonComponent content="" title={activeTab.title} />
      }
    }
    if (activeTab.content) {
      return viewerRegistry.render(activeTab.type, {
        content: activeTab.content,
        title: activeTab.title,
      })
    }
    return null
  }

  const renderCode = () => {
    if (activeTab.isLoading || !activeTab.content) {
      const def = viewerRegistry.getViewer(activeTab.type)
      if (def?.skeleton) {
        const SkeletonComponent = def.skeleton
        return <SkeletonComponent content="" title={activeTab.title} />
      }
    }
    if (activeTab.content) {
      return viewerRegistry.render('code', {
        content: activeTab.content,
        title: activeTab.title,
      })
    }
    return null
  }

  if (viewMode === 'preview') {
    return (
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>
    )
  }

  if (viewMode === 'code') {
    return (
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {renderCode()}
      </div>
    )
  }

  // side-by-side
  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden">
      <div className="overflow-hidden" style={{ width: `${splitPosition}%` }}>
        {renderPreview()}
      </div>
      <ResizeHandle containerRef={containerRef} />
      <div className="flex-1 overflow-hidden">
        {renderCode()}
      </div>
    </div>
  )
}
