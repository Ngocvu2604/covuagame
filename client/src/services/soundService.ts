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

interface BaseSpec {
  /** Thời điểm bắt đầu (giây, tính từ lúc phát) */
  startAt: number
  duration: number
  gain?: number
}

export interface ToneSpec extends BaseSpec {
  kind?: 'tone'
  freq: number
  type?: OscillatorType
}

/** Lớp nhiễu trắng qua bandpass — tạo tiếng vật lý (gõ gỗ, va chạm) */
export interface NoiseSpec extends BaseSpec {
  kind: 'noise'
  filterFreq: number
  q?: number
}

export type RecipeSpec = ToneSpec | NoiseSpec

/**
 * Công thức âm "thực tế": mỗi sự kiện = nhiều lớp.
 * - noise burst (buffer trắng, băng thông lọc)   → tiếng vật lý (chạm/va)
 * - body tone tần số thấp decay nhanh            → thân gỗ cộng hưởng
 * - click/quãng nhảy                             → chi tiết nhận diện
 * Tổng chuẩn WEB AUDIO RECIPES; tổng gain mỗi recipe ≈ ≤0.9 để không vỡ.
 */

export const RECIPES: Record<SoundName, (SoundName extends never ? never : ToneSpec | NoiseSpec)[]> = {
  // Đi quân: đầu gõ gỗ "tock" — noise ngắn lọc dải 1.2kHz + thân gỗ 190Hz
  move: [
    { kind: 'noise', startAt: 0, duration: 0.045, gain: 0.5, filterFreq: 1200, q: 1.4 },
    { kind: 'tone', freq: 190, startAt: 0, duration: 0.09, gain: 0.4 },
    { kind: 'tone', freq: 320, startAt: 0.004, duration: 0.05, gain: 0.18 },
  ],
  // Ăn quân: hai tiếng va "knock-knock" chắc — noise dải trầm hơn + thân 140Hz
  capture: [
    { kind: 'noise', startAt: 0, duration: 0.06, gain: 0.62, filterFreq: 900, q: 1.1 },
    { kind: 'tone', freq: 140, startAt: 0, duration: 0.12, gain: 0.55 },
    { kind: 'noise', startAt: 0.07, duration: 0.05, gain: 0.5, filterFreq: 700, q: 1.1 },
    { kind: 'tone', freq: 120, startAt: 0.07, duration: 0.13, gain: 0.5 },
  ],
  // Chiếu vua: chuông gỗ dịu 2 nốt — hit kim loại ốp lát + ngân 660→520Hz
  check: [
    { kind: 'noise', startAt: 0, duration: 0.03, gain: 0.3, filterFreq: 2600, q: 3 },
    { kind: 'tone', freq: 660, startAt: 0, duration: 0.28, gain: 0.32 },
    { kind: 'tone', freq: 524, startAt: 0.13, duration: 0.34, gain: 0.3 },
  ],
  checkmate: [
    { kind: 'noise', startAt: 0, duration: 0.05, gain: 0.4, filterFreq: 1800, q: 2 },
    { kind: 'tone', freq: 523, startAt: 0, duration: 0.2, gain: 0.34 },
    { kind: 'tone', freq: 392, startAt: 0.16, duration: 0.2, gain: 0.34 },
    { kind: 'tone', freq: 262, startAt: 0.32, duration: 0.36, gain: 0.4 },
  ],
  // Nhập thành: 2 lần gõ gỗ liền mạch (vua chạm rồi xe chạm)
  castle: [
    { kind: 'noise', startAt: 0, duration: 0.045, gain: 0.5, filterFreq: 1200, q: 1.4 },
    { kind: 'tone', freq: 190, startAt: 0, duration: 0.09, gain: 0.4 },
    { kind: 'noise', startAt: 0.11, duration: 0.045, gain: 0.52, filterFreq: 1050, q: 1.4 },
    { kind: 'tone', freq: 165, startAt: 0.11, duration: 0.1, gain: 0.42 },
  ],
  promote: [
    { kind: 'tone', freq: 523, startAt: 0, duration: 0.09, type: 'triangle', gain: 0.4 },
    { kind: 'tone', freq: 659, startAt: 0.09, duration: 0.09, type: 'triangle', gain: 0.4 },
    { kind: 'tone', freq: 784, startAt: 0.18, duration: 0.14, type: 'triangle', gain: 0.45 },
  ],
  victory: [
    { kind: 'tone', freq: 523, startAt: 0, duration: 0.12, type: 'triangle', gain: 0.4 },
    { kind: 'tone', freq: 659, startAt: 0.12, duration: 0.12, type: 'triangle', gain: 0.4 },
    { kind: 'tone', freq: 784, startAt: 0.24, duration: 0.12, type: 'triangle', gain: 0.4 },
    { kind: 'tone', freq: 1046, startAt: 0.36, duration: 0.3, type: 'triangle', gain: 0.45 },
  ],
  defeat: [
    { kind: 'tone', freq: 392, startAt: 0, duration: 0.16, gain: 0.4 },
    { kind: 'tone', freq: 330, startAt: 0.16, duration: 0.16, gain: 0.4 },
    { kind: 'tone', freq: 262, startAt: 0.32, duration: 0.3, gain: 0.42 },
  ],
  draw: [
    { kind: 'tone', freq: 440, startAt: 0, duration: 0.14, gain: 0.35 },
    { kind: 'tone', freq: 440, startAt: 0.18, duration: 0.2, gain: 0.3 },
  ],
}

