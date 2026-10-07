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
    <header className="relative flex w-full items-center">
      <button
        type="button"
        aria-label={t('header.home')}
        onClick={() => navigate('/')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
      >
        ←
      </button>
      <h1 className="pointer-events-none flex-1 text-center text-lg font-bold text-slate-100">
        {title}
      </h1>
      {onOpenSettings && (
        <button
          type="button"
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9" />
          </svg>
        </button>
      )}
    </header>
  )
}
