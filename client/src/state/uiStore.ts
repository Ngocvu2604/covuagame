import { create } from 'zustand'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'success' | 'error'
}

interface UiStore {
  toasts: Toast[]
  pushToast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

let nextToastId = 1
const TOAST_DURATION_MS = 2600

/** Thông báo ngắn (toast) — tự động biến mất sau ~2.6s */
export const useUiStore = create<UiStore>()((set, get) => ({
  toasts: [],
  pushToast: (text, tone = 'info') => {
    const id = nextToastId++
    set({ toasts: [...get().toasts.slice(-3), { id, text, tone }] })
    window.setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export function pushToast(text: string, tone: Toast['tone'] = 'info'): void {
  useUiStore.getState().pushToast(text, tone)
}
