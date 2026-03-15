import { Suspense, lazy } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrettifyControls } from '@/components/toolbar/PrettifyControls'
import { useClipboard } from '@/hooks/useClipboard'
import type { ParseResult } from '@/types/json'
import type { IndentWidth } from '@/types/state'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })))

interface Props {
  parseResult: ParseResult
  indentWidth: IndentWidth
  onIndentChange: (w: IndentWidth) => void
  isDark: boolean
}

export function PrettifyPanel({ parseResult, indentWidth, onIndentChange, isDark }: Props) {
  const { copy, copied } = useClipboard()

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to see the formatted output.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <PrettifyControls indentWidth={indentWidth} onChange={onIndentChange} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(parseResult.formatted)}
          className="gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <pre className="h-full overflow-auto bg-background p-4 font-mono text-sm">
              {parseResult.formatted}
            </pre>
          }
        >
          <MonacoEditor
            height="100%"
            language="json"
            theme={isDark ? 'vs-dark' : 'vs'}
            value={parseResult.formatted}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              automaticLayout: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
