// Maps raw SyntaxError message patterns to plain-English explanations

interface ErrorPattern {
  pattern: RegExp
  explain: (match: RegExpMatchArray) => string
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /Unexpected token '?}'/i,
    explain: () =>
      'Found a closing brace `}` with no matching opening brace `{` before it. Check for extra or misplaced `}`.',
  },
  {
    pattern: /Unexpected token '?]'/i,
    explain: () =>
      'Found a closing bracket `]` with no matching opening bracket `[` before it. Check for extra or misplaced `]`.',
  },
  {
    pattern: /Expected ','|Expected ',' or '}'/i,
    explain: () => 'A comma is missing between two properties or array items.',
  },
  {
    pattern: /Unexpected end of (JSON )?input/i,
    explain: () =>
      'The JSON is cut off — it looks incomplete. Check for unclosed `{`, `[`, or an unterminated string `"`.',
  },
  {
    pattern: /Unexpected token '?u'?/i,
    explain: () =>
      'Found `undefined` which is not valid JSON. Use `null` instead, or remove the value entirely.',
  },
  {
    pattern: /Unexpected token '?''/i,
    explain: () =>
      "Single quotes `'` are not valid in JSON. Strings must use double quotes `\"`.",
  },
  {
    pattern: /Unexpected token '?\/'/i,
    explain: () =>
      'Found a `/` — JSON does not support comments. Remove the `//` or `/* */` comment.',
  },
  {
    pattern: /Unexpected token '?(\w+)'?/i,
    explain: (match) => {
      const tok = match[1]
      if (tok === 'True' || tok === 'False')
        return `\`${tok}\` should be lowercase: \`${tok.toLowerCase()}\`.`
      if (tok === 'None') return '`None` is Python syntax. Use `null` in JSON.'
      if (tok === 'NaN' || tok === 'Infinity')
        return `\`${tok}\` is not a valid JSON value. Use a number or \`null\`.`
      return `Unexpected token \`${tok}\`. Make sure all strings are quoted and values are valid JSON.`
    },
  },
  {
    pattern: /Bad control character in string/i,
    explain: () =>
      'A string contains a literal newline or control character. Use `\\n` or `\\t` escape sequences instead.',
  },
  {
    pattern: /Invalid escape/i,
    explain: () =>
      'An invalid escape sequence was found inside a string. Valid escapes: `\\n`, `\\t`, `\\r`, `\\\\`, `\\"`, `\\/`, `\\b`, `\\f`, `\\uXXXX`.',
  },
  {
    pattern: /Unterminated string/i,
    explain: () => 'A string was opened with `"` but never closed. Add the closing `"`.',
  },
  {
    pattern: /Duplicate key/i,
    explain: () =>
      'Two properties have the same key. JSON technically allows this but most parsers use only the last value — consider renaming one.',
  },
]

export function toPlainEnglish(rawMessage: string): string {
  for (const { pattern, explain } of ERROR_PATTERNS) {
    const match = rawMessage.match(pattern)
    if (match) return explain(match)
  }
  // fallback: clean up the raw message
  return rawMessage.replace(/^JSON.parse:\s*/i, '').replace(/\s+at line \d+ column \d+.*$/i, '')
}
