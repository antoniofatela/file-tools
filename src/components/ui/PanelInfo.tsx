import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description: string
}

export function PanelInfo({ title, description }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="shrink-0 border-b">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted/50"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-40' : 'max-h-0'
        )}
      >
        <p className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
