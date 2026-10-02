import { ROOM_CODE_LENGTH } from './generateRoomCode'

/**
 * Kiểm tra dữ liệu gửi lên server — server không tin client (mục 19).
 * Mọi payload đều đi qua các hàm này trước khi xử lý.
 */

export const PLAYER_NAME_MAX_LENGTH = 20

export function isValidPlayerName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= PLAYER_NAME_MAX_LENGTH
  )
}

const ROOM_CODE_PATTERN = new RegExp(`^[A-Z0-9]{${ROOM_CODE_LENGTH}}$`)

export function isValidRoomCode(value: unknown): value is string {
  return typeof value === 'string' && ROOM_CODE_PATTERN.test(value.toUpperCase())
}

const VALID_TIME_MINUTES = [3, 5, 10, 15]

export function isValidTimeMinutes(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && VALID_TIME_MINUTES.includes(value))
}

export function isValidColorChoice(value: unknown): value is 'white' | 'black' | 'random' {
  return value === 'white' || value === 'black' || value === 'random'
}

const SQUARE_PATTERN = /^[a-h][1-8]$/

export function isValidSquare(value: unknown): value is string {
  return typeof value === 'string' && SQUARE_PATTERN.test(value)
}

const PROMOTION_SYMBOLS = ['q', 'r', 'b', 'n']

export function isValidPromotion(value: unknown): value is 'q' | 'r' | 'b' | 'n' {
  return typeof value === 'string' && PROMOTION_SYMBOLS.includes(value)
}

export const CHAT_MESSAGE_MAX_LENGTH = 200

export function isValidChatText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= CHAT_MESSAGE_MAX_LENGTH
  )
}
