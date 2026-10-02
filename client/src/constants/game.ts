/** Nhãn hiển thị dùng chung cho các màn hình game */

import type { GameEndReason } from '../types/chess'

export const END_REASON_LABELS: Record<GameEndReason, string> = {
  checkmate: 'Hết cờ',
  stalemate: 'Hết nước đi hợp lệ',
  'threefold-repetition': 'Lặp lại nước đi 3 lần',
  'fifty-move': 'Luật 50 nước',
  'insufficient-material': 'Không đủ lực lượng chiếu hết',
  resignation: 'Đầu hàng',
  timeout: 'Hết giờ',
  agreement: 'Thỏa thuận hòa',
}

export const COLOR_LABELS = { white: 'Trắng', black: 'Đen' } as const

export interface TimeControlOption {
  /** null = không giới hạn thời gian */
  minutes: number | null
  label: string
}

export const TIME_CONTROL_OPTIONS: TimeControlOption[] = [
  { minutes: null, label: '∞' },
  { minutes: 3, label: '3 phút' },
  { minutes: 5, label: '5 phút' },
  { minutes: 10, label: '10 phút' },
  { minutes: 15, label: '15 phút' },
]
