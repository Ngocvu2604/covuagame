import { useEffect } from 'react'
import { SettingsContent } from './SettingsContent'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Panel cài đặt dạng trượt: slide-over từ phải trên desktop,
 * bottom-sheet trên mobile. Có animation mở/đóng, không chiếm cả màn hình.
 */
export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  // Đóng bằng phím Escape
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Cài đặt"
        className={`absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-white/10 bg-slate-900 shadow-2xl transition-transform duration-200 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-full sm:w-96 sm:rounded-t-none sm:rounded-l-2xl sm:border-l sm:border-t-0 ${
          open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">⚙ Cài đặt</h2>
          <button
            type="button"
            aria-label="Đóng cài đặt"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </header>
        <div className="overflow-y-auto p-5">
          <SettingsContent />
        </div>
      </aside>
    </div>
  )
}
