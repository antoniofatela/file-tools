import { useRef, useState, useCallback } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
  className?: string
}

export function PanelSplit({ left, right, className }: Props) {
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // setPointerCapture routes all pointer events to this element even when the
  // pointer moves over iframes (Monaco), which is what broke document-level listeners.
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0.15), 0.85)
      setSplitRatio(ratio)
    },
    [isDragging]
  )

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
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

      {/* Drag handle — wide enough to grab, clear visual affordance */}
      <div
        role="separator"
        aria-label="Drag to resize panels"
        title="Drag to resize"
        className={cn(
          'group relative z-10 flex w-3 shrink-0 cursor-col-resize select-none flex-col items-center justify-center gap-0.5 transition-colors',
          isDragging
            ? 'bg-primary/20'
            : 'bg-border hover:bg-primary/10'
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <GripVertical
          className={cn(
            'h-5 w-5 transition-colors',
            isDragging
              ? 'text-primary'
              : 'text-muted-foreground/50 group-hover:text-primary/70'
          )}
        />
      </div>

      {/* Right panel */}
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  )
}
