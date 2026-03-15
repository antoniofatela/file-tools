import { useRef, useState, useCallback } from 'react'
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

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = Math.min(Math.max((ev.clientX - rect.left) / rect.width, 0.2), 0.8)
      setSplitRatio(ratio)
    }

    const onMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('flex min-h-0 flex-1 overflow-hidden', className)}
      style={{ cursor: isDragging ? 'col-resize' : undefined }}
    >
      {/* Left panel */}
      <div
        className="min-w-0 overflow-hidden"
        style={{ flexBasis: `${splitRatio * 100}%`, flexShrink: 0 }}
      >
        {left}
      </div>

      {/* Drag handle */}
      <div
        className={cn(
          'group relative z-10 flex w-2 shrink-0 cursor-col-resize items-center justify-center transition-colors',
          isDragging ? 'bg-primary/50' : 'bg-border hover:bg-primary/30'
        )}
        onMouseDown={onMouseDown}
      >
        {/* Visual grip dots */}
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1 w-1 rounded-full transition-colors',
                isDragging ? 'bg-primary' : 'bg-muted-foreground/40 group-hover:bg-primary/60'
              )}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>

      {/* Full-screen capture overlay during drag — prevents Monaco iframe from eating events */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}
