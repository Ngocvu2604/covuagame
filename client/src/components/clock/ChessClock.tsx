import { TimeDisplay } from './TimeDisplay'

interface ChessClockProps {
  timeMs: number | null
  isActive: boolean
}

/** Khối đồng hồ của một bên — ẩn khi ván không dùng đồng hồ */
export function ChessClock({ timeMs, isActive }: ChessClockProps) {
  if (timeMs === null) return null
  return (
    <div
      className={`rounded-lg px-3 py-1 ${
        isActive ? 'bg-emerald-600/25 ring-1 ring-emerald-500/50' : 'bg-slate-800/80'
      }`}
    >
      <TimeDisplay timeMs={timeMs} />
    </div>
  )
}
