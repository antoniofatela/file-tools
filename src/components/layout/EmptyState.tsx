import { FileJson } from 'lucide-react'
import { EXAMPLES } from '@/constants/examples'

interface Props {
  onSelect: (json: string) => void
}

export function EmptyState({ onSelect }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileJson className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-base font-medium">Paste or type your JSON</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          All processing happens in your browser — nothing is sent to a server.
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Or try an example:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => onSelect(ex.json)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <kbd className="rounded border bg-muted px-2 py-1 font-mono">Ctrl+Shift+F</kbd>
        <span>Format</span>
        <kbd className="rounded border bg-muted px-2 py-1 font-mono">Ctrl+Shift+M</kbd>
        <span>Minify</span>
      </div>
    </div>
  )
}
