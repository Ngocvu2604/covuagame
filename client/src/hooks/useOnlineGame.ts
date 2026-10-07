import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PieceOnSquare, PieceType, PlayerColor, SquareName } from '../types/chess'
import { getLegalTargetsFromFen, isPromotionNeededFromFen } from '../chess/chessEngine'
import { toPieceSymbol } from '../chess/chessUtils'
import { useRoomStore, getActiveRoomCode, clearActiveRoom } from '../state/roomStore'
import { pushToast } from '../state/uiStore'
import { usePlayerStore } from '../state/playerStore'
import { useSettingsStore } from '../state/settingsStore'
import { getT } from '../i18n/translations'
import { Chess } from 'chess.js'
import { deriveGameState, historyRecordsOf } from '../online/appwrite/stateReplay'
import {
  sendChat,
  sendDrawAccept,
  sendDrawDecline,
  sendDrawOffer,
  sendMove,
  sendRematchAccept,
  sendRematchDecline,
  sendRematchOffer,
  sendResign,
  subscribeGameEvents,
} from '../online/gameSync'
import { attachAutoRejoin } from '../online/reconnect'
import { joinRoom, prepareConnection } from '../online/roomService'

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
  const [rematchDeclined, setRematchDeclined] = useState(false)
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
      onPlayerReconnected: (payload) =>
        pushToast(getT()('game.reconnectedToast', { name: payload.name }), 'success'),
      onDrawOffered: (payload) => useRoomStore.getState().setDrawOffer(payload.from),
      onDrawDeclined: () => useRoomStore.getState().setDrawOffer(null),
      onRematchOffered: (payload) => useRoomStore.getState().setRematchOffer(payload.from),
      onRematchDeclined: (payload) => {
        const store = useRoomStore.getState()
        // Chỉ người GỬI lời mời thấy "Bị từ chối" (người từ chối tự biết vì họ bấm)
        if (store.rematchOfferFrom && payload.from !== store.yourColor) {
          store.setRematchOffer(null)
          setRematchDeclined(true)
          window.setTimeout(() => setRematchDeclined(false), 6000)
        }
      },
      onChatMessage: (payload) => useRoomStore.getState().appendChat(payload),
    })
  }, [])

  // Socket kết nối lại (mất mạng) → tự động lấy lại chỗ trong phòng
  useEffect(() => attachAutoRejoin(), [])

  // Refresh trang: khôi phục phiên từ code phòng đã lưu trong localStorage (mục 12)
  const [restoring, setRestoring] = useState<boolean>(() => !useRoomStore.getState().room && !!getActiveRoomCode())
  useEffect(() => {
    if (!restoring) return
    const code = getActiveRoomCode()
    if (!code) {
      setRestoring(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        await prepareConnection(usePlayerStore.getState().name || 'Người chơi')
        const ack = await joinRoom(usePlayerStore.getState().name || 'Người chơi', code)
        if (!cancelled && ack.ok && ack.room && ack.color) {
          useRoomStore.getState().applyJoin(ack)
        } else if (!cancelled) {
          clearActiveRoom()
        }
      } catch {
        clearActiveRoom()
      }
      if (!cancelled) setRestoring(false)
    })()
    return () => {
      cancelled = true
    }
  }, [restoring])

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

  // Chế độ 'drag': click không đi — chỉ kéo-thả mới gửi nước
  const moveMode = useSettingsStore((s) => s.moveMode)

  const submitMove = useCallback((from: SquareName, to: SquareName, promotion?: PieceType) => {
    setLastMoveError(null)
    const store = useRoomStore.getState()
    const current = store.gameState
    if (!current || current.result) return

    // Optimistic: áp nước đi cục bộ NGAY để UI phản hồi tức thì; realtime/ack
    // sẽ chốt lại state chính thức (giống hệt) — nếu bị từ chối thì hoàn tác.
    const probe = new Chess(current.fen)
    const applied = probe.move({ from, to, promotion: promotion ? promotion.toLowerCase() : undefined })
    if (!applied) return
    const prev = current
    const optimisticState = deriveGameState(probe, historyRecordsOf(probe))
    store.setGameState(optimisticState)

    void (async () => {
      const ack = await sendMove({
        from,
        to,
        promotion: promotion ? toPieceSymbol(promotion) : undefined,
      })
      if (!ack.ok) {
        const live = useRoomStore.getState()
        // hoàn tác chỉ khi chưa có state chính thức mới đến (realtime echo)
        if (live.gameState === optimisticState) {
          live.setGameState(prev)
        }
        setLastMoveError(ack.error ?? 'Nước đi bị từ chối')
      } else if (ack.state) {
        // ack chính thức — chốt state (đồng bộ với optimistic đã áp)
        useRoomStore.getState().setGameState(ack.state)
        if (ack.clock) useRoomStore.getState().setClock(ack.clock, Date.now())
      }
    })()
  }, [])

  /** Kéo-thả: thả quân vào ô đích (bàn đã được chọn khi dragstart) */
  const tryMoveTo = useCallback(
    (target: SquareName) => {
      if (!isMyTurn || !gameState || pendingPromotion) return
      if (!selectedSquare) return
      if (!legalTargets.includes(target)) {
        setSelectedSquare(null)
        return
      }
      if (isPromotionNeededFromFen(gameState.fen, selectedSquare, target)) {
        setPendingPromotion({ from: selectedSquare, to: target })
      } else {
        void submitMove(selectedSquare, target)
      }
      setSelectedSquare(null)
    },
    [isMyTurn, gameState, pendingPromotion, selectedSquare, legalTargets, submitMove],
  )

  const handleSquareClick = useCallback(
    (square: SquareName) => {
      if (!isMyTurn || !gameState || pendingPromotion) return

      if (selectedSquare && legalTargets.includes(square)) {
        // Chế độ 'drag': click không đi — chỉ kéo-thả mới gửi nước
        if (moveMode !== 'drag') {
          if (isPromotionNeededFromFen(gameState.fen, selectedSquare, square)) {
            setPendingPromotion({ from: selectedSquare, to: square })
          } else {
            void submitMove(selectedSquare, square)
          }
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
    [isMyTurn, gameState, pendingPromotion, selectedSquare, legalTargets, piecesBySquare, yourColor, moveMode, submitMove],
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
      rematchDecline: async () => {
        await sendRematchDecline()
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
    restoring,
    isMyTurn,
    selectedSquare,
    legalTargets,
    pendingPromotion,
    lastMoveError,
    drawOfferFrom,
    rematchOfferFrom,
    rematchDeclined,
    chatMessages,
    handleSquareClick,
    tryMoveTo,
    completePromotion,
    cancelPromotion,
    actions,
    getClockMs,
  }
}
