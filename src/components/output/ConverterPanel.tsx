import { useMemo, useState, Suspense, lazy } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanelInfo } from '@/components/ui/PanelInfo'
import { useClipboard } from '@/hooks/useClipboard'
import { toJsDoc, toSchema, toToml, toXml, toYaml } from '@/lib/converters'
import type { ParseResult } from '@/types/json'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })))

type Format = 'jsdoc' | 'schema' | 'toml' | 'xml' | 'yaml'

const FORMATS: { id: Format; label: string; language: string }[] = [
  { id: 'jsdoc',  label: 'JSDoc',   language: 'javascript' },
  { id: 'schema', label: 'Schema',  language: 'json' },
  { id: 'toml',   label: 'TOML',    language: 'ini' },
  { id: 'xml',    label: 'XML',     language: 'xml' },
  { id: 'yaml',   label: 'YAML',    language: 'yaml' },
]

interface Props {
  parseResult: ParseResult
  isDark: boolean
}

export function ConverterPanel({ parseResult, isDark }: Props) {
  const [format, setFormat] = useState<Format>('yaml')
  const { copy, copied } = useClipboard()

  const { output, error } = useMemo(() => {
    if (!parseResult.valid || parseResult.parsed === undefined)
      return { output: '', error: null }
    try {
      let out: string
      switch (format) {
        case 'jsdoc':  out = toJsDoc(parseResult.parsed);  break
        case 'schema': out = toSchema(parseResult.parsed); break
        case 'toml':   out = toToml(parseResult.parsed);   break
        case 'xml':    out = toXml(parseResult.parsed);    break
        case 'yaml':   out = toYaml(parseResult.parsed);   break
      }
      return { output: out, error: null }
    } catch (e) {
      return { output: '', error: String(e).replace(/^Error:\s*/i, '').trim() }
    }
  }, [format, parseResult.valid, parseResult.parsed])

  const language = FORMATS.find((f) => f.id === format)?.language ?? 'plaintext'

  if (!parseResult.valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Fix the JSON errors to use the converter.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PanelInfo
        title="Convert"
        description="Export your JSON in another format. Choose from the dropdown: YAML (human-friendly), XML (with a root element), TOML (config-file format, requires a root object), JSON Schema Draft-07 (inferred from your data), or JSDoc @typedef blocks."
      />
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="convert-format">
            Convert to
          </label>
          <select
            id="convert-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="rounded-md border bg-background px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!!error || !output}
          onClick={() => copy(output)}
          className="gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Output */}
      <div className="min-h-0 flex-1">
        {error ? (
          <div className="p-4 font-mono text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <Suspense
            fallback={
              <pre className="h-full overflow-auto bg-background p-4 font-mono text-xs">
                {output}
              </pre>
            }
          >
            <MonacoEditor
              height="100%"
              language={language}
              theme={isDark ? 'vs-dark' : 'vs'}
              value={output}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                fontSize: 12,
                lineNumbers: 'on',
                folding: true,
                automaticLayout: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}
