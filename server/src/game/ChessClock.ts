import type { PlayerColor } from '../types/game'

/**
 * Đồng hồ cờ phía server — nguồn sự thật về thời gian (mục 9).
 * Tính delta theo Date.now() nên chính xác bất kể chu kỳ kiểm tra.
 */

export class ChessClock {
  private readonly remaining: Record<PlayerColor, number>
  private active: PlayerColor | null = null
  private turnStartedAt: number | null = null

  constructor(private readonly initialMs: number | null) {
    this.remaining = { white: initialMs ?? 0, black: initialMs ?? 0 }
  }

  get enabled(): boolean {
    return this.initialMs !== null
  }

  /** Bắt đầu tính giờ cho bên tới lượt */
  start(color: PlayerColor): void {
    if (!this.enabled || this.active === color) return
    this.active = color
    this.turnStartedAt = Date.now()
  }

  /** Kết thúc lượt của bên vừa đi, trừ thời gian đã dùng */
  endTurn(color: PlayerColor): void {
    if (!this.enabled || this.active !== color || this.turnStartedAt === null) return
    const elapsed = Date.now() - this.turnStartedAt
    this.remaining[color] = Math.max(0, this.remaining[color] - elapsed)
    this.active = null
    this.turnStartedAt = null
  }

  /** Thời gian còn lại thực tế (bao gồm thời gian đang trôi của lượt hiện tại) */
  getRemaining(color: PlayerColor): number {
    if (!this.enabled) return 0
    let remaining = this.remaining[color]
    if (this.active === color && this.turnStartedAt !== null) {
      remaining = Math.max(0, remaining - (Date.now() - this.turnStartedAt))
    }
    return remaining
  }

  /** Bên tới lượt đã hết giờ chưa */
  hasFlag(color: PlayerColor): boolean {
    return this.enabled && this.getRemaining(color) <= 0
  }
}
