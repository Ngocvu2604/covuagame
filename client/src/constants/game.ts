/** Nhãn hiển thị dùng chung cho các màn hình game */

import type { GameEndReason } from '../types/chess'

export const END_REASON_LABELS: Record<GameEndReason, string> = {
  checkmate: 'Hết cờ',
  stalemate: 'Hết nước đi hợp lệ',
  'threefold-repetition': 'Lặp lại nước đi 3 lần',
  'fifty-move': 'Luật 50 nước',
  'insufficient-material': 'Không đủ lực lượng chiếu hết',
  resignation: 'Đầu hàng',
  left: 'Rời trận',
  abandoned: 'Mất kết nối quá lâu',
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
  { minutes: 3, label: '3' },
  { minutes: 5, label: '5' },
  { minutes: 10, label: '10' },
  { minutes: 15, label: '15' },
]

/** Thời gian chờ đối thủ kết nối lại trước khi xử thua — khớp config server */
export const RECONNECT_GRACE_SECONDS = 30

/** Giới hạn ký tự tin nhắn chat — khớp validation phía server */
export const CHAT_MESSAGE_MAX_LENGTH = 200
