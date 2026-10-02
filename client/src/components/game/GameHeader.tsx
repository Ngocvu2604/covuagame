import { useNavigate } from 'react-router-dom'

interface GameHeaderProps {
  title: string
  /** Mở panel cài đặt (nếu trang có SettingsDrawer) */
  onOpenSettings?: () => void
}

/** Thanh đầu trang màn hình game: nút về trang chủ + tiêu đề + cài đặt */
export function GameHeader({ title, onOpenSettings }: GameHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex w-full items-center gap-2.5">
      <button
        type="button"
        aria-label="Về trang chủ"
        onClick={() => navigate('/')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
      >
        ←
      </button>
      <h1 className="app-chrome-title truncate text-sm font-bold tracking-[0.18em] sm:text-base">
        <span className="hidden sm:inline">♟ CHESS ARENA · </span>
        <span className="sm:hidden">♟ · </span>
        {title}
      </h1>
      {onOpenSettings && (
        <button
          type="button"
          aria-label="Cài đặt"
          onClick={onOpenSettings}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
        >
          ⚙
        </button>
      )}
    </header>
  )
}
