import { useRef, useCallback, Suspense, lazy } from 'react'
import type { editor } from 'monaco-editor'
import type { ValidationError } from '@/types/json'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })))

interface Props {
  value: string
  onChange: (value: string) => void
  errors: ValidationError[]
  highlightedPaths?: Set<string>
  isDark: boolean
}

export function JsonEditor({ value, onChange, errors, isDark }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)

  const handleEditorMount = useCallback(
    (ed: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      editorRef.current = ed
      monacoRef.current = monaco

      // Disable Monaco's built-in JSON validation to avoid conflicts
      // (jsonDefaults exists in older monaco versions; skip if unavailable)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonLang = monaco.languages.json as any
        if (jsonLang?.jsonDefaults?.setDiagnosticsOptions) {
          jsonLang.jsonDefaults.setDiagnosticsOptions({ validate: false })
        }
      } catch {
        // ignore
      }

      // Apply initial decorations
      applyDecorations(ed, monaco, errors)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const applyDecorations = (
    ed: editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor'),
    errs: ValidationError[]
  ) => {
    const newDecorations = errs.map((err) => ({
      range: new monaco.Range(err.line, err.column, err.line, err.column + 1),
      options: {
        className: 'json-error-underline',
        hoverMessage: { value: `⚠️ ${err.plainEnglish}` },
        overviewRuler: {
          color: 'rgba(255, 80, 80, 0.8)',
          position: monaco.editor.OverviewRulerLane.Right,
        },
        minimap: { color: 'rgba(255, 80, 80, 0.8)', position: 1 },
        isWholeLine: false,
        inlineClassName: 'json-error-underline',
      },
    }))

    decorationsRef.current = ed.deltaDecorations(decorationsRef.current, newDecorations)
  }

  // Update decorations when errors change
  const handleEditorChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? '')
    },
    [onChange]
  )

  // Update decorations after render
  if (editorRef.current && monacoRef.current) {
    applyDecorations(editorRef.current, monacoRef.current, errors)
  }

  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <textarea
            className="h-full w-full resize-none bg-background p-4 font-mono text-sm text-foreground focus:outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste or type your JSON here…"
            spellCheck={false}
          />
        }
      >
        <MonacoEditor
          height="100%"
          language="json"
          theme={isDark ? 'vs-dark' : 'vs'}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 13,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            renderLineHighlight: 'line',
            automaticLayout: true,
            tabSize: 2,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          }}
        />
      </Suspense>
    </div>
  )
}
