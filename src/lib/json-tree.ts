import type { TreeNode } from '@/types/json'
import { MAX_TREE_DEPTH, MAX_TREE_NODES } from '@/constants/defaults'

let nodeCount = 0

function getType(value: unknown): TreeNode['type'] {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value as 'string' | 'number' | 'boolean'
}

function buildNode(
  key: string | number,
  value: unknown,
  dotPath: string,
  depth: number
): TreeNode {
  nodeCount++
  const type = getType(value)

  if (
    depth >= MAX_TREE_DEPTH ||
    nodeCount >= MAX_TREE_NODES ||
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'null'
  ) {
    return { key, value, type, children: [], dotPath, depth }
  }

  const children: TreeNode[] = []
  if (type === 'array') {
    const arr = value as unknown[]
    for (let i = 0; i < arr.length && nodeCount < MAX_TREE_NODES; i++) {
      const childPath = `${dotPath}[${i}]`
      children.push(buildNode(i, arr[i], childPath, depth + 1))
    }
  } else {
    const obj = value as Record<string, unknown>
    for (const k of Object.keys(obj)) {
      if (nodeCount >= MAX_TREE_NODES) break
      // Use bracket notation for keys with special chars, dot notation otherwise
      const needsBracket = /[^a-zA-Z0-9_$]/.test(k) || /^\d/.test(k)
      const childPath = dotPath
        ? needsBracket
          ? `${dotPath}["${k}"]`
          : `${dotPath}.${k}`
        : needsBracket
          ? `["${k}"]`
          : k
      children.push(buildNode(k, obj[k], childPath, depth + 1))
    }
  }

  return { key, value, type, children, dotPath, depth }
}

export function buildTree(parsed: unknown): { nodes: TreeNode[]; truncated: boolean } {
  nodeCount = 0

  if (parsed === null || parsed === undefined) return { nodes: [], truncated: false }

  const type = getType(parsed)

  if (type !== 'object' && type !== 'array') {
    return {
      nodes: [buildNode('root', parsed, '$', 0)],
      truncated: false,
    }
  }

  const root = buildNode('$', parsed, '$', 0)
  const truncated = nodeCount >= MAX_TREE_NODES
  return { nodes: [root], truncated }
}
