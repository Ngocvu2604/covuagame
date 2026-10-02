import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PieceOnSquare, PieceType, PlayerColor, SquareName } from '../types/chess'
import { getLegalTargetsFromFen, isPromotionNeededFromFen } from '../chess/chessEngine'
import { toPieceSymbol } from '../chess/chessUtils'
import { useRoomStore } from '../state/roomStore'
import { pushToast } from '../state/uiStore'
import {
  sendChat,
  sendDrawAccept,
  sendDrawDecline,
  sendDrawOffer,
  sendMove,
  sendRematchAccept,
  sendRematchOffer,
  sendResign,
  subscribeGameEvents,
} from '../online/gameSync'
import { attachAutoRejoin } from '../online/reconnect'

/**
 * Điều khiển ván Online cho UI: lắng nghe sự kiện server → roomStore,
 * quản lý selection/phong cấp, gửi hành động lên server.
 * Server là nguồn sự thật — client chỉ chọn nước và hiển thị.
 */
export function useOnlineGame() {
  const room = useRoomStore((s) => s.room)
  const yourColor = useRoomStore((s) => s.yourColor)
  const gameState = useRoomStore((s) => s.gameState)
  const clock = useRoomStore((s) => s.clock)
  const drawOfferFrom = useRoomStore((s) => s.drawOfferFrom)
  const rematchOfferFrom = useRoomStore((s) => s.rematchOfferFrom)
  const chatMessages = useRoomStore((s) => s.chatMessages)

  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<{ from: SquareName; to: SquareName } | null>(null)
  const [lastMoveError, setLastMoveError] = useState<string | null>(null)

  // Đăng ký sự kiện realtime một lần khi mount
  useEffect(() => {
    return subscribeGameEvents({
      onRoomUpdated: (payload) => useRoomStore.getState().setRoom(payload.room),
      onGameStarted: (payload) => {
        const store = useRoomStore.getState()
        store.setRoom(payload.room)
        store.setGameState(payload.state)
        store.setClock(payload.clock, Date.now())
        store.setDrawOffer(null)
        store.setRematchOffer(null)
      },
      onMoveApplied: (payload) => {
        const store = useRoomStore.getState()
        store.setGameState(payload.state)
        store.setClock(payload.clock, Date.now())
      },
      onGameOver: (payload) => {
        const store = useRoomStore.getState()
        store.setGameState(payload.state)
        store.setClock(payload.clock, Date.now())
      },
      // Trạng thái kết nối đã nằm trong room:updated (cập nhật player.connected)
      onPlayerDisconnected: () => undefined,
      onPlayerReconnected: (payload) => pushToast(`${payload.name} đã kết nối lại`, 'success'),
      onDrawOffered: (payload) => useRoomStore.getState().setDrawOffer(payload.from),
      onDrawDeclined: () => useRoomStore.getState().setDrawOffer(null),
      onRematchOffered: (payload) => useRoomStore.getState().setRematchOffer(payload.from),
      onChatMessage: (payload) => useRoomStore.getState().appendChat(payload),
    })
  }, [])

  // Socket kết nối lại (mất mạng) → tự động lấy lại chỗ trong phòng
  useEffect(() => attachAutoRejoin(), [])

  // Nước mới đến (của mình hoặc đối thủ) → bỏ selection cũ
  const fen = gameState?.fen ?? null
  useEffect(() => {
    setSelectedSquare(null)
    setPendingPromotion(null)
  }, [fen])

  const isMyTurn =
    !!gameState && !!yourColor && room?.status === 'playing' && gameState.result === null && gameState.turn === yourColor

  const legalTargets = useMemo(
    () => (selectedSquare && fen ? getLegalTargetsFromFen(fen, selectedSquare) : []),
    [selectedSquare, fen],
  )

  const piecesBySquare = useMemo(() => {
    const map = new Map<SquareName, PieceOnSquare>()
    for (const piece of gameState?.pieces ?? []) map.set(piece.square, piece)
    return map
  }, [gameState?.pieces])

  const submitMove = useCallback(
    async (from: SquareName, to: SquareName, promotion?: PieceType) => {
      setLastMoveError(null)
      const ack = await sendMove({
        from,
        to,
        promotion: promotion ? toPieceSymbol(promotion) : undefined,
      })
      if (!ack.ok) {
        setLastMoveError(ack.error ?? 'Nước đi bị từ chối')
      }
    },
    [],
  )

  const handleSquareClick = useCallback(
    (square: SquareName) => {
      if (!isMyTurn || !gameState || pendingPromotion) return

      if (selectedSquare && legalTargets.includes(square)) {
        if (isPromotionNeededFromFen(gameState.fen, selectedSquare, square)) {
          setPendingPromotion({ from: selectedSquare, to: square })
        } else {
          void submitMove(selectedSquare, square)
        }
        setSelectedSquare(null)
        return
      }

      const piece = piecesBySquare.get(square)
      if (piece && piece.color === yourColor) {
        setSelectedSquare(square === selectedSquare ? null : square)
      } else {
        setSelectedSquare(null)
      }
    },
    [isMyTurn, gameState, pendingPromotion, selectedSquare, legalTargets, piecesBySquare, yourColor, submitMove],
  )

  const completePromotion = useCallback(
    (piece: PieceType) => {
      if (!pendingPromotion) return
      void submitMove(pendingPromotion.from, pendingPromotion.to, piece)
      setPendingPromotion(null)
    },
    [pendingPromotion, submitMove],
  )

  const cancelPromotion = useCallback(() => setPendingPromotion(null), [])

  const actions = useMemo(
    () => ({
      resign: async () => {
        await sendResign()
      },
      drawOffer: async () => {
        await sendDrawOffer()
      },
      drawAccept: async () => {
        await sendDrawAccept()
        useRoomStore.getState().setDrawOffer(null)
      },
      drawDecline: async () => {
        await sendDrawDecline()
        useRoomStore.getState().setDrawOffer(null)
      },
      rematchOffer: async () => {
        await sendRematchOffer()
      },
      rematchAccept: async () => {
        await sendRematchAccept()
        useRoomStore.getState().setRematchOffer(null)
      },
      chat: async (text: string) => {
        await sendChat(text)
      },
    }),
    [],
  )

  // Đồng hồ: server gửi ảnh chụp theo mỗi sự kiện, client nội suy giữa 2 lần nhận
  const [, setClockTick] = useState(0)
  const clockRunning = !!gameState && gameState.result === null && room?.status === 'playing'
  useEffect(() => {
    if (!clock || !clockRunning) return
    const timer = setInterval(() => setClockTick((tick) => tick + 1), 200)
    return () => clearInterval(timer)
  }, [clock, clockRunning])

  const getClockMs = useCallback(
    (color: PlayerColor): number | null => {
      if (!clock) return null
      const base = color === 'white' ? clock.whiteMs : clock.blackMs
      if (!clockRunning || !gameState || gameState.turn !== color) return base
      return Math.max(0, base - (Date.now() - clock.receivedAt))
    },
    [clock, clockRunning, gameState],
  )

  const myInfo = room?.players.find((p) => p.color === yourColor) ?? null
  const opponentInfo = room?.players.find((p) => p.color !== yourColor) ?? null
  const opponentDisconnected =
    !!opponentInfo && !opponentInfo.connected && room?.status === 'playing'

  return {
    room,
    yourColor,
    gameState,
    myInfo,
    opponentInfo,
    opponentDisconnected,
    isMyTurn,
    selectedSquare,
    legalTargets,
    pendingPromotion,
    lastMoveError,
    drawOfferFrom,
    rematchOfferFrom,
    chatMessages,
    handleSquareClick,
    completePromotion,
    cancelPromotion,
    actions,
    getClockMs,
  }
}
