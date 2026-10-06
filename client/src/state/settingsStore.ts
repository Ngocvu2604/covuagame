import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { BoardThemeId, DisplayMode, Language, MoveMode } from '../types/chess'
import type { DifficultyId } from '../constants/difficulty'
import type { PieceSetId } from '../constants/pieceSets'
import { DEFAULT_BOARD_THEME, BOARD_THEMES } from '../constants/chess'
import { DEFAULT_PIECE_SET, PIECE_SETS } from '../constants/pieceSets'
import { createPersistentStorage, storageKeys } from '../services/storageService'

/**
 * Cài đặt của người chơi — tự động lưu vào localStorage
 * để giữ nguyên sau khi reload trang (yêu cầu mục 20).
 */

export type SettingsState = {
  /** Âm thanh hiệu ứng (SFX) */
  soundEnabled: boolean
  /** Nhạc nền */
  musicEnabled: boolean
  /** Âm lượng nhạc nền 0..1 */
  musicVolume: number
  /** Màu bàn cờ */
  boardTheme: BoardThemeId
  /** Bộ quân cờ */
  pieceSet: PieceSetId
  /** Chế độ hiển thị trang */
  displayMode: DisplayMode
  /** Hiện tọa độ a-h / 1-8 trên bàn cờ */
  showCoordinates: boolean
  /** Bật/tắt animation */
  animationsEnabled: boolean
  /** Hiện gợi ý nước đi hợp lệ */
  showLegalMoves: boolean
  /** Hiện highlight nước đi cuối */
  showLastMove: boolean
  /** Độ khó được chọn sẵn khi tạo trận với máy */
  defaultDifficulty: DifficultyId
  /** Ngôn ngữ giao diện */
  language: Language
  /** Cách di chuyển quân */
  moveMode: MoveMode
}

export type SettingsActions = {
  setSoundEnabled: (enabled: boolean) => void
  setMusicEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  setBoardTheme: (theme: BoardThemeId) => void
  setPieceSet: (set: PieceSetId) => void
  setDisplayMode: (mode: DisplayMode) => void
  setShowCoordinates: (show: boolean) => void
  setAnimationsEnabled: (enabled: boolean) => void
  setShowLegalMoves: (show: boolean) => void
  setShowLastMove: (show: boolean) => void
  setDefaultDifficulty: (difficulty: DifficultyId) => void
  setLanguage: (language: Language) => void
  setMoveMode: (mode: MoveMode) => void
}

export type SettingsStore = SettingsState & SettingsActions

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: false,
      musicVolume: 0.5,
      boardTheme: DEFAULT_BOARD_THEME,
      pieceSet: DEFAULT_PIECE_SET,
      displayMode: 'dark',
      showCoordinates: true,
      animationsEnabled: true,
      showLegalMoves: true,
      showLastMove: true,
      defaultDifficulty: 'medium',
      language: 'vi',
      moveMode: 'both',

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      setMusicVolume: (volume) => set({ musicVolume: clamp01(volume) }),
      setBoardTheme: (theme) => set({ boardTheme: theme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setDisplayMode: (displayMode) => set({ displayMode }),
      setShowCoordinates: (showCoordinates) => set({ showCoordinates }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setShowLegalMoves: (showLegalMoves) => set({ showLegalMoves }),
      setShowLastMove: (showLastMove) => set({ showLastMove }),
      setDefaultDifficulty: (difficulty) => set({ defaultDifficulty: difficulty }),
      setLanguage: (language) => set({ language }),
      setMoveMode: (moveMode) => set({ moveMode }),
    }),
    {
      name: storageKeys.settings,
      storage: createJSONStorage(() => createPersistentStorage()),
      // Val hoá dữ liệu đã lưu: theme/set bị bỏ tên hoặc giá trị sai → dùng mặc định
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!(state.boardTheme in BOARD_THEMES)) useSettingsStore.setState({ boardTheme: DEFAULT_BOARD_THEME })
        if (!(state.pieceSet in PIECE_SETS)) useSettingsStore.setState({ pieceSet: DEFAULT_PIECE_SET })
        if (!['dark', 'dim', 'light'].includes(state.displayMode)) {
          useSettingsStore.setState({ displayMode: 'dark' })
        }
        useSettingsStore.setState({ musicVolume: clamp01(state.musicVolume) })
      },
    },
  ),
)
