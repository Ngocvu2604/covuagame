import { useState } from 'react'
import { GameHeader } from '../components/game/GameHeader'
import { Button } from '../components/common/Button'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { SettingsContent } from '../components/settings/SettingsContent'
import { usePlayerStore } from '../state/playerStore'
import { isValidPlayerName } from '../utils/validation'

/** Trang cài đặt đầy đủ — dùng chung nội dung với SettingsDrawer trong game.
 * Mọi thay đổi áp dụng ngay và tự lưu vào localStorage. */
export function SettingsPage() {
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
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
        <GameHeader title="Cài đặt" />

        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Người chơi</p>
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

        <SettingsContent />
      </div>
    </main>
  )
}
