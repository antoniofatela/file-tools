interface Props {
  value: unknown
  type: string
}

export function TreeNodeValue({ value, type }: Props) {
  if (type === 'null') {
    return <span className="text-slate-400 italic">null</span>
  }
  if (type === 'boolean') {
    return (
      <span className="text-orange-500 dark:text-orange-400 font-medium">
        {String(value)}
      </span>
    )
  }
  if (type === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>
  }
  if (type === 'string') {
    const str = value as string
    const display = str.length > 100 ? str.slice(0, 100) + '…' : str
    return (
      <span className="text-green-700 dark:text-green-400">
        &quot;{display}&quot;
      </span>
    )
  }
  return null
}
