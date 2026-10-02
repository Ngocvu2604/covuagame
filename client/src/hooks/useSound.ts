import { useEffect, useRef } from 'react'
import type { GameState, PlayerColor } from '../types/chess'
import { pickMoveSound, soundService } from '../services/soundService'
import type { SoundName } from '../services/soundService'
import { musicService } from '../services/musicService'
import { useSettingsStore } from '../state/settingsStore'

/**
 * Đồng bộ toàn bộ cài đặt âm thanh (SFX + nhạc nền) từ Settings
 * vào các audio service, và mở khoá AudioContext sau tương tác
 * đầu tiên của người dùng (chính sách autoplay của trình duyệt).
 */
export function useSound(): void {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const musicEnabled = useSettingsStore((s) => s.musicEnabled)
  const musicVolume = useSettingsStore((s) => s.musicVolume)

  useEffect(() => {
    soundService.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    musicService.setEnabled(musicEnabled)
  }, [musicEnabled])

  useEffect(() => {
    musicService.setVolume(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    const unlock = () => musicService.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('click', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('click', unlock)
    }
  }, [])
}

interface GameSoundEventsOptions {
  /** null khi chưa có ván (ví dụ chưa vào phòng online) */
  state: GameState | null
  /** Màu quân của người chơi hiện tại (để phân biệt thắng/thua); null = quan sát trung lập */
  myColor: PlayerColor | null
}

/**
 * Theo dõi chuyển trạng thái ván cờ và phát âm thanh phù hợp (mục 15):
 * đi quân / ăn quân / nhập thành / phong cấp / chiếu / chiếu hết / thắng / thua / hòa.
 * Mỗi lần chuyển trạng thái phát tối đa một âm theo mức ưu tiên.
 */
export function useGameSoundEvents({ state, myColor }: GameSoundEventsOptions): void {
  const prevStateRef = useRef<GameState | null>(null)

  useEffect(() => {
    if (!state) {
      prevStateRef.current = null
      return
    }
    const prevState = prevStateRef.current
    prevStateRef.current = state
    if (!prevState || prevState.fen === state.fen) return

    // Ván kết thúc vì lý do ngoài bàn cờ (đầu hàng / hết giờ / hòa thỏa thuận).
    // Chiếu hết để nhánh nước đi xử lý (âm checkmate thay cho âm thắng/thua).
    if (!prevState.result && state.result && state.result.reason !== 'checkmate') {
      const sound: SoundName =
        state.result.winner === null
          ? 'draw'
          : state.result.winner === myColor
            ? 'victory'
            : 'defeat'
      soundService.play(sound)
      return
    }

    // Nước đi mới — bỏ qua khi lịch sử rút ngắn lại (reset ván mới)
    const lastMove = state.moveHistory.at(-1)
    if (!lastMove || state.moveHistory.length <= prevState.moveHistory.length) return

    const sound: SoundName =
      state.result?.reason === 'checkmate' ? 'checkmate' : pickMoveSound(lastMove, state.inCheck)
    soundService.play(sound)
  }, [state, myColor])
}
