import type { ParseResult, ValidationError } from '@/types/json'
import type { IndentWidth } from '@/types/state'
import { toPlainEnglish } from './error-messages'

interface ErrorLocation {
  line: number
  column: number
  offset: number
}

/**
 * Extract line/column from a native SyntaxError.
 * Chrome: "Unexpected token ... at position N" (character offset)
 * Firefox/Safari: "JSON.parse: ... at line L column C of the JSON data"
 */
function extractLocation(message: string, source: string): ErrorLocation {
  // Firefox/Safari pattern: "at line L column C"
  const ffMatch = message.match(/at line (\d+) column (\d+)/i)
  if (ffMatch) {
    const line = parseInt(ffMatch[1], 10)
    const column = parseInt(ffMatch[2], 10)
    return { line, column, offset: lineColToOffset(source, line, column) }
  }

  // Chrome pattern: "at position N"
  const chromeMatch = message.match(/at position (\d+)/i)
  if (chromeMatch) {
    const offset = parseInt(chromeMatch[1], 10)
    const { line, column } = offsetToLineCol(source, offset)
    return { line, column, offset }
  }

  // Node.js pattern: "at position N" (same as Chrome)
  // V8 newer: "Unexpected non-whitespace character after JSON at position N"
  const v8Match = message.match(/position (\d+)/i)
  if (v8Match) {
    const offset = parseInt(v8Match[1], 10)
    const { line, column } = offsetToLineCol(source, offset)
    return { line, column, offset }
  }

  return { line: 1, column: 1, offset: 0 }
}

function offsetToLineCol(source: string, offset: number): { line: number; column: number } {
  const before = source.slice(0, Math.min(offset, source.length))
  const lines = before.split('\n')
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 }
}

function lineColToOffset(source: string, line: number, column: number): number {
  const lines = source.split('\n')
  let offset = 0
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += (lines[i]?.length ?? 0) + 1 // +1 for newline
  }
  offset += column - 1
  return offset
}

export function parseJson(rawJson: string, indentWidth: IndentWidth): ParseResult {
  if (!rawJson.trim()) {
    return { valid: false, parsed: null, formatted: '', minified: '', errors: [] }
  }

  try {
    const parsed = JSON.parse(rawJson)
    const spaces = indentWidth === 'tab' ? '\t' : indentWidth
    const formatted = JSON.stringify(parsed, null, spaces)
    const minified = JSON.stringify(parsed)
    return { valid: true, parsed, formatted, minified, errors: [] }
  } catch (e) {
    const err = e as SyntaxError
    const loc = extractLocation(err.message, rawJson)
    const error: ValidationError = {
      message: err.message,
      plainEnglish: toPlainEnglish(err.message),
      line: loc.line,
      column: loc.column,
      offset: loc.offset,
    }
    return { valid: false, parsed: null, formatted: '', minified: '', errors: [error] }
  }
}
