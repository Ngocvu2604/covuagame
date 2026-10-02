/**
 * Nhạc nền của Chess Arena.
 *
 * Có 2 nguồn âm, tự động chọn:
 * 1. File nhạc do người dùng cung cấp tại `client/public/audio/background.mp3`
 *    (nếu tồn tại — dùng HTMLAudioElement, loop, volume theo setting).
 *    Chỉ dùng file do BẠN tự upload với nguồn gốc bản quyền rõ ràng.
 * 2. Nếu không có file: nhạc nền ambient nhẹ được TỔNG HỢP bằng Web Audio
 *    (chuỗi hợp âm chậm Am7 → Fmaj7 → C → G, attack/release mềm) — không vi phạm
 *    bản quyền, hoạt động offline.
 *
 * Chính sách autoplay: nhạc CHỈ bắt đầu sau tương tác đầu tiên của người dùng
 * (unlock() được gọi trên pointerdown/keydown đầu tiên từ App).
 */

const MUSIC_FILE_URL = `${import.meta.env.BASE_URL}audio/background.mp3`
const CHORD_DURATION = 8 // giây mỗi hợp âm
const LOOKAHEAD_SECONDS = 2

const CHORDS: number[][] = [
  [110.0, 261.63, 329.63, 392.0], // Am7
  [87.31, 220.0, 261.63, 329.63], // Fmaj7
  [130.81, 196.0, 329.63], // C
  [98.0, 246.94, 293.66, 349.23], // G
]

class MusicService {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private timer: number | null = null
  private chordIndex = 0
  private nextChordAt = 0
  private enabled = false
  private volume = 0.5
  private unlocked = false
  private started = false
  private fileAudio: HTMLAudioElement | null = null
  private usingFile = false

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!this.unlocked) return
    if (enabled) {
      this.start()
    } else {
      this.stop()
    }
  }

  setVolume(volume: number): void {
    const clamped = Math.min(1, Math.max(0, volume))
    this.volume = clamped
    if (this.fileAudio) {
      this.fileAudio.volume = clamped
    } else if (this.master) {
      this.master.gain.value = clamped * 0.2
    }
  }

  /** Gọi sau tương tác đầu tiên của người dùng (tránh bị chặn autoplay) */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    if (this.enabled) {
      this.start()
    }
  }

  private start(): void {
    if (this.started) return
    this.started = true

    // Ưu tiên file nhạc nếu nạp được; lỗi/không có → tổng hợp
    this.tryStartFile()
    window.setTimeout(() => {
      if (this.started && !this.usingFile) {
        this.startSynth()
      }
    }, 1200)
  }

  private stop(): void {
    this.started = false
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.fileAudio) {
      this.fileAudio.pause()
    }
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.setValueAtTime(0, this.ctx.currentTime)
    }
  }

  /** Thử phát file nhạc người dùng cung cấp */
  private tryStartFile(): void {
    try {
      const audio = new Audio(MUSIC_FILE_URL)
      audio.loop = true
      audio.volume = this.volume
      audio.addEventListener('canplay', () => {
        if (!this.started || this.usingFile) return
        this.usingFile = true
        void audio.play().catch(() => {
          this.usingFile = false
        })
      })
      audio.addEventListener('error', () => {
        this.usingFile = false
      })
      audio.load()
      this.fileAudio = audio
    } catch {
      this.fileAudio = null
    }
  }

  /** Nhạc nền tổng hợp: chuỗi hợp âm chậm qua lowpass filter */
  private startSynth(): void {
    const context = this.ensureContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()

    if (!this.master) {
      this.master = context.createGain()
      this.filter = context.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.value = 900
      this.master.gain.value = this.volume * 0.2
      this.master.connect(this.filter)
      this.filter.connect(context.destination)
    } else {
      this.master.gain.value = this.volume * 0.2
    }

    this.nextChordAt = context.currentTime + 0.1
    if (this.timer === null) {
      this.timer = window.setInterval(() => this.scheduleChords(), 1000)
      this.scheduleChords()
    }
  }

  private scheduleChords(): void {
    const context = this.ctx
    if (!context || !this.master) return
    while (this.nextChordAt < context.currentTime + LOOKAHEAD_SECONDS) {
      this.playChord(CHORDS[this.chordIndex % CHORDS.length], this.nextChordAt)
      this.chordIndex++
      this.nextChordAt += CHORD_DURATION
    }
  }

  private playChord(frequencies: number[], start: number): void {
    const context = this.ctx
    if (!context || !this.master) return
    for (const freq of frequencies) {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = freq

      const gain = context.createGain()
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.09, start + 2.8)
      gain.gain.setValueAtTime(0.09, start + CHORD_DURATION - 3)
      gain.gain.linearRampToValueAtTime(0, start + CHORD_DURATION - 0.4)

      oscillator.connect(gain)
      gain.connect(this.master)
      oscillator.start(start)
      oscillator.stop(start + CHORD_DURATION)
    }
  }

  private ensureContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext()
      }
      return this.ctx
    } catch {
      return null
    }
  }
}

export const musicService = new MusicService()