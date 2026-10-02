import type { DifficultyId } from '../constants/difficulty'

/** Cấu hình tìm kiếm của AI cho từng mức độ khó */
export interface AISearchConfig {
  /** Độ sâu tối đa của iterative deepening */
  maxDepth: number
  /** Ngân sách thời gian (ms) — tìm kiếm luôn dừng đúng hẹn và trả về kết quả sâu nhất đã hoàn thành */
  timeCapMs: number
  /** Bật quiescence search (mở rộng nước ăn quân) để tránh hiệu ứng đường chân trời */
  useQuiescence: boolean
  /** Chọn ngẫu nhiên trong các nước có điểm lệch dưới nước tốt nhất tối đa n centipawn */
  marginCp: number
  /** Xác suất "sai lầm" chủ ý — AI chọn nước chưa tốt để dễ đánh bại */
  blunderChance: number
}

export const AI_CONFIGS: Record<DifficultyId, AISearchConfig> = {
  easy: {
    maxDepth: 2,
    timeCapMs: 400,
    useQuiescence: false,
    marginCp: 150,
    blunderChance: 0.15,
  },
  medium: {
    maxDepth: 3,
    timeCapMs: 900,
    useQuiescence: true,
    marginCp: 30,
    blunderChance: 0,
  },
  hard: {
    maxDepth: 5,
    timeCapMs: 2000,
    useQuiescence: true,
    marginCp: 0,
    blunderChance: 0,
  },
}
