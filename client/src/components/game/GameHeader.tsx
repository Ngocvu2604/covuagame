import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n/translations'

interface GameHeaderProps {
  title: string
  /** Mở panel cài đặt (nếu trang có SettingsDrawer) */
  onOpenSettings?: () => void
}

/** Thanh đầu trang màn hình game: nút về trang chủ + tiêu đề + cài đặt */
export function GameHeader({ title, onOpenSettings }: GameHeaderProps) {
  const navigate = useNavigate()
  const t = useT()
  return (
    <header className="flex w-full items-center gap-2.5">
      <button
        type="button"
        aria-label={t('header.home')}
        onClick={() => navigate('/')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
      >
        ←
      </button>
      <h1 className="app-chrome-title truncate text-sm font-bold tracking-[0.18em] text-slate-200 sm:text-base">
        <span className="hidden sm:inline">♟ CHESS ARENA · </span>
        <span className="sm:hidden">♟ · </span>
        {title}
      </h1>
      {onOpenSettings && (
        <button
          type="button"
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
        >
          ⚙
        </button>
      )}
    </header>
  )
}
