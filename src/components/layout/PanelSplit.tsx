import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
  className?: string
}

export function PanelSplit({ left, right, className }: Props) {
  const [splitRatio, setSplitRatio] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const onMouseDown = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0.2), 0.8)
      setSplitRatio(ratio)
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div ref={containerRef} className={cn('flex min-h-0 flex-1 overflow-hidden', className)}>
      {/* Left panel */}
      <div
        className="min-w-0 overflow-hidden"
        style={{ flexBasis: `${splitRatio * 100}%`, flexShrink: 0 }}
      >
        {left}
      </div>

      {/* Drag handle */}
      <div
        className="relative z-10 flex w-1 cursor-col-resize items-center justify-center bg-border hover:bg-primary/40 active:bg-primary/60 transition-colors"
        onMouseDown={onMouseDown}
      >
        <div className="absolute h-8 w-3 rounded-full bg-border hover:bg-primary/20 transition-colors" />
      </div>

      {/* Right panel */}
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  )
}
