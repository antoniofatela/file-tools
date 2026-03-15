import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiffNode, ChangeKind } from '@/lib/json-diff'

// ── Value preview ─────────────────────────────────────────────────────────────

function Preview({ value, inline = false }: { value: unknown; inline?: boolean }) {
  if (value === null) return <span className="text-slate-400 italic">null</span>
  if (typeof value === 'boolean')
    return <span className="text-orange-500">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-blue-500">{value}</span>
  if (typeof value === 'string') {
    const display = value.length > (inline ? 60 : 120) ? value.slice(0, inline ? 60 : 120) + '…' : value
    return <span className="text-green-600 dark:text-green-400">"{display}"</span>
  }
  if (Array.isArray(value)) return <span className="text-muted-foreground">[{value.length}]</span>
  if (typeof value === 'object')
    return <span className="text-muted-foreground">{'{'}{Object.keys(value as object).length}{'}'}</span>
  return <span>{String(value)}</span>
}

// ── Kind styling ──────────────────────────────────────────────────────────────

const KIND_ROW: Record<ChangeKind, string> = {
  added: 'bg-green-50 dark:bg-green-950/30',
  removed: 'bg-red-50 dark:bg-red-950/30',
  changed: 'bg-amber-50 dark:bg-amber-950/30',
  reordered: 'bg-blue-50 dark:bg-blue-950/30',
  unchanged: '',
}

const KIND_BADGE: Record<ChangeKind, string> = {
  added: 'text-green-700 dark:text-green-400 font-bold',
  removed: 'text-red-700 dark:text-red-400 font-bold',
  changed: 'text-amber-700 dark:text-amber-400 font-bold',
  reordered: 'text-blue-600 dark:text-blue-400 font-bold',
  unchanged: 'text-muted-foreground',
}

const KIND_SYMBOL: Record<ChangeKind, string> = {
  added: '+',
  removed: '−',
  changed: '~',
  reordered: '⇄',
  unchanged: ' ',
}

// ── Stats badge ───────────────────────────────────────────────────────────────

function StatsBadge({ node }: { node: DiffNode }) {
  const s = node.stats
  const parts: string[] = []
  if (s.added) parts.push(`+${s.added}`)
  if (s.removed) parts.push(`-${s.removed}`)
  if (s.changed) parts.push(`~${s.changed}`)
  if (s.reordered) parts.push(`⇄${s.reordered}`)
  if (parts.length === 0) return null
  return (
    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {parts.join(' ')}
    </span>
  )
}

// ── Tree node ─────────────────────────────────────────────────────────────────

interface NodeProps {
  node: DiffNode
  depth: number
  hideUnchanged: boolean
}

export function DiffTreeNode({ node, depth, hideUnchanged }: NodeProps) {
  const hasChildren = node.children && node.children.length > 0
  // Auto-expand nodes with changes; collapse unchanged containers
  const [expanded, setExpanded] = useState(
    () => node.kind !== 'unchanged' || (node.stats.added + node.stats.removed + node.stats.changed + node.stats.reordered > 0)
  )

  // Hide completely unchanged leaf nodes when hideUnchanged is on
  if (hideUnchanged && node.kind === 'unchanged' && !hasChildren) return null
  // Hide unchanged containers that have no descendant changes
  if (
    hideUnchanged &&
    node.kind === 'unchanged' &&
    hasChildren &&
    node.stats.added === 0 &&
    node.stats.removed === 0 &&
    node.stats.changed === 0 &&
    node.stats.reordered === 0
  ) {
    return null
  }

  const keyLabel = node.key === null ? null : typeof node.key === 'number' ? `[${node.key}]` : node.key
  const isContainer = hasChildren
  const sym = KIND_SYMBOL[node.kind]
  const isLeafChange = !isContainer && node.kind !== 'unchanged'

  // Visible children (filtered if hideUnchanged)
  const visibleChildren = node.children?.filter((c) => {
    if (!hideUnchanged) return true
    if (c.kind !== 'unchanged') return true
    if (c.children && (c.stats.added + c.stats.removed + c.stats.changed + c.stats.reordered > 0)) return true
    return false
  }) ?? []

  const hiddenCount = (node.children?.length ?? 0) - visibleChildren.length

  return (
    <div>
      {/* Row */}
      <div
        className={cn(
          'flex min-h-[24px] items-start gap-1 rounded-sm px-1 py-0.5 font-mono text-xs',
          KIND_ROW[node.kind],
          isContainer && 'cursor-pointer select-none'
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={isContainer ? () => setExpanded((e) => !e) : undefined}
      >
        {/* Expand/collapse chevron */}
        <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground">
          {isContainer
            ? expanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
            : null}
        </span>

        {/* Symbol */}
        <span className={cn('w-3 shrink-0 text-center', KIND_BADGE[node.kind])}>{sym}</span>

        {/* Key */}
        {keyLabel !== null && (
          <span className="shrink-0 text-purple-700 dark:text-purple-400">
            {keyLabel}
            <span className="text-muted-foreground">: </span>
          </span>
        )}

        {/* Value / change */}
        {isLeafChange ? (
          <span className="flex min-w-0 flex-wrap items-center gap-1">
            {node.kind === 'added' && (
              <Preview value={node.newValue} inline />
            )}
            {node.kind === 'removed' && (
              <span className="line-through opacity-70"><Preview value={node.oldValue} inline /></span>
            )}
            {node.kind === 'changed' && (
              <>
                <span className="line-through opacity-60"><Preview value={node.oldValue} inline /></span>
                <span className="text-muted-foreground">→</span>
                <Preview value={node.newValue} inline />
              </>
            )}
            {node.kind === 'reordered' && (
              <span className="text-blue-500 dark:text-blue-400 italic">moved</span>
            )}
          </span>
        ) : isContainer ? (
          <span className="text-muted-foreground">
            {Array.isArray(node.children?.length) ? '[ ]' : '{ }'}
            <StatsBadge node={node} />
          </span>
        ) : (
          <Preview value={node.oldValue} inline />
        )}
      </div>

      {/* Children */}
      {isContainer && expanded && (
        <div>
          {visibleChildren.map((child, i) => (
            <DiffTreeNode key={`${child.path}-${i}`} node={child} depth={depth + 1} hideUnchanged={hideUnchanged} />
          ))}
          {hideUnchanged && hiddenCount > 0 && (
            <div
              className="cursor-pointer py-0.5 font-mono text-xs text-muted-foreground hover:text-foreground"
              style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
              onClick={(e) => { e.stopPropagation(); /* no-op — parent controls */ }}
            >
              … {hiddenCount} unchanged {hiddenCount === 1 ? 'item' : 'items'} hidden
            </div>
          )}
        </div>
      )}
    </div>
  )
}
