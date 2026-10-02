import type { Chess, Move } from 'chess.js'
import type { PieceType, SquareName } from '../types/game'
import { toPieceType } from './GameState'

/**
 * Xác thực nước đi phía server — nguồn sự thật duy nhất (mục 19).
 * `promotion` truyền vào là ký hiệu của chess.js ('q' | 'r' | 'b' | 'n')
 * — cùng định dạng client gửi lên.
 */

export interface LegalMoveInfo {
  from: SquareName
  to: SquareName
  piece: PieceType
  promotion: PieceType | null
}

export function findLegalMove(
  game: Chess,
  from: SquareName,
  to: SquareName,
  promotion?: string,
): LegalMoveInfo | null {
  const candidates = game.moves({ square: from, verbose: true }).filter((move) => move.to === to)
  if (candidates.length === 0) return null

  const needsPromotion = candidates.some((move) => move.promotion !== undefined)
  if (needsPromotion) {
    if (!promotion) return null
    const chosen = candidates.find(
      (move) => move.promotion !== undefined && move.promotion === promotion,
    )
    if (!chosen) return null
    return toLegalInfo(chosen)
  }

  return toLegalInfo(candidates[0])
}

function toLegalInfo(move: Move): LegalMoveInfo {
  return {
    from: move.from,
    to: move.to,
    piece: toPieceType(move.piece),
    promotion: move.promotion ? toPieceType(move.promotion) : null,
  }
}
