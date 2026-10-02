import { PlayerStatus } from './PlayerStatus'

interface PlayerInfoProps {
  name: string
  status: string
  highlight: boolean
}

/** Khối tên + trạng thái của người chơi */
export function PlayerInfo({ name, status, highlight }: PlayerInfoProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{name}</p>
      <PlayerStatus label={status} highlight={highlight} />
    </div>
  )
}
