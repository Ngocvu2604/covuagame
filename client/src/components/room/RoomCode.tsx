import { useState } from 'react'
import { useT } from '../../i18n/translations'

interface RoomCodeProps {
  code: string
}

/** Biểu tượng mắt (SVG) cho nút ẩn/hiện mã phòng */
function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!off && <path d="M4 20 20 4" />}
    </svg>
  )
}

/**
 * Hiển thị mã phòng. Mặc định CHE mã (riêng tư); nút mắt cho phép hiện/ẩn.
 * Chỉ che phần HIỂN THỊ — copy/chia sẻ/tham gia vẫn dùng mã đầy đủ.
 */
export function RoomCode({ code }: RoomCodeProps) {
  const t = useT()
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <p
        data-testid="room-code"
        aria-label={visible ? code : undefined}
        className="min-w-0 select-all rounded-lg border border-white/10 bg-slate-800/60 px-5 py-3 font-mono text-3xl font-bold tracking-[0.25em] text-emerald-300 sm:text-4xl sm:tracking-[0.3em]"
      >
        {visible ? code : '•'.repeat(code.length)}
      </p>
      <button
        type="button"
        aria-label={visible ? t('wait.hideCode') : t('wait.showCode')}
        aria-pressed={visible}
        title={visible ? t('wait.hideCode') : t('wait.showCode')}
        onClick={() => setVisible((v) => !v)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          visible
            ? 'border-emerald-500/50 bg-emerald-600/15 text-emerald-300'
            : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  )
}
