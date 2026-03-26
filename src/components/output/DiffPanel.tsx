import { useState, useMemo, useRef, useCallback, Suspense, lazy } from 'react'
import type { editor } from 'monaco-editor'
import { parseJson } from '@/lib/json-parser'
import { diffJson, summarize, type DiffOptions, type DiffNode } from '@/lib/json-diff'
import { DiffTreeNode } from './DiffTree'
import { Badge } from '@/components/ui/badge'
import { PanelInfo } from '@/components/ui/PanelInfo'
import { cn } from '@/lib/utils'
import type { ParseResult, ValidationError } from '@/types/json'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })))

interface Props {
  docA: ParseResult // the main editor JSON (left panel)
  isDark: boolean
}

function OptionToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            'h-4 w-7 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          )}
        />
      </div>
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </label>
  )
}

export function DiffPanel({ docA, isDark }: Props) {
  const [rawB, setRawB] = useState('')
  const editorBRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoBRef = useRef<typeof import('monaco-editor') | null>(null)
  const decorationsBRef = useRef<string[]>([])

  const applyBDecorations = useCallback(
    (ed: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor'), errs: ValidationError[]) => {
      decorationsBRef.current = ed.deltaDecorations(
        decorationsBRef.current,
        errs.map((err) => ({
          range: new monaco.Range(err.line, err.column, err.line, err.column + 1),
          options: {
            className: 'json-error-underline',
            hoverMessage: { value: `⚠️ ${err.plainEnglish}` },
            overviewRuler: { color: 'rgba(255,80,80,0.8)', position: monaco.editor.OverviewRulerLane.Right },
            inlineClassName: 'json-error-underline',
          },
        }))
      )
    },
    []
  )

  const handleBMount = useCallback(
    (ed: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      editorBRef.current = ed
      monacoBRef.current = monaco
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonLang = monaco.languages.json as any
        if (jsonLang?.jsonDefaults?.setDiagnosticsOptions) {
          jsonLang.jsonDefaults.setDiagnosticsOptions({ validate: false })
        }
      } catch { /* ignore */ }
    },
    []
  )

  const [hideUnchanged, setHideUnchanged] = useState(true)
  const [opts, setOpts] = useState<DiffOptions>({
    ignoreArrayOrder: false,
    ignoreObjectKeyOrder: true,
  })

  const docB = useMemo(() => parseJson(rawB, 2), [rawB])

  // Sync error decorations into the Monaco editor whenever docB changes
  if (editorBRef.current && monacoBRef.current) {
    applyBDecorations(editorBRef.current, monacoBRef.current, docB.errors)
  }

  const lastValidDiff = useRef<DiffNode | null>(null)
  const diffResult = useMemo(() => {
    if (!docA.valid || !docB.valid) return null
    const result = diffJson(docA.parsed, docB.parsed, opts)
    lastValidDiff.current = result
    return result
  }, [docA.valid, docA.parsed, docB.valid, docB.parsed, opts])

  const hasError = !docA.valid || (rawB.length > 0 && !docB.valid)
  const displayedDiff = diffResult ?? lastValidDiff.current
  const isStale = hasError && displayedDiff !== null

  const summary = useMemo(
    () => (displayedDiff ? summarize(displayedDiff) : null),
    [displayedDiff]
  )

  const isIdentical = summary?.total === 0

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PanelInfo
        title="Diff"
        description="Compare two JSON documents and see exactly what changed. Paste the second document into the right-hand editor. Green = added, red = removed, blue = reordered. Toggle the options below to ignore array order or object key order."
      />
      {/* Options bar */}
      <div className="shrink-0 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap gap-6">
          <OptionToggle
            checked={opts.ignoreArrayOrder}
            onChange={(v) => setOpts((o) => ({ ...o, ignoreArrayOrder: v }))}
            label="Ignore array order"
            description="Treat arrays as unordered sets"
          />
          <OptionToggle
            checked={opts.ignoreObjectKeyOrder}
            onChange={(v) => setOpts((o) => ({ ...o, ignoreObjectKeyOrder: v }))}
            label="Ignore object key order"
            description="Only flag value changes, not key reordering"
          />
          <OptionToggle
            checked={hideUnchanged}
            onChange={setHideUnchanged}
            label="Collapse unchanged"
            description="Hide nodes with no differences"
          />
        </div>
      </div>

      {/* Doc B input */}
      <div className="flex shrink-0 flex-col border-b" style={{ height: '38%' }}>
        <div className="flex items-center justify-between border-b bg-muted/20 px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Document B <span className="font-normal">(paste to compare)</span>
          </span>
          {rawB && !docB.valid && (
            <Badge variant="error" className="text-[10px]">
              Invalid JSON
            </Badge>
          )}
          {rawB && docB.valid && (
            <Badge variant="success" className="text-[10px]">
              Valid
            </Badge>
          )}
        </div>
        <div className="min-h-0 flex-1">
          <Suspense
            fallback={
              <textarea
                className="h-full w-full resize-none bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                value={rawB}
                onChange={(e) => setRawB(e.target.value)}
                placeholder={'Paste the second JSON document here…'}
                spellCheck={false}
              />
            }
          >
            <MonacoEditor
              height="100%"
              language="json"
              theme={isDark ? 'vs-dark' : 'vs'}
              value={rawB}
              onChange={(val) => setRawB(val ?? '')}
              onMount={handleBMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                fontSize: 12,
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                automaticLayout: true,
                tabSize: 2,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}
            />
          </Suspense>
        </div>
        {rawB && !docB.valid && docB.errors[0] && (
          <div className="shrink-0 border-t bg-red-50 px-3 py-1 font-mono text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
            Line {docB.errors[0].line}, Col {docB.errors[0].column}: {docB.errors[0].plainEnglish}
          </div>
        )}
      </div>

      {/* Diff output */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Summary bar */}
        {displayedDiff && summary !== null && (
          <div className={cn('flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2', isStale && 'opacity-50')}>
            {isIdentical ? (
              <Badge variant="success">Identical</Badge>
            ) : (
              <>
                {summary.added > 0 && (
                  <Badge variant="success">+{summary.added} added</Badge>
                )}
                {summary.removed > 0 && (
                  <Badge variant="error">−{summary.removed} removed</Badge>
                )}
                {summary.changed > 0 && (
                  <Badge variant="warning">~{summary.changed} changed</Badge>
                )}
                {summary.reordered > 0 && (
                  <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    ⇄{summary.reordered} reordered
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Diff tree / empty states */}
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {/* Empty states — only shown when there's no previous valid diff to display */}
          {!displayedDiff && !docA.valid && (
            <p className="p-4 text-sm text-muted-foreground">
              Fix the errors in Document A (left panel) first.
            </p>
          )}
          {!displayedDiff && docA.valid && !rawB && (
            <p className="p-4 text-sm text-muted-foreground">
              Paste a second JSON document above to see the diff.
            </p>
          )}
          {!displayedDiff && docA.valid && rawB && !docB.valid && (
            <p className="p-4 text-sm text-muted-foreground">
              Fix the errors in Document B to see the diff.
            </p>
          )}
          {/* Stale-diff notice */}
          {isStale && (
            <p className="mb-2 px-2 text-xs italic text-muted-foreground">
              Showing last valid diff
            </p>
          )}
          {displayedDiff && (
            <div className={cn(isStale && 'pointer-events-none opacity-50')}>
              <DiffTreeNode node={displayedDiff} depth={0} hideUnchanged={hideUnchanged} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
