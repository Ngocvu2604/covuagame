import type { Chess } from 'chess.js'
import type { GameResult, GameStatus, PlayerColor, SquareName } from '../types/chess'
import { opposite, toPlayerColor } from './chessUtils'

/** Tìm ô chứa vua của một màu — dùng để highlight khi bị chiếu */
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

/** Trạng thái trận đấu suy ra từ vị trí hiện tại trên bàn cờ */
export function deriveStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return 'checkmate'
  if (game.isDraw()) return 'draw'
  if (game.isCheck()) return 'check'
  return 'playing'
}

/**
 * Kết quả trận đấu dựa trên luật cờ vua (null nếu chưa kết thúc).
 * Trạng thái 'resigned' / 'timeout' do tầng app quyết định, không nằm ở đây.
 */
export function deriveResult(game: Chess): GameResult | null {
  if (!game.isCheckmate() && !game.isDraw()) return null

  if (game.isCheckmate()) {
    // Bên đang tới lượt là bên bị chiếu hết → đối phương thắng
    return { winner: opposite(toPlayerColor(game.turn())), reason: 'checkmate' }
  }
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' }
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'threefold-repetition' }
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty-move' }
  return { winner: null, reason: 'insufficient-material' }
}
