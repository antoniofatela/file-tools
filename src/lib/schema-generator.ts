// Generates a JSON Schema (draft-07) from a parsed JSON value

export interface JsonSchema {
  $schema?: string
  title?: string
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  additionalProperties?: boolean
  required?: string[]
  items?: JsonSchema
  examples?: unknown[]
  enum?: unknown[]
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

type JsonType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null'

function detectType(value: unknown): JsonType {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number'
  if (typeof value === 'string') return 'string'
  if (Array.isArray(value)) return 'array'
  return 'object'
}

function detectStringFormat(value: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date-time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return 'time'
  if (/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value)) return 'email'
  if (/^https?:\/\/.+/.test(value)) return 'uri'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid'
  return undefined
}

/**
 * Merge an array of schemas for array items — produces a unified schema.
 * If all items share the same type, that type is used. If mixed, uses anyOf.
 */
function mergeItemSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 0) return {}
  if (schemas.length === 1) return schemas[0]

  const types = new Set(schemas.map((s) => (Array.isArray(s.type) ? s.type.join('|') : s.type)))
  const allSameType = types.size === 1

  if (!allSameType) {
    // Mixed types — just return a type union
    const allTypes = [...new Set(schemas.flatMap((s) => (Array.isArray(s.type) ? s.type : s.type ? [s.type] : [])))]
    return allTypes.length > 0 ? { type: allTypes.length === 1 ? (allTypes[0] as string) : (allTypes as string[]) } : {}
  }

  // Same type — merge object schemas deeply
  const firstType = schemas[0].type
  if (firstType !== 'object') return schemas[0]

  // Collect all keys across all object schemas
  const allKeys = new Set(schemas.flatMap((s) => Object.keys(s.properties ?? {})))
  const mergedProperties: Record<string, JsonSchema> = {}

  for (const key of allKeys) {
    const subSchemas = schemas.filter((s) => s.properties?.[key]).map((s) => s.properties![key])
    mergedProperties[key] = subSchemas.length > 0 ? mergeItemSchemas(subSchemas) : {}
  }

  // Only require keys present in ALL items
  const requiredKeys = [...allKeys].filter((key) => schemas.every((s) => s.properties?.[key] !== undefined))

  const merged: JsonSchema = { type: 'object', properties: mergedProperties, additionalProperties: false }
  if (requiredKeys.length > 0) merged.required = requiredKeys
  return merged
}

function schemaFromValue(value: unknown, depth: number): JsonSchema {
  if (depth > 20) return {}

  const type = detectType(value)

  if (type === 'null') return { type: 'null' }
  if (type === 'boolean') return { type: 'boolean' }

  if (type === 'integer') {
    const schema: JsonSchema = { type: 'integer' }
    const n = value as number
    schema.examples = [n]
    return schema
  }

  if (type === 'number') {
    const schema: JsonSchema = { type: 'number' }
    const n = value as number
    schema.examples = [n]
    return schema
  }

  if (type === 'string') {
    const s = value as string
    const schema: JsonSchema = { type: 'string' }
    const fmt = detectStringFormat(s)
    if (fmt) schema.format = fmt
    if (s.length > 0 && s.length < 80) schema.examples = [s]
    return schema
  }

  if (type === 'array') {
    const arr = value as unknown[]
    if (arr.length === 0) return { type: 'array', items: {} }
    // Sample up to 20 items for performance
    const sample = arr.slice(0, 20)
    const itemSchemas = sample.map((item) => schemaFromValue(item, depth + 1))
    return { type: 'array', items: mergeItemSchemas(itemSchemas) }
  }

  // object
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
  if (keys.length === 0) return { type: 'object', additionalProperties: true }

  const properties: Record<string, JsonSchema> = {}
  for (const key of keys) {
    const childValue = obj[key]
    const childType = detectType(childValue)
    let childSchema = schemaFromValue(childValue, depth + 1)

    // If child can be null, wrap type to allow null
    if (childType === 'null') {
      childSchema = { type: 'null' }
    } else if (childValue === null) {
      const base = schemaFromValue(childValue, depth + 1)
      const baseType = Array.isArray(base.type) ? base.type : base.type ? [base.type] : []
      childSchema = { ...base, type: [...baseType, 'null'] as string[] }
    }

    properties[key] = childSchema
  }

  return {
    type: 'object',
    properties,
    required: keys,
    additionalProperties: false,
  }
}

export function generateSchema(parsed: unknown): JsonSchema {
  const schema = schemaFromValue(parsed, 0)
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...schema,
  }
}
