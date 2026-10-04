/**
 * Sinh mã phòng 6 ký tự dễ đọc, bỏ các ký tự dễ nhầm (I, O, 0, 1).
 * Bản client của utils/generateRoomCode.ts phía server — dùng cho
 * provider Appwrite (socket provider sinh mã phía server).
 */

import type { PlayerColor } from '../types/chess'

export const ROOM_CODE_LENGTH = 6

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(isTaken: (code: string) => boolean): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = ''
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
    if (!isTaken(code)) return code
  }
  throw new Error('Không sinh được mã phòng trống')
}

/** Kiểm tra dữ liệu nhập của người chơi phía client */

export const PLAYER_NAME_MAX_LENGTH = 20

export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= PLAYER_NAME_MAX_LENGTH
}

export function isValidColorChoice(value: unknown): value is 'white' | 'black' | 'random' {
  return value === 'white' || value === 'black' || value === 'random'
}

export function isValidTimeMinutes(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && [3, 5, 10, 15].includes(value))
}

export type { PlayerColor }
