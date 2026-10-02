/** Sinh mã phòng 6 ký tự dễ đọc, bỏ các ký tự dễ nhầm (I, O, 0, 1) */

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
