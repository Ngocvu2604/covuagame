import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameHeader } from '../components/game/GameHeader'
import { Button } from '../components/common/Button'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { TIME_CONTROL_OPTIONS } from '../constants/game'
import { usePlayerStore } from '../state/playerStore'
import { useRoomStore } from '../state/roomStore'
import { getOnlineProvider, createRoom, describeRoomError, joinRoom, prepareConnection } from '../online/roomService'
import { isValidPlayerName, isValidRoomCode } from '../utils/validation'
import { useT } from '../i18n/translations'
import type { TranslationKey } from '../i18n/translations'
import type { CreateAckData, JoinAckData } from '../types/socket'

type ColorChoice = 'white' | 'black' | 'random'

const COLOR_CHOICES: [ColorChoice, TranslationKey][] = [
  ['white', 'lobby.colorWhite'],
  ['black', 'lobby.colorBlack'],
  ['random', 'lobby.colorRandom'],
]

/** Sảnh Online: tạo phòng mới hoặc tham gia phòng bằng mã */
export function OnlineLobbyPage() {
  const navigate = useNavigate()
  const t = useT()
  const savedName = usePlayerStore((s) => s.name)
  const provider = getOnlineProvider()
  // Deploy lên domain thật mà thiếu VITE_APPWRITE_* → rơi về socket localhost → online không thể chạy
  const misconfigured =
    provider === 'socket' && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

  const [name, setName] = useState(savedName)
  const [colorChoice, setColorChoice] = useState<ColorChoice>('white')
  const [timeMinutes, setTimeMinutes] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const choiceButtonClass = (active: boolean) =>
    `rounded-xl border px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm ${
      active
        ? 'border-emerald-500 bg-emerald-600/15 text-emerald-200'
        : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
    }`

  const validateName = (): string | null => {
    if (!isValidPlayerName(name)) {
      setError(t('settings.errName'))
      return null
    }
    return name.trim()
  }

  const enterRoom = (ack: CreateAckData | JoinAckData) => {
    if (!ack.ok || !ack.room || !ack.color) {
      setError(describeRoomError(ack.error, t))
      return
    }
    useRoomStore.getState().applyJoin(ack)
    navigate('/online/game')
  }

  const handleCreate = async () => {
    const playerName = validateName()
    if (!playerName || busy) return
    setBusy(true)
    setError(null)
    try {
      await prepareConnection(playerName)
      const ack = await createRoom({ playerName, colorChoice, timeMinutes })
      enterRoom(ack)
    } catch {
      setError(describeRoomError(undefined, t))
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    const playerName = validateName()
    if (!playerName || busy) return
    const normalizedCode = code.trim().toUpperCase()
    if (!isValidRoomCode(normalizedCode)) {
      setError(t('lobby.errCodeLength'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await prepareConnection(playerName)
      const ack = await joinRoom(playerName, normalizedCode)
      enterRoom(ack)
    } catch {
      setError(describeRoomError(undefined, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
      <div className="flex w-full max-w-md flex-col gap-6 card p-6 shadow-2xl backdrop-blur">
        <GameHeader title={t('invite.title')} />

        {misconfigured && (
          <div role="alert" className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
            {t('lobby.warnMisconfigured')}
          </div>
        )}

        <section aria-label={t('lobby.yourName')} className="flex flex-col gap-2">
          <p className="section-label">{t('lobby.yourName')}</p>
          <input
            value={name}
            maxLength={20}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('lobby.namePlaceholder')}
            className="field-input"
          />
        </section>

        <section aria-label={t('lobby.createSection')} className="flex flex-col gap-3">
          <p className="section-label">{t('lobby.createSection')}</p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_CHOICES.map(([value, labelKey]) => (
              <button
                key={value}
                type="button"
                onClick={() => setColorChoice(value)}
                className={`flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2 ${choiceButtonClass(colorChoice === value)}`}
              >
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 section-label">{t('lobby.timeSection')}</p>
          <div className="grid grid-cols-5 gap-2">
            {TIME_CONTROL_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setTimeMinutes(option.minutes)}
                className={choiceButtonClass(timeMinutes === option.minutes)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button variant="primary" size="lg" fullWidth disabled={busy} onClick={() => void handleCreate()}>
            {t('lobby.create')}
          </Button>
        </section>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-600">
          <span className="h-px flex-1 bg-white/10" /> {t('lobby.or')} <span className="h-px flex-1 bg-white/10" />
        </div>

        <section aria-label={t('lobby.joinSection')} className="flex flex-col gap-3">
          <p className="section-label">{t('lobby.joinSection')}</p>
          <input
            value={code}
            maxLength={6}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleJoin()
            }}
            aria-label={t('lobby.codeLabel')}
            className="field-input px-3 py-3 text-center font-mono text-2xl tracking-[0.3em] uppercase"
          />
          <Button variant="primary" size="lg" fullWidth disabled={busy} onClick={() => void handleJoin()}>
            {t('lobby.join')}
          </Button>
        </section>

        <ErrorMessage message={error} />
        <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
          {t('common.backHome')}
        </Button>
      </div>
    </main>
  )
}
