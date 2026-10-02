import { useState } from 'react'
import { GameHeader } from '../components/game/GameHeader'
import { Button } from '../components/common/Button'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { BOARD_THEMES } from '../constants/chess'
import { DIFFICULTY_OPTIONS } from '../constants/difficulty'
import { useSettingsStore } from '../state/settingsStore'
import { usePlayerStore } from '../state/playerStore'
import { isValidPlayerName } from '../utils/validation'

/** Trang cài đặt: tên người chơi, âm thanh, màu bàn cờ, độ khó mặc định.
 * Mọi thay đổi được lưu tự động vào localStorage. */
export function SettingsPage() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const boardTheme = useSettingsStore((s) => s.boardTheme)
  const defaultDifficulty = useSettingsStore((s) => s.defaultDifficulty)
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled)
  const setBoardTheme = useSettingsStore((s) => s.setBoardTheme)
  const setDefaultDifficulty = useSettingsStore((s) => s.setDefaultDifficulty)
  const playerName = usePlayerStore((s) => s.name)
  const setPlayerName = usePlayerStore((s) => s.setPlayerName)

  const [nameDraft, setNameDraft] = useState(playerName)
  const [nameError, setNameError] = useState<string | null>(null)

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (!isValidPlayerName(trimmed)) {
      setNameError('Tên phải từ 1 đến 20 ký tự.')
      return
    }
    setNameError(null)
    setPlayerName(trimmed)
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
        <GameHeader title="Cài đặt" />

        <section aria-label="Tên người chơi" className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-slate-500">Tên người chơi</p>
          <div className="flex gap-2">
            <input
              value={nameDraft}
              maxLength={20}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitName()
              }}
              placeholder="Nhập tên của bạn"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
            <Button variant="primary" onClick={commitName}>
              Lưu
            </Button>
          </div>
          <ErrorMessage message={nameError} />
        </section>

        <section aria-label="Âm thanh" className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Âm thanh</p>
            <p className="text-xs text-slate-400">Bật/tắt hiệu ứng âm thanh</p>
          </div>
          <Button
            variant={soundEnabled ? 'primary' : 'secondary'}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? '🔊 Bật' : '🔇 Tắt'}
          </Button>
        </section>

        <section aria-label="Màu bàn cờ" className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-slate-500">Màu bàn cờ</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(BOARD_THEMES).map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setBoardTheme(theme.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 transition ${
                  boardTheme === theme.id
                    ? 'border-emerald-500 bg-emerald-600/15'
                    : 'border-white/10 bg-slate-800/60 hover:bg-slate-800'
                }`}
              >
                <span aria-hidden className="flex overflow-hidden rounded-md ring-1 ring-white/10">
                  <span style={{ backgroundColor: theme.light }} className="h-6 w-6" />
                  <span style={{ backgroundColor: theme.dark }} className="h-6 w-6" />
                </span>
                <span className="text-xs">{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Độ khó mặc định" className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-slate-500">Độ khó mặc định</p>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDefaultDifficulty(option.id)}
                className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                  defaultDifficulty === option.id
                    ? 'border-emerald-500 bg-emerald-600/15 text-emerald-200'
                    : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {option.emoji} {option.name}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
