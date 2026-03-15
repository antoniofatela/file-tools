import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ParseResult } from '@/types/json'

interface Props {
  parseResult: ParseResult
  hasInput: boolean
}

export function ValidatePanel({ parseResult, hasInput }: Props) {
  if (!hasInput) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Paste or type JSON in the left panel to validate it.
      </div>
    )
  }

  if (parseResult.valid) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-green-700 dark:text-green-400">Valid JSON</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your JSON is well-formed and ready to use.
          </p>
        </div>
        {parseResult.parsed !== null && (
          <Badge variant="secondary" className="text-sm">
            {Array.isArray(parseResult.parsed)
              ? `Array with ${(parseResult.parsed as unknown[]).length} items`
              : typeof parseResult.parsed === 'object'
                ? `Object with ${Object.keys(parseResult.parsed as object).length} keys`
                : `${typeof parseResult.parsed} value`}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="font-medium text-red-600 dark:text-red-400">
          {parseResult.errors.length} error{parseResult.errors.length !== 1 ? 's' : ''} found
        </span>
      </div>
      <div className="space-y-3">
        {parseResult.errors.map((err, i) => (
          <div
            key={i}
            className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40"
          >
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="error">
                Line {err.line}, Col {err.column}
              </Badge>
            </div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{err.plainEnglish}</p>
            <p className="mt-1 font-mono text-xs text-red-500 dark:text-red-400">{err.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
