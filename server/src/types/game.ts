/**
 * Domain types của game cờ vua phía server — mirror của client/src/types/chess.ts.
 * Hai package tách biệt nên không dùng chung file (theo kiến trúc spec mục 28).
 */

export type PlayerColor = 'white' | 'black'

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'

export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

export type SquareName = `${File}${Rank}`

export type GameStatus =
  | 'waiting'
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'draw'
  | 'resigned'
  | 'timeout'

export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'threefold-repetition'
  | 'fifty-move'
  | 'insufficient-material'
  | 'resignation'
  | 'left'
  | 'abandoned'
  | 'timeout'
  | 'agreement'

export interface GameResult {
  winner: PlayerColor | null
  reason: GameEndReason
}

export interface PieceOnSquare {
  square: SquareName
  type: PieceType
  color: PlayerColor
}

export interface MoveRecord {
  san: string
  from: SquareName
  to: SquareName
  color: PlayerColor
  piece: PieceType
  captured: PieceType | null
  promotion: PieceType | null
}

export interface LastMove {
  from: SquareName
  to: SquareName
}

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
