import type { Move } from 'chess.js'

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 } as const

/**
 * Sắp xếp nước đi (MVV-LVA + thưởng phong cấp) giúp alpha-beta
 * cắt tỉa sớm hơn nhiều nhờ xét nước "nguy hiểm" trước.
 */
export function scoreMoveForOrdering(move: Move): number {
  let score = 0
  if (move.captured) {
    // Ăn quân giá trị cao bằng quân giá trị thấp được ưu tiên nhất
    score += 10_000 + PIECE_VALUES[move.captured] * 10 - PIECE_VALUES[move.piece]
  }
  if (move.promotion) {
    score += 9_000 + PIECE_VALUES[move.promotion]
  }
  return score
}

export function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a))
}