const MASTER_VOLUME = 0.5

/** Khoảng nghỉ tối thiểu giữa 2 âm hover (chống ồn khi lướt nhanh qua nhiều quân) */
const HOVER_THROTTLE_MS = 70

class SoundService {
  private context: AudioContext | null = null
  private enabled = true
  /** Oscillator của âm hover đang vang — dùng để CẤT âm cũ trước khi phát âm mới */
  private hoverNodes: { oscillator: OscillatorNode; gain: GainNode } | null = null
  private lastHoverPlayedAt = 0
  private noiseBuffer: AudioBuffer | null = null

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopHover()
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    const context = this.ensureContext()
    if (!context) return
    if (context.state === 'suspended') {
      void context.resume()
    }

    const now = context.currentTime
    for (const spec of RECIPES[name]) {
      const peak = (spec.gain ?? 0.4) * MASTER_VOLUME
      const start = now + spec.startAt

      if (spec.kind === 'noise') {
        // Lớp vật lý: noise trắng ngắn qua bandpass — tiếng chạm/va
        const source = context.createBufferSource()
        source.buffer = this.getNoiseBuffer(context)
        const filter = context.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = spec.filterFreq
        filter.Q.value = spec.q ?? 1.2
        const gain = context.createGain()
        gain.gain.setValueAtTime(peak, start)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(context.destination)
        source.start(start)
        source.stop(start + spec.duration + 0.01)
        continue
      }

      // Lớp tông: thân cộng hưởng / nốt ngân
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = spec.type ?? 'sine'
      oscillator.frequency.value = spec.freq
      gain.gain.setValueAtTime(peak, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + spec.duration + 0.02)
    }
  }

  /**
   * Âm tick rất ngắn khi rê chuột qua quân cờ.
   * Chống ồn 2 lớp (mục "tối ưu hóa chống ồn"):
   * 1. Throttle — không phát lặp trong 70ms kể từ lần phát gần nhất.
   * 2. Cut-old — nếu âm trước đó còn vang thì dừng nó ngay trước khi phát âm mới,
   *    không bao giờ có 2 âm hover chồng lên nhau.
   */
  playHover(): void {
    if (!this.enabled) return
    const wallNow = performance.now()
    if (wallNow - this.lastHoverPlayedAt < HOVER_THROTTLE_MS) return
    this.lastHoverPlayedAt = wallNow

    const context = this.ensureContext()
    if (!context) return
    if (context.state === 'suspended') {
      void context.resume()
    }

    // Cắt âm hover cũ còn vang
    this.stopHover()

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = 1150
    const start = context.currentTime
    gain.gain.setValueAtTime(0.12 * MASTER_VOLUME, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.06)
    this.hoverNodes = { oscillator, gain }
    oscillator.onended = () => {
      this.hoverNodes = null
    }
  }

  /** Dừng âm hover đang phát ngay lập tức */
  private stopHover(): void {
    if (!this.hoverNodes || !this.context) return
    try {
      const now = this.context.currentTime
      this.hoverNodes.gain.gain.cancelScheduledValues(now)
      this.hoverNodes.gain.gain.setValueAtTime(0, now)
      this.hoverNodes.oscillator.stop(now)
    } catch {
      // oscillator đã tự kết thúc
    }
    this.hoverNodes = null
  }

  /** Buffer nhiễu trắng 0.15s dùng chung — tạo một lần, tái sử dụng mọi noise spec */
  private getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const length = Math.floor(context.sampleRate * 0.15)
      const buffer = context.createBuffer(1, length, context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
      this.noiseBuffer = buffer
    }
    return this.noiseBuffer
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
