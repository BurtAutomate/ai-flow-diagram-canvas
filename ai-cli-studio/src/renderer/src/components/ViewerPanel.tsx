import { type FC, useRef } from 'react'
import { useArtifactTabsStore } from '../stores/artifactTabs'
import { useUiStateStore } from '../stores/uiState'
import { ResizeHandle } from './ResizeHandle'
import { CodeSkeleton, MarkdownSkeleton } from './ui/Skeleton'

const ArtifactIndex: FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-text-faint">
    <div className="w-16 h-16 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
      <span className="text-accent-primary text-2xl font-bold">AI</span>
    </div>
    <h2 className="text-lg font-medium text-text-secondary mb-1">No artifact open</h2>
    <p className="text-sm text-text-faint">Browse files to open an artifact, or connect an agent</p>
  </div>
)

const SkeletonByType: FC<{ type: string }> = ({ type }) => {
  if (type === 'markdown') return <MarkdownSkeleton />
  return <CodeSkeleton />
}

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
    if (activeTab.isLoading || !activeTab.content) {
      return <SkeletonByType type={activeTab.type} />
    }
    return (
      <div className="flex items-center justify-center h-full text-text-faint text-sm">
        Preview for {activeTab.type} — viewer coming in Plan 02
      </div>
    )
  }

  const renderCode = () => {
    if (activeTab.isLoading || !activeTab.content) {
      return <SkeletonByType type={activeTab.type} />
    }
    return (
      <pre className="h-full overflow-auto p-4 bg-code-bg text-code-text font-mono text-sm">
        <code>{activeTab.content}</code>
      </pre>
    )
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
