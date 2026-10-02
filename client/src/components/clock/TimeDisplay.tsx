import { formatChessClock } from '../../utils/formatTime'

interface TimeDisplayProps {
  timeMs: number
}

/** Hiển thị thời gian còn lại; < 20s đổi sang màu đỏ nhấp nháy */
export function TimeDisplay({ timeMs }: TimeDisplayProps) {
  const low = timeMs < 20_000
  return (
    <span
      className={`font-mono text-xl font-semibold tabular-nums sm:text-2xl ${
        low ? 'animate-pulse text-danger' : 'text-slate-100'
      }`}
    >
      {formatChessClock(timeMs)}
    </span>
  )
}
