import { useState, useEffect, useCallback } from 'react'
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'F' || e.key === 'f') {
          e.preventDefault()
          setActiveTab('prettify')
        } else if (e.key === 'M' || e.key === 'm') {
          e.preventDefault()
          setActiveTab('minify')
        }
      }
    },
    [setActiveTab]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const hasInput = rawJson.trim().length > 0

  // If no input yet, show empty state with textarea; once there's input switch to Monaco
  const leftPanelFinal = hasInput ? (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <JsonEditor
          value={rawJson}
          onChange={setRawJson}
          errors={parseResult.errors}
          isDark={isDark}
        />
      </div>
      <ValidationBanner parseResult={parseResult} hasInput={hasInput} />
      <EditorStatusBar rawJson={rawJson} parseResult={parseResult} />
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <textarea
          className="h-full w-full resize-none bg-background p-4 font-mono text-sm text-foreground focus:outline-none"
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          placeholder="Paste or type your JSON here…"
          spellCheck={false}
        />
      </div>
      <EmptyState onSelect={setRawJson} />
      <EditorStatusBar rawJson={rawJson} parseResult={parseResult} />
    </div>
  )

  const rightPanel = (
    <div className="flex h-full flex-col">
      {activeTab === 'prettify' && (
        <PrettifyPanel
          parseResult={parseResult}
          indentWidth={indentWidth}
          onIndentChange={setIndentWidth}
          isDark={isDark}
        />
      )}
      {activeTab === 'minify' && <MinifyPanel parseResult={parseResult} />}
      {activeTab === 'validate' && (
        <ValidatePanel parseResult={parseResult} hasInput={hasInput} />
      )}
      {activeTab === 'tree' && (
        <TreePanel
          parseResult={parseResult}
          collapsedPaths={collapsedPaths}
          onToggle={toggleCollapsed}
          highlightedPaths={
            activeTab === 'tree' ? highlightedPaths : new Set<string>()
          }
          onSelectPath={setSelectedNodePath}
        />
      )}
      {activeTab === 'jsonpath' && (
        <JsonPathPanel
          query={jsonPathQuery}
          onQueryChange={setJsonPathQuery}
          results={pathResults}
          diagnostic={pathDiagnostic}
          hasValidJson={parseResult.valid}
          selectedPath={selectedNodePath}
          onSelectPath={setSelectedNodePath}
        />
      )}
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
      />
      <PanelSplit left={leftPanelFinal} right={rightPanel} className="flex-1" />
      <Toaster />
    </div>
  )
}
