import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'

/** Trang chủ: chọn chế độ chơi */
export function HomePage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="flex flex-col items-center gap-10 text-center">
        <header>
          <span aria-hidden className="select-none text-7xl leading-none text-emerald-400">
            ♞
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-[0.2em] sm:text-5xl">CHESS ARENA</h1>
          <p className="mt-4 text-base text-slate-400">Play Chess. Have Fun.</p>
        </header>

        <nav aria-label="Chọn chế độ chơi" className="flex w-72 flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/offline')}>
            🤖 Chơi với máy
          </Button>
          <Button variant="secondary" size="lg" fullWidth disabled title="Sắp ra mắt">
            🌐 Chơi Online
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/settings')}>
            ⚙ Cài đặt
          </Button>
        </nav>

        <p className="text-xs text-slate-600">Chơi với máy hoạt động hoàn toàn offline</p>
      </div>
    </main>
  )
}
