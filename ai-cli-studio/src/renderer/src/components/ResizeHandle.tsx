import { type FC, useCallback, useEffect, useRef } from 'react'
import { useUiStateStore } from '../stores/uiState'

interface ResizeHandleProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const ResizeHandle: FC<ResizeHandleProps> = ({ containerRef }) => {
  const setSplitPosition = useUiStateStore((s) => s.setSplitPosition)
  const isDragging = useRef(false)

  const handleMouseDown = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const percentage = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPosition(percentage)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [containerRef, setSplitPosition])

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 cursor-col-resize bg-border-default hover:bg-border-accent
                 transition-colors duration-150 shrink-0"
    />
  )
}
