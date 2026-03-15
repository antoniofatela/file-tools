import LZString from 'lz-string'
import type { ShareableState } from '@/types/state'
import { DEFAULT_INDENT, DEFAULT_TAB } from '@/constants/defaults'

export function encodeState(state: ShareableState): string {
  const json = JSON.stringify(state)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeState(encoded: string): ShareableState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json) as unknown
    if (!isShareableState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function isShareableState(v: unknown): v is ShareableState {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  return (
    obj.v === 1 &&
    typeof obj.j === 'string' &&
    typeof obj.t === 'string' &&
    (obj.i === 2 || obj.i === 4 || obj.i === 'tab') &&
    typeof obj.q === 'string' &&
    (typeof obj.s === 'string' || obj.s === null)
  )
}

export function readHashState(): ShareableState | null {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return decodeState(hash)
}

export function writeHashState(state: ShareableState): void {
  const encoded = encodeState(state)
  window.location.replace('#' + encoded)
}

export function getShareUrl(state: ShareableState): string {
  const encoded = encodeState(state)
  const url = new URL(window.location.href)
  url.hash = encoded
  return url.toString()
}

export function makeShareable(
  rawJson: string,
  activeTab: ShareableState['t'],
  indentWidth: ShareableState['i'],
  jsonPathQuery: string,
  selectedNodePath: string | null
): ShareableState {
  return {
    v: 1,
    j: rawJson,
    t: activeTab,
    i: indentWidth,
    q: jsonPathQuery,
    s: selectedNodePath,
  }
}

export function defaultShareable(): ShareableState {
  return { v: 1, j: '', t: DEFAULT_TAB, i: DEFAULT_INDENT, q: '$', s: null }
}
