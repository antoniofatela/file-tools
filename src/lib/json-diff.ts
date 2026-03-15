// JSON semantic diff with options for array/object ordering

export interface DiffOptions {
  ignoreArrayOrder: boolean
  ignoreObjectKeyOrder: boolean
}

export type ChangeKind = 'added' | 'removed' | 'changed' | 'unchanged' | 'reordered'

export interface DiffNode {
  key: string | number | null // null = root
  path: string
  kind: ChangeKind
  // Leaf change
  oldValue?: unknown
  newValue?: unknown
  // Container node
  children?: DiffNode[]
  // Cached counts for collapsed display
  stats: DiffStats
}

export interface DiffStats {
  added: number
  removed: number
  changed: number
  reordered: number
  unchanged: number
}

export interface DiffSummary {
  added: number
  removed: number
  changed: number
  reordered: number
  total: number
}

const EMPTY_STATS: DiffStats = { added: 0, removed: 0, changed: 0, reordered: 0, unchanged: 0 }

function addStats(a: DiffStats, b: DiffStats): DiffStats {
  return {
    added: a.added + b.added,
    removed: a.removed + b.removed,
    changed: a.changed + b.changed,
    reordered: a.reordered + b.reordered,
    unchanged: a.unchanged + b.unchanged,
  }
}

function rollupStats(children: DiffNode[]): DiffStats {
  return children.reduce((acc, c) => addStats(acc, c.stats), EMPTY_STATS)
}

function leafStats(kind: ChangeKind): DiffStats {
  return { ...EMPTY_STATS, [kind]: 1 }
}

