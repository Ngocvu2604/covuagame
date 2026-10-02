import type { PlayerColor } from '../../types/chess'

interface PlayerAvatarProps {
  name: string
  color: PlayerColor
}

/** Ảnh đại diện: chữ cái đầu của tên, nền thể hiện màu quân */
export function PlayerAvatar({ name, color }: PlayerAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ring-2 ${
        color === 'white'
          ? 'bg-slate-100 text-slate-900 ring-emerald-400/70'
          : 'bg-slate-800 text-slate-100 ring-slate-400/50'
      }`}
    >
      {initial}
    </span>
  )
}
