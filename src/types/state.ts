import type { ParseResult, PathResult } from './json'

export type ToolMode = 'prettify' | 'minify' | 'validate' | 'tree' | 'jsonpath' | 'schema' | 'diff'
export type IndentWidth = 2 | 4 | 'tab'

export interface AppState {
  rawJson: string
  indentWidth: IndentWidth
  activeTab: ToolMode
  jsonPathQuery: string
  selectedNodePath: string | null
  collapsedPaths: Set<string>
  // derived
  parseResult: ParseResult
  pathResults: PathResult[]
}

export interface ShareableState {
  v: 1
  j: string
  t: ToolMode
  i: IndentWidth
  q: string
  s: string | null
}
