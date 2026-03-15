import { Copy, Check } from 'lucide-react'
import { useClipboard } from '@/hooks/useClipboard'
import { cn } from '@/lib/utils'

interface Props {
  path: string
  className?: string
}

export function PathCopyButton({ path, className }: Props) {
  const { copy, copied } = useClipboard(1500)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        copy(path)
      }}
      title={`Copy path: ${path}`}
      className={cn(
        'ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-all',
        'opacity-0 group-hover:opacity-100',
        copied
          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span>{copied ? 'Copied!' : path}</span>
    </button>
  )
}
