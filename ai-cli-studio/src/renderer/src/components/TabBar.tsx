import { type FC, useRef, useState, useCallback } from 'react'
import { X, ChevronDown } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useArtifactTabsStore } from '../stores/artifactTabs'

interface SortableTabProps {
  id: string
  title: string
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}

const SortableTab: FC<SortableTabProps> = ({ id, title, isActive, onSelect, onClose }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer
        border-r border-border-default shrink-0
        transition-colors duration-150 select-none
        min-w-0 max-w-40
        ${
          isActive
            ? 'bg-bg-elevated text-text-primary border-b-2 border-b-accent-primary'
            : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
        }
      `}
    >
      <span className="truncate flex-1">{title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label={`Close ${title}`}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                   rounded p-0.5 hover:bg-bg-primary hover:text-text-primary"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export const TabBar: FC = () => {
  const tabs = useArtifactTabsStore((s) => s.tabs)
  const activeTabId = useArtifactTabsStore((s) => s.activeTabId)
  const setActiveTab = useArtifactTabsStore((s) => s.setActiveTab)
  const closeTab = useArtifactTabsStore((s) => s.closeTab)
  const reorderTabs = useArtifactTabsStore((s) => s.reorderTabs)
  const [showOverflow, setShowOverflow] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const fromIndex = tabs.findIndex((t) => t.id === active.id)
      const toIndex = tabs.findIndex((t) => t.id === over.id)
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderTabs(fromIndex, toIndex)
      }
    },
    [tabs, reorderTabs]
  )

  const visibleTabs = tabs
  const overflowTabs = tabs.length > 5 ? tabs.slice(5) : []

  return (
    <div
      ref={barRef}
      className="flex items-center h-9 bg-bg-secondary border-b border-border-default overflow-hidden"
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={visibleTabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex-1 flex overflow-hidden">
            {visibleTabs.slice(0, 5).map((tab) => (
              <SortableTab
                key={tab.id}
                id={tab.id}
                title={tab.title}
                isActive={tab.id === activeTabId}
                onSelect={() => setActiveTab(tab.id)}
                onClose={() => closeTab(tab.id)}
              />
            ))}
            {overflowTabs.length > 0 && (
              <div ref={overflowRef} className="relative">
                <button
                  onClick={() => setShowOverflow(!showOverflow)}
                  className="flex items-center px-2 h-full text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="More tabs"
                >
                  <ChevronDown size={14} />
                </button>
                {showOverflow && (
                  <div className="absolute top-full right-0 mt-1 bg-bg-secondary border border-border-default rounded-md shadow-lg z-50 min-w-32">
                    {overflowTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          setShowOverflow(false)
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                      >
                        {tab.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
