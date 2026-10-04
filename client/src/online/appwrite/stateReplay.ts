import { Chess } from 'chess.js'
import type { GameState, MoveRecord, PieceType, PlayerColor, SquareName } from '../../types/chess'
import type { MoveDocument, RoomDocument } from './documents'
import { toPieceType, toPlayerColor } from '../../chess/chessUtils'

/**
 * "Server-side validation" của kiến trúc Appwrite:
 * toàn bộ nước đi trong collection `moves` được REPLAY qua chess.js theo
 * thứ tự ply. Bất kỳ entry nào không hợp lệ sẽ bị LOẠI đồng nhất trên mọi
 * client, nên:
 *   - nước đi không hợp lệ      → bị bỏ
 *   - đi sai lượt               → bị bỏ
 *   - tự nhận màu của đối thủ   → bị bỏ (color suy ra từ userId trong doc
 *                                 đối chiếu ghế white/black của phòng)
 *   - giả mạo userId            → không thể (userId đến từ Anonymous Session)
 *
 * Kết quả là một GameState "đã được kiểm định" mà mọi client đều tính ra giống nhau.
 */

export interface ReplayResult {
  state: GameState
  /** Số entry bị loại vì không hợp lệ */
  skippedCount: number
}

function colorOf(move: MoveDocument, room: RoomDocument): PlayerColor | null {
  if (move.userId === room.whitePlayerId) return 'white'
  if (move.userId === room.blackPlayerId) return 'black'
  return null
}

/** Replay toàn bộ nước đi của một ván (gameNumber) trong phòng → GameState */
export function replayMoves(moves: MoveDocument[], room: RoomDocument): ReplayResult {
  const game = new Chess()
  const ordered = [...moves].sort((a, b) => a.ply - b.ply)
  const moveHistory: MoveRecord[] = []

  let expectedPly = 1
  let skippedCount = 0

  for (const move of ordered) {
    if (move.gameNumber !== room.gameNumber) continue
    if (move.ply !== expectedPly) {
      // trùng ply (ghi đồng thời) hoặc thiếu ply → bỏ entry, đợi entry đúng
      skippedCount++
      continue
    }

    const color = colorOf(move, room)
    if (!color || color !== (game.turn() === 'w' ? 'white' : 'black')) {
      skippedCount++
      continue
    }

    const legal = game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || undefined,
    })
    if (!legal) {
      skippedCount++
      continue
    }

    moveHistory.push({
      san: legal.san,
      from: move.from as SquareName,
      to: move.to as SquareName,
      color,
      piece: toPieceType(legal.piece),
      captured: legal.captured ? toPieceType(legal.captured) : null,
      promotion: legal.promotion ? toPieceType(legal.promotion) : null,
    })
    expectedPly++
  }

  return { state: deriveGameState(game, moveHistory), skippedCount }
}

/** Tổng hợp trạng thái bàn cờ từ một instance chess.js đã replay */
export function deriveGameState(game: Chess, moveHistory: MoveRecord[]): GameState {
  const pieces: { square: SquareName; type: PieceType; color: PlayerColor }[] = []
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell) {
        pieces.push({
          square: cell.square as SquareName,
          type: toPieceType(cell.type),
          color: toPlayerColor(cell.color),
        })
      }
    }
  }

  const last = moveHistory.at(-1) ?? null
  const inCheck = game.isCheck()
  const turn = toPlayerColor(game.turn())

  return {
    fen: game.fen(),
    turn,
    pieces,
    moveHistory,
    status: deriveStatus(game),
    inCheck,
    checkSquare: inCheck ? findKingSquare(game, turn) : null,
    lastMove: last ? { from: last.from, to: last.to } : null,
    result: deriveResult(game),
  }
}

function deriveStatus(game: Chess): GameState['status'] {
  if (game.isCheckmate()) return 'checkmate'
  if (game.isDraw()) return 'draw'
  if (game.isCheck()) return 'check'
  return 'playing'
}

function deriveResult(game: Chess): GameState['result'] {
  if (!game.isCheckmate() && !game.isDraw()) return null
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'black' : 'white'
    return { winner, reason: 'checkmate' }
  }
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' }
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'threefold-repetition' }
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty-move' }
  return { winner: null, reason: 'insufficient-material' }
}

function findKingSquare(game: Chess, color: PlayerColor): SquareName | null {
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && toPlayerColor(cell.color) === color) {
        return cell.square as SquareName
      }
    }
  }
  return null
}
