import { Braces, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/toolbar/ShareButton'
import type { ToolMode, IndentWidth } from '@/types/state'

const TABS: { id: ToolMode; label: string }[] = [
  { id: 'prettify', label: 'Prettify' },
  { id: 'minify', label: 'Minify' },
  { id: 'validate', label: 'Validate' },
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
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
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
