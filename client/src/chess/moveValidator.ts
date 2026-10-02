import type { Chess, Move } from 'chess.js'
import type { PieceType, SquareName } from '../types/chess'
import { toPieceType } from './chessUtils'

/** Nước đi hợp lệ ở dạng domain (không lộ types của chess.js ra ngoài) */
export interface LegalMove {
  from: SquareName
  to: SquareName
  piece: PieceType
  captured: PieceType | null
  promotion: PieceType | null
}

function toLegalMove(move: Move): LegalMove {
  return {
    from: move.from,
    to: move.to,
    piece: toPieceType(move.piece),
    captured: move.captured ? toPieceType(move.captured) : null,
    promotion: move.promotion ? toPieceType(move.promotion) : null,
  }
}

/** Danh sách nước đi hợp lệ từ một ô xuất phát */
export function getLegalMoves(game: Chess, from: SquareName): LegalMove[] {
  return game.moves({ square: from, verbose: true }).map(toLegalMove)
}

/** Các ô đích hợp lệ từ một ô xuất phát (đã bỏ trùng lặp giữa các biến thể phong cấp) */
export function getLegalTargetSquares(game: Chess, from: SquareName): SquareName[] {
  return [...new Set(game.moves({ square: from, verbose: true }).map((m) => m.to))]
}

/** Nước đi from → to có phải là nước phong cấp tốt không */
export function isPromotionMove(game: Chess, from: SquareName, to: SquareName): boolean {
  return game
    .moves({ square: from, verbose: true })
    .some((m) => m.to === to && m.promotion !== undefined)
}

/**
 * Tìm nước đi hợp lệ tương ứng with from → to (+ quân phong cấp nếu cần).
 * Trả về null nếu nước đi không hợp lệ hoặc thiếu lựa chọn quân phong cấp.
 */
export function findLegalMove(
  game: Chess,
  from: SquareName,
  to: SquareName,
  promotion?: PieceType,
): LegalMove | null {
  const candidates = game.moves({ square: from, verbose: true }).filter((m) => m.to === to)
  if (candidates.length === 0) return null

  const needsPromotion = candidates.some((m) => m.promotion !== undefined)
  if (needsPromotion) {
    if (!promotion) return null
    const chosen = candidates.find((m) => m.promotion !== undefined && toPieceType(m.promotion) === promotion)
    return chosen ? toLegalMove(chosen) : null
  }

  return toLegalMove(candidates[0])
}
