import { useT } from '../../i18n/translations'

/** Cờ hiệu báo chiếu, hiển thị ở mép trên bàn cờ */
export function CheckIndicator() {
  const t = useT()
  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 animate-pulse rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
      {t('check.badge')}
    </div>
  )
}
