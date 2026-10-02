import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { BoardThemeId } from '../types/chess'
import type { DifficultyId } from '../constants/difficulty'
import { createPersistentStorage, storageKeys } from '../services/storageService'

/**
 * Cài đặt của người chơi — tự động lưu vào localStorage
 * để giữ nguyên sau khi reload trang (yêu cầu mục 20).
 */

interface SettingsState {
  /** Bật/tắt hiệu ứng âm thanh (soundService sẽ dùng ở Phase 8) */
  soundEnabled: boolean
  /** Màu bàn cờ */
  boardTheme: BoardThemeId
  /** Độ khó được chọn sẵn khi tạo trận với máy */
  defaultDifficulty: DifficultyId

  setSoundEnabled: (enabled: boolean) => void
  setBoardTheme: (theme: BoardThemeId) => void
  setDefaultDifficulty: (difficulty: DifficultyId) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      boardTheme: 'classic',
      defaultDifficulty: 'medium',

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBoardTheme: (theme) => set({ boardTheme: theme }),
      setDefaultDifficulty: (difficulty) => set({ defaultDifficulty: difficulty }),
    }),
    {
      name: storageKeys.settings,
      storage: createJSONStorage(() => createPersistentStorage()),
    },
  ),
)
