import { Chess } from 'chess.js'
import type { GameResult, GameState, MoveRecord, PlayerColor, SquareName } from '../types/game'
import { buildGameState, opposite, toPieceType, toPlayerColor } from './GameState'
import { findLegalMove } from './MoveValidator'
import { ChessClock } from './ChessClock'
import { isValidPromotion, isValidSquare } from '../utils/validation'

export type MoveOutcome =
  | { ok: true; record: MoveRecord; state: GameState }
  | { ok: false; error: string }

export type ActionOutcome =
  | { ok: true; result: GameResult; state: GameState }
  | { ok: false; error: string }

interface ManagedGame {
  game: Chess
  clock: ChessClock
  finished: boolean
}

export interface GameManagerOptions {
  flagCheckIntervalMs: number
}

/**
 * Quản lý trạng thái cờ của mọi phòng: mỗi phòng có một bàn cờ + đồng hồ.
 * Mọi nước đi đều được xác thực ở đây — server là nguồn sự thật (mục 19):
 * kiểm tra ván còn hoạt động, đúng màu, đúng lượt, nước đi hợp lệ.
 */
export class GameManager {
  private readonly games = new Map<string, ManagedGame>() // key: room code
  private flagTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly options: GameManagerOptions,
    /** Được gọi khi một bên hết giờ (do bộ đếm định kỳ phát hiện) */
    private readonly onTimeoutFlag: (roomCode: string, loserColor: PlayerColor) => void,
  ) {}

  createGame(roomCode: string, timeMinutes: number | null): void {
    const clock = new ChessClock(timeMinutes === null ? null : timeMinutes * 60_000)
    this.games.set(roomCode, { game: new Chess(), clock, finished: false })
    clock.start('white')
    this.ensureFlagTimer()
  }

  removeGame(roomCode: string): void {
    this.games.delete(roomCode)
  }

  getState(roomCode: string): GameState | null {
    const managed = this.games.get(roomCode)
    return managed ? buildGameState(managed.game) : null
  }

  /** Thời gian còn lại của 2 bên (null nếu ván không dùng đồng hồ) */
  getClock(roomCode: string): { whiteMs: number; blackMs: number } | null {
    const managed = this.games.get(roomCode)
    if (!managed || !managed.clock.enabled) return null
    return {
      whiteMs: managed.clock.getRemaining('white'),
      blackMs: managed.clock.getRemaining('black'),
    }
  }

  /**
   * Xác thực và thực hiện nước đi. Trả về lỗi cụ thể nếu:
   * ván đã kết thúc, không phải lượt của màu này, hoặc nước đi không hợp lệ.
   */
  tryMove(
    roomCode: string,
    color: PlayerColor,
    payload: { from: unknown; to: unknown; promotion?: unknown },
  ): MoveOutcome {
    const managed = this.games.get(roomCode)
    if (!managed || managed.finished) return { ok: false, error: 'GAME_NOT_ACTIVE' }

    const { game, clock } = managed
    if (!isValidSquare(payload.from) || !isValidSquare(payload.to)) {
      return { ok: false, error: 'INVALID_MOVE' }
    }
    if (payload.promotion !== undefined && !isValidPromotion(payload.promotion)) {
      return { ok: false, error: 'INVALID_MOVE' }
    }
    if (toPlayerColor(game.turn()) !== color) {
      return { ok: false, error: 'NOT_YOUR_TURN' }
    }

    const from = payload.from as SquareName
    const to = payload.to as SquareName
    const legal = findLegalMove(game, from, to, payload.promotion)
    if (!legal) return { ok: false, error: 'INVALID_MOVE' }

    // Bên đi đã hết giờ — bộ đếm định kỳ sẽ xử lý kết thúc ngay sau đó
    if (clock.hasFlag(color)) return { ok: false, error: 'TIMEOUT' }

    clock.endTurn(color)
    const move = game.move({
      from,
      to,
      promotion: payload.promotion,
    })
    const gameOver = game.isGameOver()
    // Ván kết thúc thì không khởi động đồng hồ cho bên "tới lượt" tiếp theo
    if (!gameOver) clock.start(toPlayerColor(game.turn()))

    const record: MoveRecord = {
      san: move.san,
      from: move.from,
      to: move.to,
      color: toPlayerColor(move.color),
      piece: toPieceType(move.piece),
      captured: move.captured ? toPieceType(move.captured) : null,
      promotion: move.promotion ? toPieceType(move.promotion) : null,
    }

    if (gameOver) {
      managed.finished = true
    }

    return { ok: true, record, state: buildGameState(game) }
  }

  resign(roomCode: string, color: PlayerColor): ActionOutcome {
    const managed = this.games.get(roomCode)
    if (!managed || managed.finished) return { ok: false, error: 'GAME_NOT_ACTIVE' }
    return this.finish(managed, { winner: opposite(color), reason: 'resignation' })
  }

  agreeDraw(roomCode: string): ActionOutcome {
    const managed = this.games.get(roomCode)
    if (!managed || managed.finished) return { ok: false, error: 'GAME_NOT_ACTIVE' }
    return this.finish(managed, { winner: null, reason: 'agreement' })
  }

  /** Xử thua bên hết giờ (do bộ đếm định kỳ gọi) */
  flag(roomCode: string, loserColor: PlayerColor): ActionOutcome {
    const managed = this.games.get(roomCode)
    if (!managed || managed.finished) return { ok: false, error: 'GAME_NOT_ACTIVE' }
    return this.finish(managed, { winner: opposite(loserColor), reason: 'timeout' })
  }

  private finish(managed: ManagedGame, result: GameResult): ActionOutcome {
    managed.finished = true
    return { ok: true, result, state: buildGameState(managed.game) }
  }

  private ensureFlagTimer(): void {
    if (this.flagTimer) return
    this.flagTimer = setInterval(() => this.checkFlags(), this.options.flagCheckIntervalMs)
    this.flagTimer.unref()
  }

  private checkFlags(): void {
    for (const [roomCode, managed] of this.games) {
      if (managed.finished || !managed.clock.enabled) continue
      const active = toPlayerColor(managed.game.turn())
      if (managed.clock.hasFlag(active)) {
        this.onTimeoutFlag(roomCode, active)
      }
    }
  }

  dispose(): void {
    if (this.flagTimer) {
      clearInterval(this.flagTimer)
      this.flagTimer = null
    }
  }
}
