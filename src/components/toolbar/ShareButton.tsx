import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClipboard } from '@/hooks/useClipboard'
import { getShareUrl, makeShareable } from '@/lib/url-state'
import { toast } from '@/hooks/use-toast'
import type { ToolMode, IndentWidth } from '@/types/state'
import { URL_SIZE_WARN_BYTES } from '@/constants/defaults'

interface Props {
  rawJson: string
  activeTab: ToolMode
  indentWidth: IndentWidth
  jsonPathQuery: string
  selectedNodePath: string | null
}

export function ShareButton({ rawJson, activeTab, indentWidth, jsonPathQuery, selectedNodePath }: Props) {
  const { copy, copied } = useClipboard()

  const handleShare = async () => {
    const state = makeShareable(rawJson, activeTab, indentWidth, jsonPathQuery, selectedNodePath)

    if (new Blob([rawJson]).size > URL_SIZE_WARN_BYTES) {
      toast({
        title: 'Large input',
        description: 'This URL may be very long (input exceeds 30 KB). Consider hosting your JSON externally.',
      })
    }

    const url = getShareUrl(state)
    const ok = await copy(url)
    if (ok) {
      toast({ title: 'Link copied!', description: 'The shareable URL is in your clipboard.' })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
    </Button>
  )
}
