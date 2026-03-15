import { HelpCircle, Lightbulb } from 'lucide-react'
import type { DiagnosticResult } from '@/lib/jsonpath'

interface Props {
  diagnostic: DiagnosticResult
  query: string
}

export function WhyNoResults({ diagnostic, query }: Props) {
  if (!query.trim()) return null

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="flex items-start gap-2">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Why no results?
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">{diagnostic.message}</p>
          {diagnostic.suggestion && (
            <div className="flex items-start gap-1.5 text-sm text-amber-600 dark:text-amber-500">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{diagnostic.suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
