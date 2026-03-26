import { useMemo } from 'react'
import { buildTree } from '@/lib/json-tree'
import { TreeNode } from './TreeNode'
import { PanelInfo } from '@/components/ui/PanelInfo'
import type { ParseResult } from '@/types/json'

interface Props {
  parseResult: ParseResult
  collapsedPaths: Set<string>
  onToggle: (path: string) => void
  highlightedPaths: Set<string>
  onSelectPath?: (path: string) => void
}

export function TreePanel({
  parseResult,
  collapsedPaths,
  onToggle,
  highlightedPaths,
  onSelectPath,
}: Props) {
  const { nodes, truncated } = useMemo(() => {
    if (!parseResult.valid || parseResult.parsed === null) return { nodes: [], truncated: false }
    return buildTree(parseResult.parsed)
  }, [parseResult.valid, parseResult.parsed])

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to explore the tree.
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data to display.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PanelInfo
        title="Tree"
        description="Explore your JSON structure visually. Click any object or array node to expand or collapse it. Click a path label to select it and copy it to the clipboard."
      />
      {truncated && (
        <div className="border-b bg-yellow-50 px-4 py-2 text-xs text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
          Tree truncated — the document is very large. Showing the first 5,000 nodes.
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {nodes.map((node, i) => (
          <TreeNode
            key={`${node.dotPath}-${i}`}
            node={node}
            collapsedPaths={collapsedPaths}
            onToggle={onToggle}
            highlightedPaths={highlightedPaths}
            onSelectPath={onSelectPath}
            isRoot
          />
        ))}
      </div>
    </div>
  )
}
