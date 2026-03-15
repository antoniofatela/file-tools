import { useState, useEffect } from 'react'
import { parseJson } from '@/lib/json-parser'
import type { ParseResult } from '@/types/json'
import type { IndentWidth } from '@/types/state'
import { PARSE_DEBOUNCE_MS } from '@/constants/defaults'

const EMPTY_RESULT: ParseResult = {
  valid: false,
  parsed: null,
  formatted: '',
  minified: '',
  errors: [],
}

export function useJsonParse(rawJson: string, indentWidth: IndentWidth): ParseResult {
  const [result, setResult] = useState<ParseResult>(EMPTY_RESULT)

  useEffect(() => {
    if (!rawJson.trim()) {
      setResult(EMPTY_RESULT)
      return
    }
    const timer = setTimeout(() => {
      setResult(parseJson(rawJson, indentWidth))
    }, PARSE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [rawJson, indentWidth])

  return result
}
