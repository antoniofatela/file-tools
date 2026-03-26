import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { jsonquery } from '@jsonquerylang/jsonquery'
import { PanelInfo } from '@/components/ui/PanelInfo'
import type { ParseResult } from '@/types/json'

interface Props {
  parseResult: ParseResult
  isDark: boolean
}

export function JqPanel({ parseResult, isDark }: Props) {
  const [query, setQuery] = useState('.')
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parseResult.valid || parseResult.parsed === undefined) return
    if (!query.trim()) {
      setOutput(null)
      setError(null)
      return
    }
    try {
      const result = jsonquery(parseResult.parsed, query)
      setOutput(JSON.stringify(result, null, 2))
      setError(null)
    } catch (e) {
      setError(String(e).replace(/^Error:\s*/i, '').trim())
      setOutput(null)
    }
  }, [query, parseResult.parsed, parseResult.valid])

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to use the JSON Query evaluator.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PanelInfo
        title="JSON Query"
        description="Transform your JSON using the jsonquery language (jsonquerylang.org). Chain operations with the pipe operator |. Examples: .users | filter(.active == true) | sort(.name) | pick(.name, .age)"
      />
      <div className="flex flex-col gap-4 p-4 min-h-0 flex-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">jsonquerylang.org</Badge>
      </div>

      {/* Query input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Query</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=".users | filter(.active == true) | sort(.name)"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

      </div>

      {/* Output */}
      <div className="min-h-0 flex-1 overflow-auto">
        {error && (
          <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <pre className="whitespace-pre-wrap font-mono text-xs text-red-700 dark:text-red-400">{error}</pre>
          </div>
        )}

        {output !== null && !error && (
          <div className="space-y-2">
            <Badge variant="secondary">Output</Badge>
            <pre
              className={cn(
                'overflow-auto rounded-md border p-3 font-mono text-xs leading-relaxed',
                isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
              )}
            >
              {output}
            </pre>
          </div>
        )}

        {!query.trim() && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Type a JSON Query expression above to transform your JSON.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
