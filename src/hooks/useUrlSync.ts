import { useEffect, useRef } from 'react'
import { writeHashState, makeShareable } from '@/lib/url-state'
import type { ToolMode, IndentWidth } from '@/types/state'
import { URL_DEBOUNCE_MS } from '@/constants/defaults'

export function useUrlSync(
  rawJson: string,
  activeTab: ToolMode,
  indentWidth: IndentWidth,
  jsonPathQuery: string,
  selectedNodePath: string | null
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const state = makeShareable(rawJson, activeTab, indentWidth, jsonPathQuery, selectedNodePath)
      writeHashState(state)
    }, URL_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [rawJson, activeTab, indentWidth, jsonPathQuery, selectedNodePath])
}
