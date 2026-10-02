interface MoveItemProps {
  san?: string
  isLast: boolean
}

/** Một nước đi trong lịch sử; nước cuối được highlight */
export function MoveItem({ san, isLast }: MoveItemProps) {
  if (!san) return <span />
  return (
    <span
      className={`w-fit rounded px-2 py-0.5 font-mono text-sm ${
        isLast ? 'bg-emerald-600/30 font-semibold text-emerald-200' : 'text-slate-300'
      }`}
    >
      {san}
    </span>
  )
}
