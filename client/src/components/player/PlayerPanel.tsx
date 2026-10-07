import type { PlayerColor } from '../../types/chess'
import { ChessClock } from '../clock/ChessClock'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerInfo } from './PlayerInfo'

interface PlayerPanelProps {
  name: string
  color: PlayerColor
  /** Bên này đang tới lượt → highlight panel + đồng hồ */
  isActive: boolean
  statusLabel: string
  /** Thời gian còn lại; null = không dùng đồng hồ */
  timeMs: number | null
}

/** Panel thông tin người chơi: avatar, tên, trạng thái lượt và đồng hồ */
export function PlayerPanel({ name, color, isActive, statusLabel, timeMs }: PlayerPanelProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2 text-slate-100 transition ${
        isActive ? 'border-emerald-500/50 bg-emerald-900/50' : 'border-white/5 bg-slate-900/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar name={name} color={color} />
        <PlayerInfo name={name} status={statusLabel} highlight={isActive} />
      </div>
      <ChessClock timeMs={timeMs} isActive={isActive} />
    </div>
  )
}
