import { type FC } from 'react'
import { TabBar } from './TabBar'
import { ViewModeControls } from './ViewModeControls'
import { ViewerPanel } from './ViewerPanel'

export const Layout: FC = () => {
  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      {/* Sidebar — file browser placeholder (Plan 02) */}
      <div className="w-56 shrink-0 bg-bg-tertiary border-r border-border-default flex flex-col">
        <div className="p-3 text-xs text-text-faint font-medium border-b border-border-default">
          Files
        </div>
        <div className="flex-1 flex items-center justify-center text-text-faint text-xs">
          File browser — Plan 02
        </div>
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
