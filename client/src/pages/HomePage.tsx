import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { useT } from '../i18n/translations'

/** Trang chủ: chọn chế độ chơi */
export function HomePage() {
  const navigate = useNavigate()
  const t = useT()

  return (
    /* min-h-svh: tâm tính trên vùng hiển thị ổn định (không bị lệch khi thanh
       địa chỉ trình duyệt thu/mở). my-auto: căn giữa khi đủ chỗ, tự chuyển thành
       cuộn bình thường khi màn quá thấp (điện thoại ngang) thay vì cắt mất đầu. */
    <main className="flex min-h-svh flex-col px-4 py-6 text-slate-100">
      <div className="my-auto flex flex-col items-center gap-8 text-center">
        <header>
          <span aria-hidden className="select-none text-6xl leading-none text-[#d9c9a4]">
            ♞
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[0.08em] text-slate-100 sm:text-6xl sm:tracking-[0.1em]">
            {t('home.title')}
          </h1>
          <p className="app-chrome-muted mt-3 text-base">{t('home.tagline')}</p>
        </header>

        <nav aria-label="Chọn chế độ chơi" className="flex w-80 max-w-full flex-col gap-2.5">
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

        <p className="app-chrome-muted max-w-80 text-xs leading-relaxed">{t('home.offlineNote')}</p>
      </div>
    </main>
  )
}
