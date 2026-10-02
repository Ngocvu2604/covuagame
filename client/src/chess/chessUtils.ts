import type { PieceType, PlayerColor, SquareName } from '../types/chess'

/** Ô cờ là ô sáng hay tối (ô a1 là ô tối) */
export function isLightSquare(square: string): boolean {
  const fileIndex = square.charCodeAt(0) - 97 // 'a' === 97
  const rankIndex = Number(square[1]) - 1
  return (fileIndex + rankIndex) % 2 === 1
}

/** Vị trí ô nhìn thấy trên màn hình (row/col đếm từ 0, tính theo góc nhìn) */
export function getViewPosition(
  square: SquareName,
  orientation: PlayerColor,
): { row: number; col: number } {
  const fileIndex = square.charCodeAt(0) - 97
  const rank = Number(square[1])
  return {
    row: orientation === 'white' ? 8 - rank : rank - 1,
    col: orientation === 'white' ? fileIndex : 7 - fileIndex,
  }
}

/** Màu đối phương */
export function opposite(color: PlayerColor): PlayerColor {
  return color === 'white' ? 'black' : 'white'
}

/** Đổi mã màu 'w'/'b' của chess.js thành PlayerColor */
export function toPlayerColor(color: 'w' | 'b'): PlayerColor {
  return color === 'w' ? 'white' : 'black'
}

/** Đổi mã quân 'p'/'n'/'b'/'r'/'q'/'k' của chess.js thành PieceType */
export function toPieceType(piece: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'): PieceType {
  switch (piece) {
    case 'p':
      return 'pawn'
    case 'n':
      return 'knight'
    case 'b':
      return 'bishop'
    case 'r':
      return 'rook'
    case 'q':
      return 'queen'
    case 'k':
      return 'king'
  }
}

/** Đổi PieceType thành mã quân của chess.js (khi gọi engine.move) */
export function toPieceSymbol(type: PieceType): 'p' | 'n' | 'b' | 'r' | 'q' | 'k' {
  switch (type) {
    case 'pawn':
      return 'p'
    case 'knight':
      return 'n'
    case 'bishop':
      return 'b'
    case 'rook':
      return 'r'
    case 'queen':
      return 'q'
    case 'king':
      return 'k'
  }
}
