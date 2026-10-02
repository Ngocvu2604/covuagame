/**
 * Các mức độ AI hiển thị trên UI.
 * Cấu hình tìm kiếm tương ứng nằm ở src/ai/difficulty.ts.
 */

export type DifficultyId = 'easy' | 'medium' | 'hard'

export interface DifficultyOption {
  id: DifficultyId
  emoji: string
  name: string
  description: string
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: 'easy', emoji: '🟢', name: 'Tân Binh', description: 'Dành cho người mới' },
  { id: 'medium', emoji: '🟡', name: 'Kỳ Thủ', description: 'Thử thách vừa phải' },
  { id: 'hard', emoji: '🔴', name: 'Đại Kiện Tướng', description: 'Thử thách cao' },
]
