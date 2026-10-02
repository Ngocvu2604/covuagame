import { useUiStore } from '../../state/uiStore'

const TONE_CLASSES: Record<string, string> = {
  info: 'border-white/10 bg-slate-800 text-slate-100',
  success: 'border-emerald-500/40 bg-emerald-600/90 text-white',
  error: 'border-red-500/40 bg-red-600/90 text-white',
}

/** Vùng hiển thị toast — đặt 1 lần ở App */
export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-[fade-in_150ms_ease-out] rounded-full border px-4 py-1.5 text-sm shadow-xl ${TONE_CLASSES[toast.tone]}`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  )
}
