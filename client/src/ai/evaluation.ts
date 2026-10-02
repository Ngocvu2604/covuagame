import type { Chess } from 'chess.js'
import {
  BISHOP_TABLE,
  KING_ENDGAME_TABLE,
  KING_MIDDLE_GAME_TABLE,
  KNIGHT_TABLE,
  PAWN_TABLE,
  QUEEN_TABLE,
  ROOK_TABLE,
} from './pieceSquareTables'

/**
 * Hàm đánh giá bàn cờ (centipawn, dương = Trắng tốt hơn):
 * Material + Piece-Square Tables (vị trí, kiểm soát trung tâm, an toàn vua)
 * + cặp tượng + cấu trúc tốt (đôi / cô lẻ / qua đường).
 * Được gọi ở mọi node lá nên ưu tiên chi phí thấp.
 */

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 } as const

const BISHOP_PAIR_BONUS = 30
const DOUBLED_PAWN_PENALTY = 12
const ISOLATED_PAWN_PENALTY = 15

/** Thưởng tốt qua đường theo hạng (index = rank 1..8) */
const PASSED_PAWN_BONUS = [0, 5, 10, 20, 35, 60, 100, 0]

/** Tổng material không-tốt khi cả hai bên còn đủ quân — dùng tính pha vua */
const PHASE_MAX_MATERIAL = 2 * (2 * 320 + 2 * 330 + 2 * 500 + 900)

const PIECE_TABLES = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
} as const

export function evaluatePosition(game: Chess): number {
  const board = game.board()

  let whiteScore = 0
  let blackScore = 0
  let whiteBishopCount = 0
  let blackBishopCount = 0
  let nonPawnMaterial = 0

  // Thống kê tốt theo cột để tính cấu trúc tốt
  const whitePawnCountByFile = [0, 0, 0, 0, 0, 0, 0, 0]
  const blackPawnCountByFile = [0, 0, 0, 0, 0, 0, 0, 0]
  // Hàng của tốt "chân trước" mỗi cột (tốt tiến sâu nhất) — dùng cho tốt qua đường
  const whitePawnFrontRow = [8, 8, 8, 8, 8, 8, 8, 8] // min row
  const blackPawnFrontRow = [-1, -1, -1, -1, -1, -1, -1, -1] // max row

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col]
      if (!cell) continue

      const value = PIECE_VALUES[cell.type]
      if (cell.color === 'w') {
        whiteScore += value
      } else {
        blackScore += value
      }
      if (cell.type !== 'p' && cell.type !== 'k') {
        nonPawnMaterial += value
      }

      if (cell.type === 'k') continue // vua xử lý riêng theo pha

      // PST: trắng đọc thẳng, đen lật theo chiều dọc
      const table = PIECE_TABLES[cell.type]
      const pst =
        cell.color === 'w'
          ? table[row * 8 + col]
          : table[(7 - row) * 8 + col]

      if (cell.color === 'w') {
        whiteScore += pst
        if (cell.type === 'b') whiteBishopCount++
        if (cell.type === 'p') {
          whitePawnCountByFile[col]++
          if (row < whitePawnFrontRow[col]) whitePawnFrontRow[col] = row
        }
      } else {
        blackScore += pst
        if (cell.type === 'b') blackBishopCount++
        if (cell.type === 'p') {
          blackPawnCountByFile[col]++
          if (row > blackPawnFrontRow[col]) blackPawnFrontRow[col] = row
        }
      }
    }
  }

  // Vua: trộn bảng giữa cuộc / tàn cuộc theo pha
  const phase = Math.min(1, nonPawnMaterial / PHASE_MAX_MATERIAL)
  whiteScore += blendKingTable(board, 'w', phase)
  blackScore += blendKingTable(board, 'b', phase)

  // Cặp tượng
  if (whiteBishopCount >= 2) whiteScore += BISHOP_PAIR_BONUS
  if (blackBishopCount >= 2) blackScore += BISHOP_PAIR_BONUS

  // Cấu trúc tốt: đôi + cô lẻ + qua đường
  whiteScore += pawnStructureScore(
    whitePawnCountByFile,
    whitePawnFrontRow,
    blackPawnFrontRow,
    'w',
  )
  blackScore += pawnStructureScore(
    blackPawnCountByFile,
    blackPawnFrontRow,
    whitePawnFrontRow,
    'b',
  )

  return whiteScore - blackScore
}

function blendKingTable(
  board: ReturnType<Chess['board']>,
  color: 'w' | 'b',
  phase: number,
): number {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col]
      if (cell && cell.type === 'k' && cell.color === color) {
        const index = color === 'w' ? row * 8 + col : (7 - row) * 8 + col
        const middle = KING_MIDDLE_GAME_TABLE[index]
        const end = KING_ENDGAME_TABLE[index]
        return Math.round(middle * phase + end * (1 - phase))
      }
    }
  }
  return 0
}

function pawnStructureScore(
  ownCountByFile: number[],
  ownFrontRow: number[],
  enemyFrontRow: number[],
  color: 'w' | 'b',
): number {
  let score = 0

  for (let file = 0; file < 8; file++) {
    const count = ownCountByFile[file]
    if (count === 0) continue

    // Tốt đôi
    if (count > 1) score -= (count - 1) * DOUBLED_PAWN_PENALTY

    // Tốt cô lẻ: không có đồng đội ở cột kề
    const leftCount = file > 0 ? ownCountByFile[file - 1] : 0
    const rightCount = file < 7 ? ownCountByFile[file + 1] : 0
    if (leftCount === 0 && rightCount === 0) score -= count * ISOLATED_PAWN_PENALTY

    // Tốt qua đường: không có tốt địch chặn phía trước ở cột hiện tại và cột kề
    const frontRow = ownFrontRow[file]
    if (frontRow === (color === 'w' ? 8 : -1)) continue

    let blocked = false
    for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
      const enemyFront = enemyFrontRow[f]
      if (enemyFront === (color === 'w' ? -1 : 8)) continue
      if (color === 'w' ? enemyFront < frontRow : enemyFront > frontRow) {
        blocked = true
        break
      }
    }
    if (!blocked) {
      const rank = color === 'w' ? 8 - frontRow : frontRow + 1
      score += PASSED_PAWN_BONUS[rank - 1] ?? 0
    }
  }

  return score
}
