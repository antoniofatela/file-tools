import { cn } from '@/lib/utils'
import type { ParseResult } from '@/types/json'

interface Props {
  rawJson: string
  parseResult: ParseResult
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EditorStatusBar({ rawJson, parseResult }: Props) {
  const lineCount = rawJson ? rawJson.split('\n').length : 0
  const byteSize = new Blob([rawJson]).size

  return (
    <div className="flex items-center justify-between border-t bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>{lineCount} lines</span>
        <span>{formatBytes(byteSize)}</span>
        {parseResult.valid && parseResult.parsed !== null && (
          <span>
            {Array.isArray(parseResult.parsed)
              ? `Array [${(parseResult.parsed as unknown[]).length}]`
              : typeof parseResult.parsed === 'object'
                ? `Object {${Object.keys(parseResult.parsed as object).length}}`
                : typeof parseResult.parsed}
          </span>
        )}
      </div>
      <div
        className={cn(
          'flex items-center gap-1.5',
          rawJson.trim()
            ? parseResult.valid
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
            : ''
        )}
      >
        {rawJson.trim() && (
          <>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                parseResult.valid ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span>{parseResult.valid ? 'Valid' : 'Invalid'}</span>
          </>
        )}
      </div>
    </div>
  )
}
