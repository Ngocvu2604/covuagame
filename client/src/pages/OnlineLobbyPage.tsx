import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameHeader } from '../components/game/GameHeader'
import { Button } from '../components/common/Button'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { TIME_CONTROL_OPTIONS } from '../constants/game'
import { usePlayerStore } from '../state/playerStore'
import { useRoomStore } from '../state/roomStore'
import { connectSocket } from '../online/socketClient'
import { createRoom, joinRoom } from '../online/roomService'
import { isValidPlayerName, isValidRoomCode } from '../utils/validation'
import type { CreateAckData, JoinAckData } from '../types/socket'

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'Không tìm thấy phòng.',
  ROOM_FULL: 'Phòng đã đầy.',
  ROOM_FINISHED: 'Phòng này không còn hoạt động.',
  INVALID_CODE: 'Mã phòng không hợp lệ.',
  INVALID_NAME: 'Tên người chơi không hợp lệ.',
  INVALID_TIME_CONTROL: 'Thời gian không hợp lệ.',
  ACK_TIMEOUT: 'Máy chủ không phản hồi.',
}

function describeError(code?: string): string {
  return (code && ERROR_MESSAGES[code]) || 'Không thể kết nối máy chủ.'
}

type ColorChoice = 'white' | 'black' | 'random'

const COLOR_CHOICES: [ColorChoice, string, string][] = [
  ['white', '⚪', 'Trắng'],
  ['black', '⚫', 'Đen'],
  ['random', '🎲', 'Ngẫu nhiên'],
]

/** Sảnh Online: tạo phòng mới hoặc tham gia phòng bằng mã */
export function OnlineLobbyPage() {
  const navigate = useNavigate()
  const savedName = usePlayerStore((s) => s.name)

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
      setError('Tên phải từ 1 đến 20 ký tự.')
      return null
    }
    return name.trim()
  }

  const enterRoom = (ack: CreateAckData | JoinAckData) => {
    if (!ack.ok || !ack.room || !ack.color) {
      setError(describeError(ack.error))
      return
    }
    const store = useRoomStore.getState()
    store.reset()
    store.setRoom(ack.room)
    store.setYourColor(ack.color)
    if ('state' in ack && ack.state) {
      store.setGameState(ack.state)
    }
    if ('clock' in ack) {
      store.setClock(ack.clock, Date.now())
    }
    if ('chat' in ack && ack.chat) {
      store.setChat(ack.chat)
    }
    navigate('/online/game')
  }

  const handleCreate = async () => {
    const playerName = validateName()
    if (!playerName || busy) return
    setBusy(true)
    setError(null)
    try {
      connectSocket(playerName)
      const ack = await createRoom({ playerName, colorChoice, timeMinutes })
      enterRoom(ack)
    } catch {
      setError(describeError())
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    const playerName = validateName()
    if (!playerName || busy) return
    const normalizedCode = code.trim().toUpperCase()
    if (!isValidRoomCode(normalizedCode)) {
      setError('Mã phòng gồm đúng 6 ký tự.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      connectSocket(playerName)
      const ack = await joinRoom(playerName, normalizedCode)
      enterRoom(ack)
    } catch {
      setError(describeError())
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
        <GameHeader title="Chơi Online" />

        <section aria-label="Tên của bạn" className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-slate-500">Tên của bạn</p>
          <input
            value={name}
            maxLength={20}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nhập tên của bạn"
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
          />
        </section>

        <section aria-label="Tạo phòng mới" className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-slate-500">Tạo phòng mới</p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_CHOICES.map(([value, emoji, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setColorChoice(value)}
                className={`flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2 ${choiceButtonClass(colorChoice === value)}`}
              >
                <span aria-hidden>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">Thời gian (phút)</p>
          <div className="grid grid-cols-5 gap-2" aria-label="Thời gian (phút)">
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
            🏠 Tạo phòng
          </Button>
        </section>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-600">
          <span className="h-px flex-1 bg-white/10" /> hoặc <span className="h-px flex-1 bg-white/10" />
        </div>

        <section aria-label="Tham gia phòng" className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-slate-500">Tham gia phòng</p>
          <input
            value={code}
            maxLength={6}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleJoin()
            }}
            placeholder="X7K9P2"
            aria-label="Mã phòng"
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-center font-mono text-2xl tracking-[0.3em] uppercase outline-none transition focus:border-emerald-500"
          />
          <Button variant="primary" size="lg" fullWidth disabled={busy} onClick={() => void handleJoin()}>
            🚪 Tham gia phòng
          </Button>
        </section>

        <ErrorMessage message={error} />
        <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
          ← Về trang chủ
        </Button>
      </div>
    </main>
  )
}
