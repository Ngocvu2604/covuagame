import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import type {
  GameResult,
  GameStatus,
  GameState,
  MoveRecord,
  PieceOnSquare,
  PieceType,
  PlayerColor,
  SquareName,
} from '../types/chess'
import { toPieceSymbol, toPieceType, toPlayerColor } from './chessUtils'
import { deriveResult, deriveStatus, findKingSquare } from './chessRules'
import { findLegalMove, getLegalTargetSquares, isPromotionMove } from './moveValidator'

/**
 * Lớp điều phối cốt lõi của ván cờ: khởi tạo, thực hiện nước đi,
 * truy vấn trạng thái và kiểm tra kết thúc ván. Lớp này bao bọc chess.js
 * và là nguồn duy nhất của sự thật về trạng thái bàn cờ (offline).
 */
export class ChessGame {
  private readonly game = new Chess()

  /** Bắt đầu lại ván cờ từ vị trí ban đầu */
  reset(): void {
    this.game.reset()
  }

  getFen(): string {
    return this.game.fen()
  }

  /** Bên đang tới lượt */
  getTurn(): PlayerColor {
    return toPlayerColor(this.game.turn())
  }

  /** Danh sách mọi quân cờ đang có trên bàn */
  getPieces(): PieceOnSquare[] {
    const pieces: PieceOnSquare[] = []
    for (const row of this.game.board()) {
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
    return pieces
  }

  /** Quân cờ đang đứng trên một ô (null nếu ô trống) */
  getPieceAt(square: SquareName): PieceOnSquare | null {
    const piece = this.game.get(square)
    if (!piece) return null
    return { square, type: toPieceType(piece.type), color: toPlayerColor(piece.color) }
  }

  /** Lịch sử toàn bộ các nước đi đã thực hiện */
  getMoveHistory(): MoveRecord[] {
    return this.game.history({ verbose: true }).map(toMoveRecord)
  }

  /** Các ô đích hợp lệ từ một ô xuất phát */
  getLegalTargets(from: SquareName): SquareName[] {
    return getLegalTargetSquares(this.game, from)
  }

  /** Nước đi from → to có cần chọn quân phong cấp không */
  isPromotionNeeded(from: SquareName, to: SquareName): boolean {
    return isPromotionMove(this.game, from, to)
  }

  /**
   * Thực hiện nước đi nếu hợp lệ, trả về bản ghi nước đi.
   * Trả về null nếu nước đi không hợp lệ (hoặc là nước phong cấp
   * mà chưa truyền `promotion`).
   */
  tryMove(from: SquareName, to: SquareName, promotion?: PieceType): MoveRecord | null {
    const legal = findLegalMove(this.game, from, to, promotion)
    if (!legal) return null

    const move = this.game.move({
      from,
      to,
      promotion: promotion ? toPieceSymbol(promotion) : undefined,
    })
    return toMoveRecord(move)
  }

  getStatus(): GameStatus {
    return deriveStatus(this.game)
  }

  /** Kết quả ván cờ theo luật — null nếu chưa kết thúc */
  getResult(): GameResult | null {
    return deriveResult(this.game)
  }

  /** Tổng hợp toàn bộ trạng thái ván cờ để render UI hoặc đồng bộ */
  getSnapshot(): GameState {
    const moveHistory = this.getMoveHistory()
    const last = moveHistory.at(-1)
    const inCheck = this.game.isCheck()
    const turn = this.getTurn()

    return {
      fen: this.game.fen(),
      turn,
      pieces: this.getPieces(),
      moveHistory,
      status: deriveStatus(this.game),
      inCheck,
      checkSquare: inCheck ? findKingSquare(this.game, turn) : null,
      lastMove: last ? { from: last.from, to: last.to } : null,
      result: deriveResult(this.game),
    }
  }
}

function toMoveRecord(move: Move): MoveRecord {
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    color: toPlayerColor(move.color),
    piece: toPieceType(move.piece),
    captured: move.captured ? toPieceType(move.captured) : null,
    promotion: move.promotion ? toPieceType(move.promotion) : null,
  }
}
