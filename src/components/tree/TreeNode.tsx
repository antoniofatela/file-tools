import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TreeNodeValue } from './TreeNodeValue'
import { PathCopyButton } from './PathCopyButton'
import { AUTO_COLLAPSE_CHILDREN } from '@/constants/defaults'
import type { TreeNode as TreeNodeType } from '@/types/json'

interface Props {
  node: TreeNodeType
  collapsedPaths: Set<string>
  onToggle: (path: string) => void
  highlightedPaths: Set<string>
  onSelectPath?: (path: string) => void
  isRoot?: boolean
}

export function TreeNode({
  node,
  collapsedPaths,
  onToggle,
  highlightedPaths,
  onSelectPath,
  isRoot = false,
}: Props) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsedPaths.has(node.dotPath)
  const isHighlighted = highlightedPaths.has(node.dotPath)

  // Auto-collapse large collections initially
  const shouldAutoCollapse =
    hasChildren && node.children.length > AUTO_COLLAPSE_CHILDREN && !collapsedPaths.has('__initialized__')

  const effectivelyCollapsed = isCollapsed || shouldAutoCollapse

  const keyLabel = isRoot ? '$' : typeof node.key === 'number' ? `${node.key}` : `"${node.key}"`

  const typeLabel =
    node.type === 'array'
      ? `[${node.children.length}]`
      : node.type === 'object'
        ? `{${node.children.length}}`
        : null

  return (
    <div className={cn('group font-mono text-sm', isRoot && 'pl-0')}>
      <div
        className={cn(
          'flex min-h-[22px] cursor-pointer items-center rounded px-1 py-0.5 transition-colors',
          'hover:bg-muted/60',
          isHighlighted && 'bg-yellow-100 dark:bg-yellow-900/40'
        )}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.dotPath)
          } else if (onSelectPath) {
            onSelectPath(node.dotPath)
          }
        }}
      >
        {/* Collapse/expand icon */}
        <span className="mr-1 h-4 w-4 shrink-0 text-muted-foreground">
          {hasChildren ? (
            effectivelyCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )
          ) : null}
        </span>

        {/* Key */}
        <span className="text-purple-700 dark:text-purple-400 shrink-0">
          {keyLabel}
        </span>

        {/* Colon + type preview or value */}
        <span className="mx-1 text-muted-foreground shrink-0">:</span>

        {hasChildren ? (
          <span className="text-muted-foreground text-xs">
            {typeLabel}
            {effectivelyCollapsed && (
              <span className="ml-1 text-muted-foreground/60">
                {node.type === 'array' ? '[…]' : '{…}'}
              </span>
            )}
          </span>
        ) : (
          <TreeNodeValue value={node.value} type={node.type} />
        )}

        {/* Copy path button */}
        <PathCopyButton path={node.dotPath} />
      </div>

      {/* Children */}
      {hasChildren && !effectivelyCollapsed && (
        <div className="ml-5 border-l border-border/50 pl-2">
          {node.children.map((child, i) => (
            <TreeNode
              key={`${child.dotPath}-${i}`}
              node={child}
              collapsedPaths={collapsedPaths}
              onToggle={onToggle}
              highlightedPaths={highlightedPaths}
              onSelectPath={onSelectPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}
