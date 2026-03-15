export interface ValidationError {
  message: string
  plainEnglish: string
  line: number
  column: number
  offset: number
}

export interface ParseResult {
  valid: boolean
  parsed: unknown | null
  formatted: string
  minified: string
  errors: ValidationError[]
}

export interface TreeNode {
  key: string | number
  value: unknown
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  children: TreeNode[]
  dotPath: string
  depth: number
}

export interface PathResult {
  value: unknown
  path: string
  dotPath: string
}
