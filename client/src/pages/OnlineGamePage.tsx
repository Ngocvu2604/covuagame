import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChessBoard } from '../components/chess/ChessBoard'
import { PromotionDialog } from '../components/chess/PromotionDialog'
import { PlayerPanel } from '../components/player/PlayerPanel'
import { MoveHistory } from '../components/moves/MoveHistory'
import { ChatBox } from '../components/chat/ChatBox'
import { GameHeader } from '../components/game/GameHeader'
import { GameResult } from '../components/game/GameResult'
import { ResignButton } from '../components/game/ResignButton'
import { DrawButton } from '../components/game/DrawButton'
import { RematchButton } from '../components/game/RematchButton'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { RoomCode } from '../components/room/RoomCode'
import { CopyInviteLinkButton } from '../components/room/CopyInviteLinkButton'
import { CopyRoomCodeButton } from '../components/room/CopyRoomCodeButton'
import { RoomStatus } from '../components/room/RoomStatus'
import { useOnlineGame } from '../hooks/useOnlineGame'
import { useGameSoundEvents } from '../hooks/useSound'
import { soundService } from '../services/soundService'
import { useRoomStore } from '../state/roomStore'
import { leaveRoom } from '../online/roomService'
import { opposite } from '../chess/chessUtils'
import { RECONNECT_GRACE_SECONDS } from '../constants/game'
import { SettingsDrawer } from '../components/settings/SettingsDrawer'
import { useT } from '../i18n/translations'

