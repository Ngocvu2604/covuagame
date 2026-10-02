import type { MoveRecord } from '../types/chess'

/**
 * Âm thanh game tổng hợp bằng Web Audio API — không cần file âm thanh
 * nên hoạt động hoàn toàn offline (mục 15, 17). Âm nhẹ, tạo bởi oscillator
 * với envelope ngắn.
 */

export type SoundName =
  | 'move'
  | 'capture'
  | 'check'
  | 'checkmate'
  | 'castle'
  | 'promote'
  | 'victory'
  | 'defeat'
  | 'draw'

interface ToneSpec {
  freq: number
  /** Thời điểm bắt đầu (giây, tính từ lúc phát) */
  startAt: number
  duration: number
  type?: OscillatorType
  gain?: number
}

const RECIPES: Record<SoundName, ToneSpec[]> = {
  move: [
    { freq: 260, startAt: 0, duration: 0.05, gain: 0.5 },
    { freq: 180, startAt: 0.03, duration: 0.06, gain: 0.6 },
  ],
  capture: [
    { freq: 150, startAt: 0, duration: 0.1, type: 'square', gain: 0.3 },
    { freq: 110, startAt: 0.02, duration: 0.12, gain: 0.5 },
  ],
  check: [
    { freq: 660, startAt: 0, duration: 0.09, type: 'triangle', gain: 0.4 },
    { freq: 880, startAt: 0.1, duration: 0.12, type: 'triangle', gain: 0.4 },
  ],
  checkmate: [
    { freq: 523, startAt: 0, duration: 0.16, type: 'triangle', gain: 0.4 },
    { freq: 392, startAt: 0.15, duration: 0.16, type: 'triangle', gain: 0.4 },
    { freq: 262, startAt: 0.3, duration: 0.3, type: 'triangle', gain: 0.45 },
  ],
  castle: [
    { freq: 260, startAt: 0, duration: 0.05, gain: 0.5 },
    { freq: 180, startAt: 0.04, duration: 0.06, gain: 0.55 },
    { freq: 260, startAt: 0.12, duration: 0.05, gain: 0.45 },
    { freq: 180, startAt: 0.16, duration: 0.06, gain: 0.6 },
  ],
  promote: [
    { freq: 523, startAt: 0, duration: 0.09, type: 'triangle', gain: 0.4 },
    { freq: 659, startAt: 0.09, duration: 0.09, type: 'triangle', gain: 0.4 },
    { freq: 784, startAt: 0.18, duration: 0.14, type: 'triangle', gain: 0.45 },
  ],
  victory: [
    { freq: 523, startAt: 0, duration: 0.12, type: 'triangle', gain: 0.4 },
    { freq: 659, startAt: 0.12, duration: 0.12, type: 'triangle', gain: 0.4 },
    { freq: 784, startAt: 0.24, duration: 0.12, type: 'triangle', gain: 0.4 },
    { freq: 1046, startAt: 0.36, duration: 0.3, type: 'triangle', gain: 0.45 },
  ],
  defeat: [
    { freq: 392, startAt: 0, duration: 0.16, gain: 0.4 },
    { freq: 330, startAt: 0.16, duration: 0.16, gain: 0.4 },
    { freq: 262, startAt: 0.32, duration: 0.3, gain: 0.42 },
  ],
  draw: [
    { freq: 440, startAt: 0, duration: 0.14, gain: 0.35 },
    { freq: 440, startAt: 0.18, duration: 0.2, gain: 0.3 },
  ],
}

const MASTER_VOLUME = 0.5

class SoundService {
  private context: AudioContext | null = null
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    const context = this.ensureContext()
    if (!context) return
    if (context.state === 'suspended') {
      void context.resume()
    }

    const now = context.currentTime
    for (const tone of RECIPES[name]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = tone.type ?? 'sine'
      oscillator.frequency.value = tone.freq

      const start = now + tone.startAt
      const peak = (tone.gain ?? 0.4) * MASTER_VOLUME
      gain.gain.setValueAtTime(peak, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + tone.duration + 0.02)
    }
  }

  /** Tạo AudioContext lazily (trình duyệt yêu cầu user gesture trước) */
  private ensureContext(): AudioContext | null {
    try {
      if (!this.context) {
        const ContextConstructor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!ContextConstructor) return null
        this.context = new ContextConstructor()
      }
      return this.context
    } catch {
      return null
    }
  }
}

export const soundService = new SoundService()

/** Chọn âm cho một nước đi mới — ưu tiên: chiếu > phong cấp > nhập thành > ăn quân > đi thường */
export function pickMoveSound(move: MoveRecord, inCheck: boolean): SoundName {
  if (inCheck) return 'check'
  if (move.promotion) return 'promote'
  // Nhập thành: vua đi ngang đúng 2 cột
  if (move.piece === 'king' && Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0)) === 2) {
    return 'castle'
  }
  if (move.captured) return 'capture'
  return 'move'
}
