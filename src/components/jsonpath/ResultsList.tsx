import { Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useClipboard } from '@/hooks/useClipboard'
import { cn } from '@/lib/utils'
import type { PathResult } from '@/types/json'

interface Props {
  results: PathResult[]
  onSelectPath?: (path: string) => void
  selectedPath?: string | null
}

function ValuePreview({ value }: { value: unknown }) {
  if (value === null) return <span className="text-slate-400 italic">null</span>
  if (typeof value === 'boolean')
    return <span className="text-orange-500">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-blue-500">{value}</span>
  if (typeof value === 'string') {
    const display = value.length > 60 ? value.slice(0, 60) + '…' : value
    return <span className="text-green-600 dark:text-green-400">&quot;{display}&quot;</span>
  }
  if (Array.isArray(value)) return <span className="text-muted-foreground">[{value.length} items]</span>
  if (typeof value === 'object')
    return (
      <span className="text-muted-foreground">
        {'{'}
        {Object.keys(value as object).length} keys{'}'}
      </span>
    )
  return <span>{String(value)}</span>
}

function ResultRow({
  result,
  onSelectPath,
  selectedPath,
}: {
  result: PathResult
  onSelectPath?: (path: string) => void
  selectedPath?: string | null
}) {
  const { copy, copied } = useClipboard(1500)
  const isSelected = selectedPath === result.dotPath

  return (
    <div
      className={cn(
        'group flex items-start gap-2 rounded-md border p-3 transition-colors',
        'cursor-pointer hover:bg-muted/50',
        isSelected && 'border-primary bg-primary/5'
      )}
      onClick={() => onSelectPath?.(result.dotPath)}
    >
      <div className="min-w-0 flex-1">
        <code className="block truncate text-xs text-muted-foreground">{result.dotPath}</code>
        <div className="mt-0.5 font-mono text-sm">
          <ValuePreview value={result.value} />
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          copy(result.dotPath)
        }}
        className={cn(
          'shrink-0 rounded p-1 text-xs transition-all opacity-0 group-hover:opacity-100',
          copied
            ? 'text-green-600'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title="Copy path"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function ResultsList({ results, onSelectPath, selectedPath }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{results.length} result{results.length !== 1 ? 's' : ''}</Badge>
      </div>
      <div className="space-y-1.5">
        {results.map((r, i) => (
          <ResultRow
            key={`${r.dotPath}-${i}`}
            result={r}
            onSelectPath={onSelectPath}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </div>
  )
}
