import { useMemo, Suspense, lazy } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClipboard } from '@/hooks/useClipboard'
import { generateSchema } from '@/lib/schema-generator'
import type { ParseResult } from '@/types/json'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })))

interface Props {
  parseResult: ParseResult
  isDark: boolean
}

export function SchemaPanel({ parseResult, isDark }: Props) {
  const { copy, copied } = useClipboard()

  const schemaJson = useMemo(() => {
    if (!parseResult.valid || parseResult.parsed === null) return ''
    try {
      const schema = generateSchema(parseResult.parsed)
      return JSON.stringify(schema, null, 2)
    } catch {
      return ''
    }
  }, [parseResult.valid, parseResult.parsed])

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to generate a schema.
      </div>
    )
  }

  if (!schemaJson) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Unable to generate schema for this input.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">JSON Schema Draft-07</Badge>
          <span className="text-xs text-muted-foreground">Generated from sample data</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(schemaJson)}
          className="gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Schema output */}
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <pre className="h-full overflow-auto bg-background p-4 font-mono text-xs">
              {schemaJson}
            </pre>
          }
        >
          <MonacoEditor
            height="100%"
            language="json"
            theme={isDark ? 'vs-dark' : 'vs'}
            value={schemaJson}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 12,
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
