import { JSONPath } from 'jsonpath-plus'
import type { PathResult } from '@/types/json'

export interface DiagnosticResult {
  type: 'no-dollar' | 'key-not-found' | 'filter-too-strict' | 'syntax-error' | 'generic'
  message: string
  suggestion?: string
}

export function evaluatePath(obj: unknown, query: string): PathResult[] {
  if (!query || !query.trim()) return []
  try {
    // jsonpath-plus types require a non-null object; cast through unknown
    const results = JSONPath({
      path: query,
      json: obj as object,
      resultType: 'all',
    }) as unknown as Array<{ value: unknown; path: string; pointer: string }>
    return results.map((r) => ({
      value: r.value,
      path: r.path,
      dotPath: pointerToDotPath(r.pointer),
    }))
  } catch {
    return []
  }
}

/** JSON Pointer /a/b/0 → dot path a.b[0] */
function pointerToDotPath(pointer: string): string {
  if (!pointer) return '$'
  return (
    pointer
      .split('/')
      .filter(Boolean)
      .reduce((acc, part, i) => {
        if (/^\d+$/.test(part)) return `${acc}[${part}]`
        const needsBracket = /[^a-zA-Z0-9_$]/.test(part)
        if (i === 0 && !acc) return needsBracket ? `["${part}"]` : part
        return needsBracket ? `${acc}["${part}"]` : `${acc}.${part}`
      }, '') || '$'
  )
}

export function diagnoseQuery(obj: unknown, query: string): DiagnosticResult | null {
  if (!query.trim()) return null

  // Must start with $
  if (!query.startsWith('$')) {
    return {
      type: 'no-dollar',
      message: 'JSONPath queries must start with `$` (which represents the root of the document).',
      suggestion: `Try: $${query.startsWith('.') ? '' : '.'}${query}`,
    }
  }

  // Syntax error check
  try {
    JSONPath({ path: query, json: {}, resultType: 'all' })
  } catch (e) {
    return {
      type: 'syntax-error',
      message: `The query has a syntax error: ${(e as Error).message}`,
    }
  }

  if (!obj || typeof obj !== 'object') return null

  // Check if the first key after $ exists
  const firstKeyMatch = query.match(/^\$\.(\w+)/)
  if (firstKeyMatch) {
    const firstKey = firstKeyMatch[1]
    const rootKeys = Object.keys(obj as Record<string, unknown>)
    if (!rootKeys.includes(firstKey)) {
      const similar = rootKeys.filter(
        (k) => k.toLowerCase().includes(firstKey.toLowerCase()) || firstKey.toLowerCase().includes(k.toLowerCase())
      )
      return {
        type: 'key-not-found',
        message: `Key \`${firstKey}\` doesn't exist at the root level.`,
        suggestion:
          similar.length > 0
            ? `Did you mean: ${similar.map((k) => `\`${k}\``).join(', ')}? Available keys: ${rootKeys.slice(0, 5).map((k) => `\`${k}\``).join(', ')}`
            : `Available root keys: ${rootKeys.slice(0, 8).map((k) => `\`${k}\``).join(', ')}`,
      }
    }
  }

  // Try without filters — if results appear, the filter is too strict
  const withoutFilters = query.replace(/\[?\?\([^)]+\)\]?/g, '[*]')
  if (withoutFilters !== query) {
    try {
      const relaxed = JSONPath({ path: withoutFilters, json: obj as object, resultType: 'all' }) as unknown[]
      if (relaxed.length > 0) {
        return {
          type: 'filter-too-strict',
          message: `The filter condition eliminated all results.`,
          suggestion: `Without the filter, ${relaxed.length} item${relaxed.length === 1 ? '' : 's'} match${relaxed.length === 1 ? 'es' : ''}. Check your filter conditions.`,
        }
      }
    } catch {
      // ignore
    }
  }

  // Generic: show available root keys
  const rootKeys = Object.keys(obj as Record<string, unknown>)
  return {
    type: 'generic',
    message: 'No values matched this path.',
    suggestion: `The document has ${rootKeys.length} top-level key${rootKeys.length === 1 ? '' : 's'}: ${rootKeys.slice(0, 8).map((k) => `\`${k}\``).join(', ')}${rootKeys.length > 8 ? '…' : ''}`,
  }
}

/** Given a dot-path, return the JSONPath expression for it */
export function findPathsForValue(_obj: unknown, targetDotPath: string): string[] {
  try {
    const jsonPath = dotPathToJsonPath(targetDotPath)
    return [jsonPath]
  } catch {
    return []
  }
}

function dotPathToJsonPath(dotPath: string): string {
  if (!dotPath || dotPath === '$') return '$'
  // Already looks like a JSONPath
  if (dotPath.startsWith('$')) return dotPath
  return `$.${dotPath}`
}
