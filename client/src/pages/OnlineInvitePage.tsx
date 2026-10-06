import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { GameHeader } from '../components/game/GameHeader'
import { usePlayerStore } from '../state/playerStore'
import { useRoomStore } from '../state/roomStore'
import { describeRoomError, joinRoom, prepareConnection } from '../online/roomService'
import { isValidRoomCode } from '../utils/validation'
import { useT } from '../i18n/translations'

/**
 * Trang đích của Invite Link (#/game/CODE):
 * tự động kiểm tra phòng và vào ghế còn trống, không cần bấm gì thêm.
 */
export function OnlineInvitePage() {
  const params = useParams()
  const navigate = useNavigate()
  const t = useT()
  const playerName = usePlayerStore((s) => s.name)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const normalizedCode = (params.code ?? '').trim().toUpperCase()
      if (!isValidRoomCode(normalizedCode)) {
        setError(t('invite.invalidCode'))
        return
      }
      try {
        await prepareConnection(playerName || t('common.waiting'))
        const ack = await joinRoom(playerName || 'Người chơi', normalizedCode)
        if (cancelled) return
        if (!ack.ok || !ack.room || !ack.color) {
          setError(describeRoomError(ack.error, t))
          return
        }
        useRoomStore.getState().applyJoin(ack)
        setJoined(true)
      } catch {
        if (!cancelled) setError(describeRoomError(undefined, t))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params.code, playerName, t])

  if (joined) {
    return <Navigate to="/online/game" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur">
        <GameHeader title={t('invite.title')} />
        {error ? (
          <>
            <span aria-hidden className="text-4xl">
              🚪
            </span>
            <ErrorMessage message={error} />
            <Button variant="secondary" fullWidth onClick={() => navigate('/online')}>
              {t('invite.backToLobby')}
            </Button>
          </>
        ) : (
          <>
            <span aria-hidden className="animate-pulse text-4xl">
              🔗
            </span>
            <p className="text-sm text-slate-400">
              {t('invite.joining')}{' '}
              <span className="font-mono font-bold text-emerald-300">{params.code}</span>…
            </p>
          </>
        )}
      </div>
    </main>
  )
}