/** Trang chơi Online: chờ đối thủ (hiện mã phòng) → ván đấu realtime */
export function OnlineGamePage() {
  const navigate = useNavigate()
  const t = useT()
  const {
    room,
    yourColor,
    gameState,
    myInfo,
    opponentInfo,
    isMyTurn,
    selectedSquare,
    legalTargets,
    pendingPromotion,
    lastMoveError,
    drawOfferFrom,
    rematchOfferFrom,
    rematchDeclined,
    chatMessages,
    opponentDisconnected,
    restoring,
    handleSquareClick,
    tryMoveTo,
    completePromotion,
    cancelPromotion,
    actions,
    getClockMs,
  } = useOnlineGame()

  // Âm thanh theo diễn biến ván cờ (mục 15)
  useGameSoundEvents({ state: gameState, myColor: yourColor })

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  // Đếm ngượcGrace time khi đối thủ mất kết nối (khớp grace time của server)
  const [reconnectSeconds, setReconnectSeconds] = useState(RECONNECT_GRACE_SECONDS)
  useEffect(() => {
    if (!opponentDisconnected) {
      setReconnectSeconds(RECONNECT_GRACE_SECONDS)
      return
    }
    setReconnectSeconds(RECONNECT_GRACE_SECONDS)
    const timer = setInterval(() => {
      setReconnectSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [opponentDisconnected])

  // Vào trang trực tiếp mà không có phiên phòng (F5 mất store) → về sảnh.
  // Nếu đang khôi phục phiên từ localStorage thì chờ, không đá về sảnh.
  useEffect(() => {
    if (!room || !yourColor) {
      if (!restoring) navigate('/online', { replace: true })
    }
  }, [room, yourColor, restoring, navigate])

  if ((!room || !yourColor) && !restoring) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
        <p className="animate-pulse text-sm text-slate-400">Đang khôi phục phiên phòng…</p>
      </main>
    )
  }
  if (!room || !yourColor) return null

  const opponentColor = opposite(yourColor)
  const isPlaying = room.status === 'playing' && gameState !== null

  // Rời phòng: đang chơi thì hiện xác nhận — xác nhận mới tính rời trận (thua)
  const requestLeave = () => {
    if (room.status === 'playing') {
      setLeaveConfirmOpen(true)
      return
    }
    handleLeave()
  }
  const handleLeave = () => {
    leaveRoom()
    useRoomStore.getState().reset()
    navigate('/online')
  }

  // ---- Màn hình chờ đối thủ ----
  if (room.status === 'waiting') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
        <div className="flex w-full max-w-md flex-col items-center gap-5 card p-8 text-center shadow-2xl backdrop-blur">
          <h2 className="text-lg font-bold">{t('wait.title')}</h2>
          <p className="text-sm text-slate-400">{t('wait.share')}</p>
          <RoomCode code={room.code} />
          <CopyInviteLinkButton code={room.code} />
          <CopyRoomCodeButton code={room.code} />
          <RoomStatus text={t('wait.status')} />
          <Button variant="ghost" onClick={handleLeave}>
            {t('wait.leave')}
          </Button>
        </div>
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </main>
    )
  }

  // ---- Màn hình ván đấu ----
  const opponentStatus = !opponentInfo?.connected
    ? t('game.opponentDisconnected')
    : gameState?.turn === opponentColor && gameState?.result === null
      ? t('game.yourTurn')
      : t('game.waiting')
  const myStatus = isMyTurn ? t('game.yourTurn') : t('game.waiting')
  const lastMoveRecord = gameState?.moveHistory.at(-1) ?? null

  const winnerLabel =
    gameState?.result && gameState.result.winner !== null
      ? gameState.result.winner === yourColor
        ? myInfo?.name ?? 'Bạn'
        : opponentInfo?.name ?? 'Đối thủ'
      : null

  return (
    <main className="min-h-dvh px-4 py-4 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <GameHeader title={`Chơi Online · ${room.code}`} onOpenSettings={() => setSettingsOpen(true)} />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,720px)_20rem] lg:justify-center">
          <div className="mx-auto flex w-full max-w-[min(720px,max(288px,calc(100dvh_-_240px)))] flex-col gap-2">
            <PlayerPanel
              name={opponentInfo?.name ?? 'Đối thủ'}
              color={opponentColor}
              isActive={isPlaying && gameState?.turn === opponentColor && gameState?.result === null}
              statusLabel={opponentStatus}
              timeMs={getClockMs(opponentColor)}
            />

            {opponentDisconnected && (
              <div
                data-testid="reconnect-banner"
                className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-center text-sm text-gold"
              >
                {t('game.reconnectBanner', { seconds: reconnectSeconds })}
              </div>
            )}

            <ChessBoard
              pieces={gameState?.pieces ?? []}
              orientation={yourColor}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMove={gameState?.lastMove ?? null}
              lastMoveIsCapture={lastMoveRecord?.captured != null}
              checkSquare={gameState?.checkSquare ?? null}
              onPieceHover={() => soundService.playHover()}
              onDrop={tryMoveTo}
              dragColor={isMyTurn ? yourColor : null}
              disabled={!isMyTurn}
              onSquareClick={handleSquareClick}
            />

            <PlayerPanel
              name={myInfo?.name ?? 'Bạn'}
              color={yourColor}
              isActive={isPlaying && isMyTurn}
              statusLabel={myStatus}
              timeMs={getClockMs(yourColor)}
            />
          </div>

          <aside className="mx-auto flex w-full max-w-[720px] flex-col gap-3 lg:mx-0 lg:w-full">
            <MoveHistory moves={gameState?.moveHistory ?? []} />

            <section
              aria-label="Điều khiển ván đấu"
              className="flex flex-col gap-2 card p-3"
            >
              <DrawButton
                visible={room.status === 'playing' && gameState?.result === null}
                canOffer={!drawOfferFrom}
                offerSentByMe={drawOfferFrom === yourColor}
                incomingOffer={!!drawOfferFrom && drawOfferFrom !== yourColor}
                onOffer={() => void actions.drawOffer()}
              />
              <ResignButton
                disabled={!(room.status === 'playing' && gameState?.result === null)}
                onConfirm={() => void actions.resign()}
              />
              <RematchButton
                visible={room.status === 'finished'}
                offerSentByMe={rematchOfferFrom === yourColor}
                incomingOffer={!!rematchOfferFrom && rematchOfferFrom !== yourColor}
                declined={rematchDeclined}
                onOffer={() => void actions.rematchOffer()}
              />
              <Button variant="ghost" fullWidth onClick={requestLeave}>
                {t('game.leave')}
              </Button>
            </section>

            {lastMoveError && <ErrorMessage message={t('game.moveRejected', { error: lastMoveError })} />}

            <ChatBox
              messages={chatMessages}
              yourColor={yourColor}
              onSend={(text) => void actions.chat(text)}
            />
          </aside>
        </div>
      </div>

      {pendingPromotion && (
        <PromotionDialog color={yourColor} onSelect={completePromotion} onCancel={cancelPromotion} />
      )}

      {drawOfferFrom && drawOfferFrom !== yourColor && gameState?.result === null && (
        <Modal>
          <div className="text-center">
            <span aria-hidden className="text-4xl">
              🤝
            </span>
            <h2 className="mt-2 text-lg font-semibold">{t('draw.modalTitle')}</h2>
            <div className="mt-5 flex gap-2">
              <Button variant="primary" fullWidth onClick={() => void actions.drawAccept()}>
                {t('draw.accept')}
              </Button>
              <Button variant="secondary" fullWidth onClick={() => void actions.drawDecline()}>
                {t('draw.decline')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {rematchOfferFrom && rematchOfferFrom !== yourColor && gameState?.result && (
        <Modal>
          <div className="text-center">
            <span aria-hidden className="text-4xl">
              🔁
            </span>
            <h2 className="mt-2 text-lg font-semibold">{t('rematch.modalTitle')}</h2>
            <div className="mt-5">
              <Button variant="primary" fullWidth onClick={() => void actions.rematchAccept()}>
                {t('rematch.accept')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {gameState?.result && room.status === 'finished' && (
        <GameResult
          result={gameState.result}
          winnerLabel={winnerLabel}
          rematchLabel={rematchOfferFrom === yourColor ? t('rematch.resultWaiting') : t('rematch.resultLabel')}
          rematchDisabled={rematchOfferFrom !== null}
          onRematch={() => void actions.rematchOffer()}
          onHome={handleLeave}
        />
      )}

      {/* Xác nhận rời trận: xác nhận mới tính thua (lý do 'left'), hủy thì tiếp tục */}
      {leaveConfirmOpen && (
        <Modal onClose={() => setLeaveConfirmOpen(false)}>
          <div className="text-center">
            <span aria-hidden className="text-4xl">
              🚪
            </span>
            <h2 className="mt-2 text-lg font-semibold">{t('game.leaveConfirmTitle')}</h2>
            <p className="mt-2 text-sm text-slate-400">{t('game.leaveConfirmBody')}</p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  setLeaveConfirmOpen(false)
                  handleLeave()
                }}
              >
                {t('game.leaveConfirmGo')}
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setLeaveConfirmOpen(false)}>
                {t('game.leaveConfirmStay')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}
