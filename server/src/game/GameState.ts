import type { Chess } from 'chess.js'
import type {
  GameResult,
  GameState,
  PieceOnSquare,
  PieceType,
  PlayerColor,
  SquareName,
} from '../types/game'

/** Helper ánh xạ giữa types của chess.js và domain types phía server */

export function toPlayerColor(color: 'w' | 'b'): PlayerColor {
  return color === 'w' ? 'white' : 'black'
}

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

export function opposite(color: PlayerColor): PlayerColor {
  return color === 'white' ? 'black' : 'white'
}

export function findKingSquare(game: Chess, color: PlayerColor): SquareName | null {
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && toPlayerColor(cell.color) === color) {
        return cell.square
      }
    }
  }
  return null
}

function deriveStatus(game: Chess): GameState['status'] {
  if (game.isCheckmate()) return 'checkmate'
  if (game.isDraw()) return 'draw'
  if (game.isCheck()) return 'check'
  return 'playing'
}

function deriveResult(game: Chess): GameResult | null {
  if (!game.isCheckmate() && !game.isDraw()) return null
  if (game.isCheckmate()) {
    // Bên tới lượt là bên bị chiếu hết → đối phương thắng
    return { winner: opposite(toPlayerColor(game.turn())), reason: 'checkmate' }
  }
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' }
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'threefold-repetition' }
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty-move' }
  return { winner: null, reason: 'insufficient-material' }
}

function toMoveRecord(game: Chess): GameState['moveHistory'] {
  return game.history({ verbose: true }).map((move) => ({
    san: move.san,
    from: move.from,
    to: move.to,
    color: toPlayerColor(move.color),
    piece: toPieceType(move.piece),
    captured: move.captured ? toPieceType(move.captured) : null,
    promotion: move.promotion ? toPieceType(move.promotion) : null,
  }))
}

/** Tổng hợp trạng thái bàn cờ hiện tại thành payload phát cho client */
export function buildGameState(game: Chess): GameState {
  const pieces: PieceOnSquare[] = []
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell) {
        pieces.push({
          square: cell.square,
          type: toPieceType(cell.type),
          color: toPlayerColor(cell.color),
        })
      }
    }
  }

  const moveHistory = toMoveRecord(game)
  const last = moveHistory.at(-1)
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
