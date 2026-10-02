/** Kiểm tra dữ liệu nhập của người chơi */

export const PLAYER_NAME_MAX_LENGTH = 20

export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= PLAYER_NAME_MAX_LENGTH
}
