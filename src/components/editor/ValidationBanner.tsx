import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParseResult } from '@/types/json'

interface Props {
  parseResult: ParseResult
  hasInput: boolean
}

export function ValidationBanner({ parseResult, hasInput }: Props) {
  if (!hasInput) return null

  if (parseResult.valid) {
    return (
      <div className="flex items-center gap-2 border-t border-green-200 bg-green-50 px-4 py-1.5 text-xs text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Valid JSON</span>
      </div>
    )
  }

  const err = parseResult.errors[0]
  if (!err) return null

  return (
    <div
      className={cn(
        'flex items-start gap-2 border-t border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-700',
        'dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
      )}
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <span className="font-medium">
          Line {err.line}, Column {err.column}:{' '}
        </span>
        <span>{err.plainEnglish}</span>
      </div>
    </div>
  )
}
