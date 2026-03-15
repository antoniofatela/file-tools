import type { IndentWidth } from '@/types/state'
import { cn } from '@/lib/utils'

interface Props {
  indentWidth: IndentWidth
  onChange: (w: IndentWidth) => void
}

const OPTIONS: { label: string; value: IndentWidth }[] = [
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: 'Tab', value: 'tab' },
]

export function PrettifyControls({ indentWidth, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Indent:</span>
      <div className="flex rounded-md border bg-background">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-2.5 py-1 text-xs transition-colors first:rounded-l-md last:rounded-r-md',
              indentWidth === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
