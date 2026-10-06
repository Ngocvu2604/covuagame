/**
 * Các mức độ AI hiển thị trên UI.
 * Tên/mô tả là i18n keys — dịch tại src/i18n/translations.ts.
 * Cấu hình tìm kiếm tương ứng nằm ở src/ai/difficulty.ts.
 */

export type DifficultyId = 'easy' | 'medium' | 'hard'

export interface DifficultyOption {
  id: DifficultyId
  emoji: string
  nameKey: 'difficulty.easy' | 'difficulty.medium' | 'difficulty.hard'
  descKey: 'difficulty.easyDesc' | 'difficulty.mediumDesc' | 'difficulty.hardDesc'
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'easy',
    emoji: '🟢',
    nameKey: 'difficulty.easy',
    descKey: 'difficulty.easyDesc',
  },
  {
    id: 'medium',
    emoji: '🟡',
    nameKey: 'difficulty.medium',
    descKey: 'difficulty.mediumDesc',
  },
  {
    id: 'hard',
    emoji: '🔴',
    nameKey: 'difficulty.hard',
    descKey: 'difficulty.hardDesc',
  },
]
