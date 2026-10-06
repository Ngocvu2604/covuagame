import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { useT } from '../i18n/translations'

/** Trang chủ: chọn chế độ chơi */
export function HomePage() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 text-slate-100">
      <div className="flex flex-col items-center gap-10 text-center">
        <header>
          <span
            aria-hidden
            className="select-none text-7xl leading-none text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)]"
          >
            ♞
          </span>
          <h1 className="app-chrome-title mt-6 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-4xl font-bold tracking-[0.2em] text-transparent sm:text-5xl">
            CHESS ARENA
          </h1>
          <p className="app-chrome-muted mt-4 text-base">Play Chess. Have Fun.</p>
          <div
            aria-hidden
            className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-slate-500"
          >
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">🤖 AI Offline</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">🌐 Realtime</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">♪ Ambient</span>
          </div>
        </header>

        <nav aria-label="Chọn chế độ chơi" className="flex w-72 flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/offline')}>
            {t('home.playVsAi')}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/online')}>
            {t('home.playOnline')}
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/settings')}>
            {t('home.settings')}
          </Button>
        </nav>

        <p className="app-chrome-muted text-xs text-slate-600">{t('home.offlineNote')}</p>
      </div>
    </main>
  )
}
