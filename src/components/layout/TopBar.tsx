import { Braces, Moon, Sun, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/toolbar/ShareButton'
import { cn } from '@/lib/utils'
import type { ToolMode, IndentWidth } from '@/types/state'

const TABS: { id: ToolMode; label: string }[] = [
  { id: 'prettify', label: 'Prettify' },
  { id: 'minify', label: 'Minify' },
  { id: 'tree', label: 'Tree' },
  { id: 'jsonpath', label: 'JSONPath' },
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
      <nav className="flex items-center rounded-lg border bg-muted p-1">
        {/* Error indicator — shown instead of normal tabs when JSON is invalid */}
        {hasErrors && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-950/60 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Errors
          </div>
        )}
        {TABS.map((tab) => (
          <button
            key={tab.id}
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
        ))}
      </nav>

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
