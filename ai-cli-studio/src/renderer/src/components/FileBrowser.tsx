import { type FC } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'
import { useFileBrowserStore, getFileType } from '../stores/fileBrowser'
import { useFileBrowser } from '../hooks/useFileBrowser'
import { useArtifactLoader } from '../hooks/useArtifactLoader'
import type { FileTreeEntry } from '../stores/fileBrowser'

const FileTreeItem: FC<{
  name: string
  path: string
  isDirectory: boolean
  depth: number
}> = ({ name, path, isDirectory, depth }) => {
  const expandedPaths = useFileBrowserStore((s) => s.expandedPaths)
  const activeFilePath = useFileBrowserStore((s) => s.activeFilePath)
  const setActiveFile = useFileBrowserStore((s) => s.setActiveFile)
  const { expandDirectory } = useFileBrowser()
  const { openFile } = useArtifactLoader()
  const fileType = getFileType(name)
  const isExpanded = expandedPaths.has(path)
  const isActive = activeFilePath === path

  const handleClick = () => {
    if (isDirectory) {
      expandDirectory(path)
    } else if (fileType === 'viewable') {
      setActiveFile(path)
      openFile(path, name)
    }
  }

  const isDisabled = !isDirectory && fileType !== 'viewable'
  const tooltip =
    !isDirectory && fileType === 'phase4'
      ? 'Viewer not available — planned for Phase 4'
      : undefined

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={tooltip}
      className={`
        w-full flex items-center gap-1.5 px-2 py-0.5 text-xs text-left
        transition-colors duration-100
        ${isDisabled
          ? 'text-text-faint/40 cursor-not-allowed'
          : isActive
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/30'
        }
      `}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      {isDirectory ? (
        isExpanded ? (
          <ChevronDown size={12} className="shrink-0" />
        ) : (
          <ChevronRight size={12} className="shrink-0" />
        )
      ) : (
        <span className="w-3 shrink-0" />
      )}

      {isDirectory ? (
        isExpanded ? (
          <FolderOpen size={14} className="shrink-0 text-accent-primary/70" />
        ) : (
          <Folder size={14} className="shrink-0 text-accent-primary/50" />
        )
      ) : (
        <File size={14} className="shrink-0 text-text-faint/60" />
      )}

      <span className="truncate">{name}</span>
    </button>
  )
}

const TreeNode: FC<{
  entry: FileTreeEntry
  depth: number
}> = ({ entry, depth }) => {
  const expandedPaths = useFileBrowserStore((s) => s.expandedPaths)
  const isExpanded = expandedPaths.has(entry.path)

  return (
    <>
      <FileTreeItem
        name={entry.name}
        path={entry.path}
        isDirectory={entry.isDirectory}
        depth={depth}
      />
      {entry.isDirectory && isExpanded && entry.children && (
        <>
          {entry.children.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} />
          ))}
        </>
      )}
    </>
  )
}

export const FileBrowser: FC = () => {
  const tree = useFileBrowserStore((s) => s.tree)

  const sortedTree = [...tree].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2 text-xs text-text-faint font-medium border-b border-border-default shrink-0">
        Files
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {sortedTree.map((entry) => (
          <TreeNode key={entry.path} entry={entry} depth={0} />
        ))}
      </div>
    </div>
  )
}
