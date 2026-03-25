import { dump as yamlDump } from 'js-yaml'
import { stringify as tomlStringify } from 'smol-toml'
import { generateSchema } from './schema-generator'

// ─── XML ────────────────────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Sanitise a JSON key so it's a valid XML element name. */
function safeTag(key: string): string {
  const s = key.replace(/[^a-zA-Z0-9._-]/g, '_')
  return /^[^a-zA-Z_]/.test(s) ? `_${s}` : s
}

function xmlNode(value: unknown, tag: string, indent: string): string {
  const i2 = indent + '  '
  if (value === null) return `${indent}<${tag} xsi:nil="true"/>`
  if (typeof value === 'boolean' || typeof value === 'number')
    return `${indent}<${tag}>${value}</${tag}>`
  if (typeof value === 'string') return `${indent}<${tag}>${xmlEscape(value)}</${tag}>`
  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}<${tag}/>`
    return value.map((item) => xmlNode(item, tag, indent)).join('\n')
  }
  if (typeof value === 'object') {
    const children = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => {
        const t = safeTag(k)
        if (Array.isArray(v))
          return (v as unknown[]).map((item) => xmlNode(item, t, i2)).join('\n')
        return xmlNode(v, t, i2)
      })
      .join('\n')
    return `${indent}<${tag}>\n${children}\n${indent}</${tag}>`
  }
  return `${indent}<${tag}>${String(value)}</${tag}>`
}

export function toXml(parsed: unknown): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlNode(parsed, 'root', '')}`
}

// ─── YAML ───────────────────────────────────────────────────────────────────

export function toYaml(parsed: unknown): string {
  return yamlDump(parsed, { indent: 2, lineWidth: -1, noRefs: true })
}

// ─── TOML ───────────────────────────────────────────────────────────────────

export function toToml(parsed: unknown): string {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    throw new Error('TOML requires a root-level object (not an array or primitive).')
  return tomlStringify(parsed as Record<string, unknown>)
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export function toSchema(parsed: unknown): string {
  return JSON.stringify(generateSchema(parsed), null, 2)
}

// ─── JSDoc ───────────────────────────────────────────────────────────────────

function jsDocTypeName(value: unknown, hint: string, defs: Map<string, string>): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') return 'string'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Array<unknown>'
    const itemType = jsDocTypeName(value[0], hint + 'Item', defs)
    return `${itemType}[]`
  }
  if (typeof value === 'object') {
    const typeName = hint.charAt(0).toUpperCase() + hint.slice(1)
    if (!defs.has(typeName)) {
      // Reserve first to handle circular-ish structures
      defs.set(typeName, '')
      const obj = value as Record<string, unknown>
      const lines = [`/**`, ` * @typedef {Object} ${typeName}`]
      for (const [k, v] of Object.entries(obj)) {
        const childType = jsDocTypeName(v, k, defs)
        lines.push(` * @property {${childType}} ${k}`)
      }
      lines.push(` */`)
      defs.set(typeName, lines.join('\n'))
    }
    return typeName
  }
  return 'unknown'
}

export function toJsDoc(parsed: unknown): string {
  const defs = new Map<string, string>()
  jsDocTypeName(parsed, 'Root', defs)
  return [...defs.values()].join('\n\n')
}
