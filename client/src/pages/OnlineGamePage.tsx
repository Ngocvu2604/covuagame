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
import { CopyRoomCodeButton } from '../components/room/CopyRoomCodeButton'
import { RoomStatus } from '../components/room/RoomStatus'
import { useOnlineGame } from '../hooks/useOnlineGame'
import { useGameSoundEvents } from '../hooks/useSound'
import { useRoomStore } from '../state/roomStore'
import { useSettingsStore } from '../state/settingsStore'
import { leaveRoom } from '../online/roomService'
import { opposite } from '../chess/chessUtils'
import { BOARD_THEMES } from '../constants/chess'
import { RECONNECT_GRACE_SECONDS } from '../constants/game'

/** Trang chơi Online: chờ đối thủ (hiện mã phòng) → ván đấu realtime */
export function OnlineGamePage() {
  const navigate = useNavigate()
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
    chatMessages,
    opponentDisconnected,
    handleSquareClick,
    completePromotion,
    cancelPromotion,
    actions,
    getClockMs,
  } = useOnlineGame()
  const boardThemeId = useSettingsStore((s) => s.boardTheme)
  const boardTheme = BOARD_THEMES[boardThemeId]

  // Âm thanh theo diễn biến ván cờ (mục 15)
  useGameSoundEvents({ state: gameState, myColor: yourColor })

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

  // Vào trang trực tiếp mà không có phiên phòng (F5 mất store) → về sảnh
  useEffect(() => {
    if (!room || !yourColor) {
      navigate('/online', { replace: true })
    }
  }, [room, yourColor, navigate])

  if (!room || !yourColor) return null

  const opponentColor = opposite(yourColor)
  const isPlaying = room.status === 'playing' && gameState !== null

  const handleLeave = () => {
    leaveRoom()
    useRoomStore.getState().reset()
    navigate('/online')
  }

  // ---- Màn hình chờ đối thủ ----
  if (room.status === 'waiting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-xl">
          <h2 className="text-xl font-bold">Phòng đã được tạo!</h2>
          <p className="text-sm text-slate-400">Chia sẻ mã này cho đối thủ của bạn:</p>
          <RoomCode code={room.code} />
          <CopyRoomCodeButton code={room.code} />
          <RoomStatus text="Đang chờ đối thủ tham gia…" />
          <Button variant="ghost" onClick={handleLeave}>
            ← Rời phòng
          </Button>
        </div>
      </main>
    )
  }

  // ---- Màn hình ván đấu ----
  const opponentStatus = !opponentInfo?.connected
    ? '⌛ Mất kết nối — chờ quay lại…'
    : gameState?.turn === opponentColor && gameState?.result === null
      ? 'Đến lượt'
      : 'Đang chờ'
  const myStatus = isMyTurn ? 'Đến lượt' : 'Đang chờ'

  const winnerLabel =
    gameState?.result && gameState.result.winner !== null
      ? gameState.result.winner === yourColor
        ? myInfo?.name ?? 'Bạn'
        : opponentInfo?.name ?? 'Đối thủ'
      : null

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <GameHeader title={`Chơi Online · ${room.code}`} />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,560px)_20rem] lg:justify-center">
          <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2">
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
                ⌛ Đối thủ mất kết nối — tự động xử thua sau {reconnectSeconds}s…
              </div>
            )}

            <ChessBoard
              pieces={gameState?.pieces ?? []}
              orientation={yourColor}
              squareColors={{ light: boardTheme.light, dark: boardTheme.dark }}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMove={gameState?.lastMove ?? null}
              checkSquare={gameState?.checkSquare ?? null}
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

          <aside className="mx-auto flex w-full max-w-[560px] flex-col gap-3 lg:mx-0 lg:w-full">
            <MoveHistory moves={gameState?.moveHistory ?? []} />

            <section
              aria-label="Điều khiển ván đấu"
              className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/60 p-3"
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
                onOffer={() => void actions.rematchOffer()}
              />
              <Button variant="ghost" fullWidth onClick={handleLeave}>
                🚪 Rời phòng
              </Button>
            </section>

            {lastMoveError && <ErrorMessage message={`Nước đi bị từ chối (${lastMoveError})`} />}

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
            <h2 className="mt-2 text-lg font-semibold">Đối thủ đề nghị hòa</h2>
            <div className="mt-5 flex gap-2">
              <Button variant="primary" fullWidth onClick={() => void actions.drawAccept()}>
                Chấp nhận
              </Button>
              <Button variant="secondary" fullWidth onClick={() => void actions.drawDecline()}>
                Từ chối
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
            <h2 className="mt-2 text-lg font-semibold">Đối thủ muốn chơi lại</h2>
            <div className="mt-5">
              <Button variant="primary" fullWidth onClick={() => void actions.rematchAccept()}>
                Chấp nhận chơi lại
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {gameState?.result && room.status === 'finished' && (
        <GameResult
          result={gameState.result}
          winnerLabel={winnerLabel}
          rematchLabel={rematchOfferFrom === yourColor ? 'Đã mời chơi lại — chờ phản hồi…' : 'Mời chơi lại'}
          rematchDisabled={rematchOfferFrom !== null}
          onRematch={() => void actions.rematchOffer()}
          onHome={handleLeave}
        />
      )}
    </main>
  )
}
