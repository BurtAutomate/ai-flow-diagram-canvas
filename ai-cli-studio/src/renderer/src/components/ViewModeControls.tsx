import { type FC } from 'react'
import { Eye, Code2, Columns2 } from 'lucide-react'
import { useUiStateStore, type ViewMode } from '../stores/uiState'

const modes: { value: ViewMode; label: string; Icon: FC<{ size?: number }> }[] = [
  { value: 'preview', label: 'Preview', Icon: Eye },
  { value: 'code', label: 'Code', Icon: Code2 },
  { value: 'side-by-side', label: 'Split', Icon: Columns2 },
]

export const ViewModeControls: FC = () => {
  const viewMode = useUiStateStore((s) => s.viewMode)
  const setViewMode = useUiStateStore((s) => s.setViewMode)

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-bg-secondary p-0.5">
      {modes.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setViewMode(value)}
          aria-label={label}
          aria-pressed={viewMode === value}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium
            transition-colors duration-150
            ${
              viewMode === value
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }
          `}
        >
          <Icon size={14} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
