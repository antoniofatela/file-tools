import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParseResult } from '@/types/json'

// jq-web exports a promise; we resolve it once and cache the module.
let jqReady: Promise<{ json: (data: unknown, filter: string) => unknown }> | null = null

function getJq() {
  if (!jqReady) {
    jqReady = import('jq-web').then((mod) => {
      const factory = mod.default ?? mod
      // Tell the emscripten runtime where to find jq.wasm (served from /public)
      return factory({ locateFile: () => '/jq.wasm' })
    })
  }
  return jqReady
}

const EXAMPLES = [
  { label: 'Identity', query: '.' },
  { label: 'Keys', query: 'keys' },
  { label: 'Values', query: '.[]' },
  { label: 'Map', query: '[.[] | .type?]' },
  { label: 'Select', query: '.[] | select(.active == true)' },
]

interface Props {
  parseResult: ParseResult
  isDark: boolean
}

export function JqPanel({ parseResult, isDark }: Props) {
  const [query, setQuery] = useState('.')
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const jqRef = useRef<{ json: (data: unknown, filter: string) => unknown } | null>(null)
  const [jqLoaded, setJqLoaded] = useState(false)

  // Load jq-web once
  useEffect(() => {
    getJq().then((jq) => {
      jqRef.current = jq
      setJqLoaded(true)
    }).catch((e) => {
      setError(`Failed to load jq: ${String(e)}`)
    })
  }, [])

  // Re-run whenever query or parsed JSON changes
  useEffect(() => {
    if (!jqLoaded || !jqRef.current) return
    if (!parseResult.valid || parseResult.parsed === undefined) return
    if (!query.trim()) {
      setOutput(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setOutput(null)

    try {
      const result = jqRef.current.json(parseResult.parsed, query)
      setOutput(JSON.stringify(result, null, 2))
    } catch (e) {
      // jq errors are often multi-line strings
      const msg = String(e)
        .replace(/^Error:\s*/i, '')
        .trim()
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [query, parseResult.parsed, parseResult.valid, jqLoaded])

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to use the jq evaluator.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Filter input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">jq Filter</label>
        <div className="relative">
          <Terminal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=". | keys"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.query}
              onClick={() => setQuery(ex.query)}
              className="rounded border bg-muted px-2 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-accent"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      <div className="min-h-0 flex-1 overflow-auto">
        {!jqLoaded && !error && (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            Loading jq…
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30">
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

        {loading && (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            Running…
          </div>
        )}

        {jqLoaded && !query.trim() && !loading && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Type a jq filter above to transform your JSON.
          </div>
        )}
      </div>
    </div>
  )
}
