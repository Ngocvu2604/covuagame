import type { ReactNode } from 'react'

interface ModalProps {
  children: ReactNode
  /** Click vào nền mờ để đóng (không bắt buộc) */
  onClose?: () => void
}

/** Hộp thoại dạng overlay dùng chung */
export function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm animate-[modal-in_180ms_ease-out] rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
