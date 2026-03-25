import { useState, useEffect } from 'react'
import { TopBar } from './TopBar'
import { PanelSplit } from './PanelSplit'
import { EmptyState } from './EmptyState'
import { JsonEditor } from '@/components/editor/JsonEditor'
import { ValidationBanner } from '@/components/editor/ValidationBanner'
import { EditorStatusBar } from '@/components/editor/EditorStatusBar'
import { PrettifyPanel } from '@/components/output/PrettifyPanel'
import { MinifyPanel } from '@/components/output/MinifyPanel'
import { ValidatePanel } from '@/components/output/ValidatePanel'
import { TreePanel } from '@/components/tree/TreePanel'
import { JsonPathPanel } from '@/components/jsonpath/JsonPathPanel'
import { JqPanel } from '@/components/jq/JqPanel'
import { SchemaPanel } from '@/components/output/SchemaPanel'
import { DiffPanel } from '@/components/output/DiffPanel'
import { useAppState } from '@/hooks/useAppState'
import { Toaster } from '@/components/ui/toaster'

export function AppShell() {
  const {
    rawJson,
    setRawJson,
    activeTab,
    setActiveTab,
    indentWidth,
    setIndentWidth,
    jsonPathQuery,
    setJsonPathQuery,
    selectedNodePath,
    setSelectedNodePath,
    collapsedPaths,
    toggleCollapsed,
    parseResult,
    pathResults,
    pathDiagnostic,
    highlightedPaths,
  } = useAppState()

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('json-toolbox-dark')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('json-toolbox-dark', String(isDark))
  }, [isDark])

  const hasInput = rawJson.trim().length > 0

  // ── Left panel ─────────────────────────────────────────────────────────────
  // Always show the editor area as the primary focus. EmptyState is a thin strip
  // below the editor (only shown when empty) — it never overlays the input area.
  const leftPanel = (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        {hasInput ? (
          <JsonEditor
            value={rawJson}
            onChange={setRawJson}
            errors={parseResult.errors}
            isDark={isDark}
          />
        ) : (
          <textarea
            autoFocus
            className="h-full w-full resize-none bg-background p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder={'Paste or type your JSON here…\n\n{\n  "example": true\n}'}
            spellCheck={false}
          />
        )}
      </div>

      {/* Thin example strip — only while input is empty */}
      {!hasInput && <EmptyState onSelect={setRawJson} />}

      {/* Status banners — always at the bottom */}
      <ValidationBanner parseResult={parseResult} hasInput={hasInput} />
      <EditorStatusBar rawJson={rawJson} parseResult={parseResult} />
    </div>
  )

  // ── Right panel ────────────────────────────────────────────────────────────
  // When JSON is invalid, always show the error details regardless of active tab.
  // When valid (or no input), show the selected tool.
  const showErrors = hasInput && !parseResult.valid && activeTab !== 'diff'

  const rightPanel = (
    <div className="flex h-full flex-col">
      {showErrors ? (
        <ValidatePanel parseResult={parseResult} hasInput={hasInput} />
      ) : activeTab === 'prettify' ? (
        <PrettifyPanel
          parseResult={parseResult}
          indentWidth={indentWidth}
          onIndentChange={setIndentWidth}
          isDark={isDark}
        />
      ) : activeTab === 'minify' ? (
        <MinifyPanel parseResult={parseResult} />
      ) : activeTab === 'tree' ? (
        <TreePanel
          parseResult={parseResult}
          collapsedPaths={collapsedPaths}
          onToggle={toggleCollapsed}
          highlightedPaths={highlightedPaths}
          onSelectPath={setSelectedNodePath}
        />
      ) : activeTab === 'jsonpath' ? (
        <JsonPathPanel
          query={jsonPathQuery}
          onQueryChange={setJsonPathQuery}
          results={pathResults}
          diagnostic={pathDiagnostic}
          hasValidJson={parseResult.valid}
          selectedPath={selectedNodePath}
          onSelectPath={setSelectedNodePath}
        />
      ) : activeTab === 'jq' ? (
        <JqPanel parseResult={parseResult} isDark={isDark} />
      ) : activeTab === 'schema' ? (
        <SchemaPanel parseResult={parseResult} isDark={isDark} />
      ) : activeTab === 'diff' ? (
        <DiffPanel docA={parseResult} isDark={isDark} />
      ) : null}
    </div>
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rawJson={rawJson}
        indentWidth={indentWidth}
        jsonPathQuery={jsonPathQuery}
        selectedNodePath={selectedNodePath}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        hasErrors={showErrors}
      />
      <PanelSplit left={leftPanel} right={rightPanel} className="flex-1" />
      <Toaster />
    </div>
  )
}
