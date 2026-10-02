import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createPersistentStorage, storageKeys } from '../services/storageService'

/**
 * Thông tin người chơi (tên hiển thị) — tự động lưu vào localStorage.
 * Dùng cho PlayerPanel ở chế độ offline và lobby online ở Phase 6.
 */

interface PlayerState {
  name: string
  setPlayerName: (name: string) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      name: 'Người chơi',
      setPlayerName: (name) => set({ name: name.trim() }),
    }),
    {
      name: storageKeys.player,
      storage: createJSONStorage(() => createPersistentStorage()),
    },
  ),
)
