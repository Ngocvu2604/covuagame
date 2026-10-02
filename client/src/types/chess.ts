/**
 * Domain types của game cờ vua — dùng chung toàn app.
 * Tầng UI và tầng logic chỉ giao tiếp qua các types này,
 * types riêng của chess.js bị chặn trong thư mục src/chess.
 */

/** Màu quân của người chơi */
export type PlayerColor = 'white' | 'black'

/** Chế độ chơi */
export type GameMode = 'offline' | 'online'

/** Giao diện màu bàn cờ */
export type BoardThemeId = 'classic' | 'ocean' | 'walnut'

/** Loại quân cờ */
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'

/** Cột bàn cờ (a–h) */
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'

/** Hàng bàn cờ (1–8) */
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

/** Tên ô cờ hợp lệ, ví dụ 'e4' */
export type SquareName = `${File}${Rank}`

/** Trạng thái trận đấu */
export type GameStatus =
  | 'waiting'
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'draw'
  | 'resigned'
  | 'timeout'

/** Lý do trận đấu kết thúc */
export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'threefold-repetition'
  | 'fifty-move'
  | 'insufficient-material'
  | 'resignation'
  | 'timeout'
  | 'agreement'

/** Kết quả trận đấu — winner = null nghĩa là hòa */
export interface GameResult {
  winner: PlayerColor | null
  reason: GameEndReason
}

/** Quân cờ đang đứng trên một ô */
export interface PieceOnSquare {
  square: SquareName
  type: PieceType
  color: PlayerColor
}

/** Một nước đi đã được thực hiện */
export interface MoveRecord {
  san: string
  from: SquareName
  to: SquareName
  color: PlayerColor
  piece: PieceType
  captured: PieceType | null
  promotion: PieceType | null
}

/** Điểm neo của nước đi cuối cùng để highlight trên bàn cờ */
export interface LastMove {
  from: SquareName
  to: SquareName
}

/** Trạng thái đầy đủ của ván cờ dùng để render UI / đồng bộ */
export interface GameState {
  fen: string
  turn: PlayerColor
  pieces: PieceOnSquare[]
  moveHistory: MoveRecord[]
  status: GameStatus
  inCheck: boolean
  checkSquare: SquareName | null
  lastMove: LastMove | null
  result: GameResult | null
}