function getType(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function strictEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (getType(a) !== getType(b)) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

// ── Array diff helpers ────────────────────────────────────────────────────────

/**
 * Recursively normalize a value for hashing so that elements equal under
 * the given options produce identical JSON.stringify output.
 * - When ignoreArrayOrder: sort array items after normalizing them.
 * - When ignoreObjectKeyOrder: sort object entries by key.
 */
function normalizeForCompare(value: unknown, opts: DiffOptions): unknown {
  if (Array.isArray(value)) {
    const items = value.map(item => normalizeForCompare(item, opts))
    if (opts.ignoreArrayOrder) {
      return items.slice().sort((a, b) => {
        const sa = JSON.stringify(a) ?? ''
        const sb = JSON.stringify(b) ?? ''
        return sa < sb ? -1 : sa > sb ? 1 : 0
      })
    }
    return items
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const entries = Object.entries(obj).map(
      ([k, v]) => [k, normalizeForCompare(v, opts)] as [string, unknown]
    )
    if (opts.ignoreObjectKeyOrder) {
      entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    }
    return Object.fromEntries(entries)
  }
  return value
}

/**
 * Ordered array diff: match elements by index, recurse on each pair.
 * For extra elements in the longer array, emit added/removed.
 */
function diffArrayOrdered(
  a: unknown[],
  b: unknown[],
  path: string,
  opts: DiffOptions
): DiffNode[] {
  const len = Math.max(a.length, b.length)
  const children: DiffNode[] = []

  for (let i = 0; i < len; i++) {
    const childPath = `${path}[${i}]`
    if (i >= a.length) {
      children.push(addedNode(i, b[i], childPath))
    } else if (i >= b.length) {
      children.push(removedNode(i, a[i], childPath))
    } else {
      children.push(...diffAtKey(i, a[i], b[i], childPath, opts))
    }
  }

  return children
}

/**
 * Unordered array diff: match elements by value identity (JSON.stringify hash).
 * Exact matches → unchanged. Leftovers → added/removed.
 * Near-matches within objects are NOT attempted: unmatched objects show as remove+add.
 */
function diffArrayUnordered(
  a: unknown[],
  b: unknown[],
  path: string,
  opts: DiffOptions
): DiffNode[] {
  // Build hash → available indices map for B
  const bAvailable = new Map<string, number[]>()
  b.forEach((item, i) => {
    const h = JSON.stringify(normalizeForCompare(item, opts)) ?? 'undefined'
    const arr = bAvailable.get(h) ?? []
    arr.push(i)
    bAvailable.set(h, arr)
  })

  const matchedBIndices = new Set<number>()
  const unchangedA: Array<{ aIdx: number; bIdx: number }> = []
  const removedA: number[] = []

  // Match each A element to a B element
  for (let i = 0; i < a.length; i++) {
    const h = JSON.stringify(normalizeForCompare(a[i], opts)) ?? 'undefined'
    const available = bAvailable.get(h)
    if (available && available.length > 0) {
      const bIdx = available.shift()!
      matchedBIndices.add(bIdx)
      unchangedA.push({ aIdx: i, bIdx })
    } else {
      removedA.push(i)
    }
  }

  const addedB = b.map((_, i) => i).filter((i) => !matchedBIndices.has(i))
  const children: DiffNode[] = []

  // Emit unchanged matches
  for (const { aIdx } of unchangedA) {
    children.push(unchangedNode(aIdx, a[aIdx], `${path}[${aIdx}]`))
  }
  // Emit removed
  for (const i of removedA) {
    children.push(removedNode(i, a[i], `${path}[${i}]`))
  }
  // Emit added
  for (const i of addedB) {
    children.push(addedNode(i, b[i], `${path}[${i}]`))
  }

  return children
}

// ── Object diff ───────────────────────────────────────────────────────────────

function diffObject(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  path: string,
  opts: DiffOptions
): DiffNode[] {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  const allKeys = [...new Set([...aKeys, ...bKeys])]
  const children: DiffNode[] = []

  for (const key of allKeys) {
    const childPath = path ? `${path}.${key}` : key
    if (!(key in a)) {
      children.push(addedNode(key, b[key], childPath))
    } else if (!(key in b)) {
      children.push(removedNode(key, a[key], childPath))
    } else {
      children.push(...diffAtKey(key, a[key], b[key], childPath, opts))
    }
  }

  // Detect key-order change when ignoreObjectKeyOrder is false.
  // Compare the relative order of keys that exist in both objects —
  // this must run even when some keys are added or removed.
  if (!opts.ignoreObjectKeyOrder) {
    const aCommon = aKeys.filter((k) => k in b)
    const bCommon = bKeys.filter((k) => k in a)
    if (aCommon.join(',') !== bCommon.join(',')) {
      // Mark unchanged common-key children as reordered; leave added/removed as-is
      return children.map((c) =>
        c.kind === 'unchanged' && typeof c.key === 'string'
          ? { ...c, kind: 'reordered' as ChangeKind, stats: leafStats('reordered') }
          : c
      )
    }
  }

  return children
}

// ── Core recursive diff ───────────────────────────────────────────────────────

function diffAtKey(
  key: string | number,
  aVal: unknown,
  bVal: unknown,
  path: string,
  opts: DiffOptions
): DiffNode[] {
  const aType = getType(aVal)
  const bType = getType(bVal)

  // Same primitive / null
  if (aType === bType && aType !== 'object' && aType !== 'array') {
    if (strictEqual(aVal, bVal)) {
      return [unchangedNode(key, aVal, path)]
    }
    return [
      {
        key,
        path,
        kind: 'changed',
        oldValue: aVal,
        newValue: bVal,
        stats: leafStats('changed'),
      },
    ]
  }

  // Type changed (e.g. string → number, array → object)
  if (aType !== bType) {
    return [
      {
        key,
        path,
        kind: 'changed',
        oldValue: aVal,
        newValue: bVal,
        stats: leafStats('changed'),
      },
    ]
  }

  // Both are arrays
  if (aType === 'array') {
    const children = opts.ignoreArrayOrder
      ? diffArrayUnordered(aVal as unknown[], bVal as unknown[], path, opts)
      : diffArrayOrdered(aVal as unknown[], bVal as unknown[], path, opts)
    const stats = rollupStats(children)
    const kind: ChangeKind =
      stats.added === 0 && stats.removed === 0 && stats.changed === 0 && stats.reordered === 0
        ? 'unchanged'
        : 'changed'
    return [{ key, path, kind, children, stats }]
  }

  // Both are objects
  if (aType === 'object') {
    const children = diffObject(
      aVal as Record<string, unknown>,
      bVal as Record<string, unknown>,
      path,
      opts
    )
    const stats = rollupStats(children)
    const kind: ChangeKind =
      stats.added === 0 && stats.removed === 0 && stats.changed === 0 && stats.reordered === 0
        ? 'unchanged'
        : 'changed'
    return [{ key, path, kind, children, stats }]
  }

  return [unchangedNode(key, aVal, path)]
}

// ── Node constructors ─────────────────────────────────────────────────────────

function unchangedNode(key: string | number, value: unknown, path: string): DiffNode {
  return { key, path, kind: 'unchanged', oldValue: value, stats: leafStats('unchanged') }
}

function addedNode(key: string | number, value: unknown, path: string): DiffNode {
  return { key, path, kind: 'added', newValue: value, stats: leafStats('added') }
}

function removedNode(key: string | number, value: unknown, path: string): DiffNode {
  return { key, path, kind: 'removed', oldValue: value, stats: leafStats('removed') }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function diffJson(
  a: unknown,
  b: unknown,
  opts: DiffOptions
): DiffNode {
  const aType = getType(a)
  const bType = getType(b)

  if (aType !== bType) {
    return {
      key: null,
      path: '',
      kind: 'changed',
      oldValue: a,
      newValue: b,
      stats: leafStats('changed'),
    }
  }

  if (aType === 'array') {
    const children = opts.ignoreArrayOrder
      ? diffArrayUnordered(a as unknown[], b as unknown[], '$', opts)
      : diffArrayOrdered(a as unknown[], b as unknown[], '$', opts)
    const stats = rollupStats(children)
    const kind: ChangeKind =
      stats.added === 0 && stats.removed === 0 && stats.changed === 0 && stats.reordered === 0
        ? 'unchanged'
        : 'changed'
    return { key: null, path: '$', kind, children, stats }
  }

  if (aType === 'object') {
    const children = diffObject(
      a as Record<string, unknown>,
      b as Record<string, unknown>,
      '',
      opts
    )
    const stats = rollupStats(children)
    const kind: ChangeKind =
      stats.added === 0 && stats.removed === 0 && stats.changed === 0 && stats.reordered === 0
        ? 'unchanged'
        : 'changed'
    return { key: null, path: '', kind, children, stats }
  }

  // Root is a primitive
  if (strictEqual(a, b)) {
    return { key: null, path: '', kind: 'unchanged', oldValue: a, stats: leafStats('unchanged') }
  }
  return { key: null, path: '', kind: 'changed', oldValue: a, newValue: b, stats: leafStats('changed') }
}

export function summarize(root: DiffNode): DiffSummary {
  const s = root.stats
  return {
    added: s.added,
    removed: s.removed,
    changed: s.changed,
    reordered: s.reordered,
    total: s.added + s.removed + s.changed + s.reordered,
  }
}
