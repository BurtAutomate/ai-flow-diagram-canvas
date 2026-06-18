import { type FC, useEffect } from 'react'
import { TabBar } from './TabBar'
import { ViewModeControls } from './ViewModeControls'
import { ViewerPanel } from './ViewerPanel'
import { FileBrowser } from './FileBrowser'
import { useFileBrowser } from '../hooks/useFileBrowser'

export const Layout: FC = () => {
  const { initRoot } = useFileBrowser()

  useEffect(() => {
    initRoot()
  }, [initRoot])

  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      {/* Sidebar — file browser */}
      <div className="w-56 shrink-0 bg-bg-tertiary border-r border-border-default flex flex-col">
        <FileBrowser />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chrome area: tab bar + view mode controls */}
        <div className="flex items-center justify-between bg-bg-secondary border-b border-border-default shrink-0">
          <TabBar />
          <div className="px-2">
            <ViewModeControls />
          </div>
        </div>

        {/* Viewer panel */}
        <ViewerPanel />
      </div>
    </div>
  )
}
