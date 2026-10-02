/** Kiểm tra dữ liệu nhập của người chơi */

export const PLAYER_NAME_MAX_LENGTH = 20

export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= PLAYER_NAME_MAX_LENGTH
}

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/

/** Mã phòng gồm đúng 6 ký tự A–Z / 2–9 */
export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_PATTERN.test(code.trim().toUpperCase())
}
