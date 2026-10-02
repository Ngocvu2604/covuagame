import { create } from 'zustand'
import type { GameResult, GameState, GameStatus, MoveRecord, PieceOnSquare, PieceType, SquareName } from '../types/chess'
import { ChessGame } from '../chess/chessEngine'

/**
 * Engine của ván cờ dùng chung toàn app — một ván tại một thời điểm.
 * Store giữ trạng thái dạng "snapshot" (đã map sang domain types) để UI
 * render; mọi thao tác đi qua engine rồi cập nhật snapshot mới.
 */
const gameEngine = new ChessGame()

/**
 * Kết quả do tầng app quyết định (đầu hàng, hết giờ) — luật cờ không
 * sinh ra các kết quả này nên được "chồng" lên snapshot khi cần.
 */
let resultOverride: GameResult | null = null

function statusForEndReason(reason: GameResult['reason']): GameStatus {
  switch (reason) {
    case 'resignation':
      return 'resigned'
    case 'timeout':
      return 'timeout'
    default:
      return 'draw'
  }
}

function currentSnapshot(): GameState {
  const snapshot = gameEngine.getSnapshot()
  if (resultOverride && !snapshot.result) {
    return { ...snapshot, result: resultOverride, status: statusForEndReason(resultOverride.reason) }
  }
  return snapshot
}

interface GameStore {
  /** Trạng thái ván cờ để render UI */
  state: GameState

  /** Thực hiện nước đi; trả về bản ghi nếu hợp lệ, null nếu không hợp lệ */
  makeMove: (from: SquareName, to: SquareName, promotion?: PieceType) => MoveRecord | null

  /** Các ô đích hợp lệ từ một ô xuất phát */
  getLegalTargets: (from: SquareName) => SquareName[]

  /** Nước đi from → to có cần chọn quân phong cấp không */
  isPromotionNeeded: (from: SquareName, to: SquareName) => boolean

  /** Quân cờ đang đứng trên một ô (null nếu trống) */
  getPieceAt: (square: SquareName) => PieceOnSquare | null

  /** Kết thúc ván bởi tầng app (đầu hàng / hết giờ) */
  endGame: (result: GameResult) => void

  /** Bắt đầu ván mới */
  resetGame: () => void
}

export const useGameStore = create<GameStore>()((set) => ({
  state: currentSnapshot(),

  makeMove: (from, to, promotion) => {
    const record = gameEngine.tryMove(from, to, promotion)
    if (record) {
      set({ state: currentSnapshot() })
    }
    return record
  },

  getLegalTargets: (from) => gameEngine.getLegalTargets(from),

  isPromotionNeeded: (from, to) => gameEngine.isPromotionNeeded(from, to),

  getPieceAt: (square) => gameEngine.getPieceAt(square),

  endGame: (result) => {
    // Kết quả từ luật cờ luôn ưu tiên; không ghi đè hai lần
    if (gameEngine.getResult() || resultOverride) return
    resultOverride = result
    set({ state: currentSnapshot() })
  },

  resetGame: () => {
    resultOverride = null
    gameEngine.reset()
    set({ state: currentSnapshot() })
  },
}))
