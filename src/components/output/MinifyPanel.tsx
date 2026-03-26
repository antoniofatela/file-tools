import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PanelInfo } from '@/components/ui/PanelInfo'
import { useClipboard } from '@/hooks/useClipboard'
import type { ParseResult } from '@/types/json'

interface Props {
  parseResult: ParseResult
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function MinifyPanel({ parseResult }: Props) {
  const { copy, copied } = useClipboard()

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to see the minified output.
      </div>
    )
  }

  const originalSize = new Blob([parseResult.formatted || '']).size
  const minifiedSize = new Blob([parseResult.minified]).size
  const savings =
    originalSize > 0 ? Math.round(((originalSize - minifiedSize) / originalSize) * 100) : 0

  return (
    <div className="flex h-full flex-col">
      <PanelInfo
        title="Minify"
        description="Remove all whitespace to produce the most compact JSON string. Useful for reducing payload size when sending JSON over a network."
      />
      <div className="flex flex-col gap-4 p-4 min-h-0 flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{formatBytes(minifiedSize)}</Badge>
          {savings > 0 && (
            <Badge variant="success">-{savings}% smaller</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(parseResult.minified)}
          className="gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30 p-4">
        <pre className="break-all font-mono text-xs text-foreground whitespace-pre-wrap">
          {parseResult.minified}
        </pre>
      </div>
    </div>
    </div>
  )
}
