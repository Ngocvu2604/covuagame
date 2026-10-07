import { useState } from 'react'
import { GameHeader } from '../components/game/GameHeader'
import { Button } from '../components/common/Button'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { SettingsContent } from '../components/settings/SettingsContent'
import { usePlayerStore } from '../state/playerStore'
import { useT } from '../i18n/translations'
import { isValidPlayerName } from '../utils/validation'

/** Trang cài đặt đầy đủ — dùng chung nội dung với SettingsDrawer trong game.
 * Mọi thay đổi áp dụng ngay và tự lưu vào localStorage. */
export function SettingsPage() {
  const t = useT()
  const playerName = usePlayerStore((s) => s.name)
  const setPlayerName = usePlayerStore((s) => s.setPlayerName)
  const [nameDraft, setNameDraft] = useState(playerName)
  const [nameError, setNameError] = useState<string | null>(null)

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (!isValidPlayerName(trimmed)) {
      setNameError(t('settings.errName'))
      return
    }
    setNameError(null)
    setPlayerName(trimmed)
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 card p-6 shadow-2xl backdrop-blur">
        <GameHeader title={t('home.settings')} />

        <section className="flex flex-col gap-2">
          <p className="section-label">{t('settings.player')}</p>
          <div className="flex gap-2">
            <input
              value={nameDraft}
              maxLength={20}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitName()
              }}
              placeholder={t('settings.namePlaceholder')}
              className="field-input"
            />
            <Button variant="primary" onClick={commitName}>
              {t('common.save')}
            </Button>
          </div>
          <ErrorMessage message={nameError} />
        </section>

        <SettingsContent />
      </div>
    </main>
  )
}
