import { useNavigate } from 'react-router-dom'

interface GameHeaderProps {
  title: string
}

/** Thanh đầu trang màn hình game: nút về trang chủ + tiêu đề */
export function GameHeader({ title }: GameHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex w-full items-center gap-3">
      <button
        type="button"
        aria-label="Về trang chủ"
        onClick={() => navigate('/')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700"
      >
        ←
      </button>
      <h1 className="truncate text-sm font-bold tracking-[0.18em] text-slate-200 sm:text-base">
        ♟ CHESS ARENA <span className="font-medium text-slate-500">· {title}</span>
      </h1>
    </header>
  )
}
