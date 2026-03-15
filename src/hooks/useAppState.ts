import { useState } from 'react'
import { useJsonParse } from './useJsonParse'
import { useJsonPath } from './useJsonPath'
import { useUrlSync } from './useUrlSync'
import { readHashState } from '@/lib/url-state'
import { DEFAULT_INDENT, DEFAULT_TAB } from '@/constants/defaults'
import type { ToolMode, IndentWidth } from '@/types/state'

function getInitialState() {
  const saved = readHashState()
  return {
    rawJson: saved?.j ?? '',
    activeTab: (saved?.t ?? DEFAULT_TAB) as ToolMode,
    indentWidth: (saved?.i ?? DEFAULT_INDENT) as IndentWidth,
    jsonPathQuery: saved?.q ?? '$',
    selectedNodePath: saved?.s ?? null,
  }
}

export function useAppState() {
  const initial = getInitialState()

  const [rawJson, setRawJson] = useState(initial.rawJson)
  const [activeTab, setActiveTab] = useState<ToolMode>(initial.activeTab)
  const [indentWidth, setIndentWidth] = useState<IndentWidth>(initial.indentWidth)
  const [jsonPathQuery, setJsonPathQuery] = useState(initial.jsonPathQuery)
  const [selectedNodePath, setSelectedNodePath] = useState<string | null>(initial.selectedNodePath)
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set())

  const parseResult = useJsonParse(rawJson, indentWidth)

  const { results: pathResults, diagnostic: pathDiagnostic, highlightedPaths } = useJsonPath(
    parseResult.parsed,
    jsonPathQuery,
    parseResult.valid
  )

  useUrlSync(rawJson, activeTab, indentWidth, jsonPathQuery, selectedNodePath)

  const toggleCollapsed = (path: string) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return {
    rawJson,
    setRawJson,
    activeTab,
    setActiveTab,
    indentWidth,
    setIndentWidth,
    jsonPathQuery,
    setJsonPathQuery,
    selectedNodePath,
    setSelectedNodePath,
    collapsedPaths,
    toggleCollapsed,
    parseResult,
    pathResults,
    pathDiagnostic,
    highlightedPaths,
  }
}
