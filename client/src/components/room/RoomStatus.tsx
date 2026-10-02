interface RoomStatusProps {
  text: string
  tone?: 'info' | 'warning'
}

/** Dòng trạng thái phòng (đang chờ, mất kết nối...) */
export function RoomStatus({ text, tone = 'info' }: RoomStatusProps) {
  return <p className={`text-sm ${tone === 'warning' ? 'text-gold' : 'text-slate-400'}`}>{text}</p>
}
