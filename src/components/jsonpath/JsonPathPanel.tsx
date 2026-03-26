import { Search } from 'lucide-react'
import { ResultsList } from './ResultsList'
import { WhyNoResults } from './WhyNoResults'
import { PanelInfo } from '@/components/ui/PanelInfo'
import type { PathResult } from '@/types/json'
import type { DiagnosticResult } from '@/lib/jsonpath'

const EXAMPLE_QUERIES = [
  { label: 'All items', query: '$.*' },
  { label: 'Deep search', query: '$..*' },
  { label: 'First item', query: '$[0]' },
  { label: 'Filter', query: '$..[?(@.id)]' },
]

interface Props {
  query: string
  onQueryChange: (q: string) => void
  results: PathResult[]
  diagnostic: DiagnosticResult | null
  hasValidJson: boolean
  selectedPath: string | null
  onSelectPath: (path: string) => void
}

export function JsonPathPanel({
  query,
  onQueryChange,
  results,
  diagnostic,
  hasValidJson,
  selectedPath,
  onSelectPath,
}: Props) {
  if (!hasValidJson) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to use the JSONPath evaluator.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PanelInfo
        title="JSONPath"
        description="Query specific values from your JSON using JSONPath expressions. Use $ as the root, .key for fields, [*] for all array items, .. for recursive descent, and [?(@.field)] for filters. Example: $.store.book[*].title"
      />
      <div className="flex flex-col gap-4 p-4 min-h-0 flex-1">
      {/* Query input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">JSONPath Query</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="$.store.book[*].title"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground">Examples:</span>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex.query}
              onClick={() => onQueryChange(ex.query)}
              className="rounded border bg-muted px-2 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-accent"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results or diagnostics */}
      <div className="min-h-0 flex-1 overflow-auto">
        {query.trim() && results.length > 0 && (
          <ResultsList results={results} onSelectPath={onSelectPath} selectedPath={selectedPath} />
        )}
        {query.trim() && results.length === 0 && diagnostic && (
          <WhyNoResults diagnostic={diagnostic} query={query} />
        )}
        {!query.trim() && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Type a JSONPath expression above to query your JSON.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
