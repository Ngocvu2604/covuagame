import { useEffect, useRef } from 'react'
import type { MoveRecord } from '../../types/chess'
import { MoveItem } from './MoveItem'

interface MoveHistoryProps {
  moves: MoveRecord[]
}

/** Lịch sử nước đi dạng cặp số nước, tự cuộn xuống nước mới nhất */
export function MoveHistory({ moves }: MoveHistoryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [moves.length])

  const lastIndex = moves.length - 1
  const pairs: { white?: MoveRecord; black?: MoveRecord }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ white: moves[i], black: moves[i + 1] })
  }

  return (
    <section
      aria-label="Lịch sử nước đi"
      className="overflow-hidden rounded-xl border border-white/5 bg-slate-900/60"
    >
      <p className="border-b border-white/5 px-4 py-2 text-xs uppercase tracking-widest text-slate-500">
        Lịch sử nước đi
      </p>
      <div ref={containerRef} className="max-h-64 overflow-y-auto py-1">
        {pairs.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-500">Chưa có nước đi nào</p>
        )}
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="grid grid-cols-[2.5rem_1fr_1fr] items-center px-3 py-0.5 odd:bg-white/[0.03]"
          >
            <span className="text-xs text-slate-500">{index + 1}.</span>
            <MoveItem san={pair.white?.san} isLast={index * 2 === lastIndex} />
            <MoveItem san={pair.black?.san} isLast={index * 2 + 1 === lastIndex} />
          </div>
        ))}
      </div>
    </section>
  )
}
