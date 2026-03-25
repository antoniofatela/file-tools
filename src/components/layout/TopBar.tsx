import { Braces, Moon, Sun, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ShareButton } from '@/components/toolbar/ShareButton'
import { cn } from '@/lib/utils'
import type { ToolMode, IndentWidth } from '@/types/state'

const TABS: { id: ToolMode; label: string; description: string }[] = [
  { id: 'prettify',   label: 'Prettify',    description: 'Format JSON with configurable indentation' },
  { id: 'minify',     label: 'Minify',      description: 'Strip all whitespace to produce the smallest JSON' },
  { id: 'tree',       label: 'Tree',        description: 'Browse JSON as an interactive, collapsible tree' },
  { id: 'jsonpath',   label: 'JSONPath',    description: 'Query values using JSONPath expressions (e.g. $.store.book[*].title)' },
  { id: 'jsonquery',  label: 'JSON Query',  description: 'Transform JSON with the jsonquery language — filter, sort, pick, map and more' },
  { id: 'convert',    label: 'Convert',     description: 'Export JSON as YAML, XML, TOML, JSON Schema, or JSDoc' },
  { id: 'diff',       label: 'Diff',        description: 'Compare two JSON documents and highlight every difference' },
]

interface Props {
  activeTab: ToolMode
  onTabChange: (tab: ToolMode) => void
  rawJson: string
  indentWidth: IndentWidth
  jsonPathQuery: string
  selectedNodePath: string | null
  isDark: boolean
  onToggleDark: () => void
  hasErrors: boolean
}

export function TopBar({
  activeTab,
  onTabChange,
  rawJson,
  indentWidth,
  jsonPathQuery,
  selectedNodePath,
  isDark,
  onToggleDark,
  hasErrors,
}: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Braces className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">JSON Toolbox</span>
      </div>

      {/* Tab navigation */}
      <TooltipProvider delayDuration={400}>
        <nav className="flex items-center rounded-lg border bg-muted p-1">
          {/* Error indicator — shown instead of normal tabs when JSON is invalid */}
          {hasErrors && (
            <div className="flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-950/60 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Errors
            </div>
          )}
          {TABS.map((tab) => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(tab.id)}
                  disabled={hasErrors}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                    hasErrors
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{tab.description}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ShareButton
          rawJson={rawJson}
          activeTab={activeTab}
          indentWidth={indentWidth}
          jsonPathQuery={jsonPathQuery}
          selectedNodePath={selectedNodePath}
        />
        <Button variant="ghost" size="icon" onClick={onToggleDark} title="Toggle dark mode">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
