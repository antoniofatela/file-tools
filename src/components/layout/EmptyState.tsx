import { EXAMPLES } from '@/constants/examples'

interface Props {
  onSelect: (json: string) => void
}

export function EmptyState({ onSelect }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-t bg-muted/30 px-4 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">Try an example:</span>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => onSelect(ex.json)}
            className="rounded border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
