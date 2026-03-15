import { useState, useEffect } from 'react'
import { evaluatePath, diagnoseQuery, type DiagnosticResult } from '@/lib/jsonpath'
import type { PathResult } from '@/types/json'
import { PARSE_DEBOUNCE_MS } from '@/constants/defaults'

interface JsonPathResult {
  results: PathResult[]
  diagnostic: DiagnosticResult | null
  highlightedPaths: Set<string>
}

export function useJsonPath(obj: unknown, query: string, isValid: boolean): JsonPathResult {
  const [state, setState] = useState<JsonPathResult>({
    results: [],
    diagnostic: null,
    highlightedPaths: new Set(),
  })

  useEffect(() => {
    if (!isValid || !obj) {
      setState({ results: [], diagnostic: null, highlightedPaths: new Set() })
      return
    }

    const timer = setTimeout(() => {
      const results = evaluatePath(obj, query)
      const diagnostic = results.length === 0 ? diagnoseQuery(obj, query) : null
      const highlightedPaths = new Set(results.map((r) => r.dotPath))
      setState({ results, diagnostic, highlightedPaths })
    }, PARSE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [obj, query, isValid])

  return state
}
