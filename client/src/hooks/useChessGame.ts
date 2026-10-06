import { useCallback, useMemo, useState } from 'react'
import type { PieceType, SquareName } from '../types/chess'
import { useGameStore } from '../state/gameStore'
import { useSettingsStore } from '../state/settingsStore'

interface PendingPromotion {
  from: SquareName
  to: SquareName
}

/**
 * Tầng điều khiển ván cờ cho UI: quản lý ô đang chọn, các nước đi hợp lệ,
 * luồng phong cấp và các hành động của người chơi.
 * Không chứa UI, không chứa luật cờ — chỉ điều phối giữa ChessBoard và gameStore.
 */
export function useChessGame() {
  const state = useGameStore((s) => s.state)
  const makeMove = useGameStore((s) => s.makeMove)
  const getLegalTargets = useGameStore((s) => s.getLegalTargets)
  const isPromotionNeeded = useGameStore((s) => s.isPromotionNeeded)
  const getPieceAt = useGameStore((s) => s.getPieceAt)
  const resetGame = useGameStore((s) => s.resetGame)
  const moveMode = useSettingsStore((s) => s.moveMode)

  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)

  const legalTargets = useMemo(
    () => (selectedSquare ? getLegalTargets(selectedSquare) : []),
    [selectedSquare, getLegalTargets, state.fen],
  )

  const handleSquareClick = useCallback(
    (square: SquareName) => {
      if (state.result || pendingPromotion) return

      // Đang chọn quân và click vào ô đích hợp lệ → đi nước.
      // Ở chế độ 'drag' thì click không đi — chỉ kéo-thả mới đi.
      if (selectedSquare && legalTargets.includes(square)) {
        if (moveMode !== 'drag') {
          if (isPromotionNeeded(selectedSquare, square)) {
            setPendingPromotion({ from: selectedSquare, to: square })
          } else {
            makeMove(selectedSquare, square)
          }
        }
        setSelectedSquare(null)
        return
      }

      // Click vào quân của bên tới lượt → chọn lại quân
      const piece = getPieceAt(square)
      if (piece && piece.color === state.turn) {
        setSelectedSquare(square === selectedSquare ? null : square)
      } else {
        setSelectedSquare(null)
      }
    },
    [
      state.result,
      state.turn,
      pendingPromotion,
      selectedSquare,
      legalTargets,
      isPromotionNeeded,
      makeMove,
      getPieceAt,
      moveMode,
    ],
  )

  /** Kéo-thả: thả quân vào ô đích (đã được chọn sẵn khi dragstart) */
  const tryMoveTo = useCallback(
    (target: SquareName) => {
      if (state.result || pendingPromotion || !selectedSquare) return
      if (!legalTargets.includes(target)) {
        setSelectedSquare(null)
        return
      }
      if (isPromotionNeeded(selectedSquare, target)) {
        setPendingPromotion({ from: selectedSquare, to: target })
      } else {
        makeMove(selectedSquare, target)
      }
      setSelectedSquare(null)
    },
    [state.result, pendingPromotion, selectedSquare, legalTargets, isPromotionNeeded, makeMove],
  )

  /** Xác nhận quân phong cấp và hoàn tất nước đi */
  const completePromotion = useCallback(
    (promotion: PieceType) => {
      if (!pendingPromotion) return
      makeMove(pendingPromotion.from, pendingPromotion.to, promotion)
      setPendingPromotion(null)
      setSelectedSquare(null)
    },
    [pendingPromotion, makeMove],
  )

  /** Hủy luồng phong cấp */
  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null)
    setSelectedSquare(null)
  }, [])

  /** Bắt đầu ván mới và xóa selection */
  const handleResetGame = useCallback(() => {
    resetGame()
    setSelectedSquare(null)
    setPendingPromotion(null)
  }, [resetGame])

  return {
    state,
    selectedSquare,
    legalTargets,
    pendingPromotion,
    handleSquareClick,
    tryMoveTo,
    completePromotion,
    cancelPromotion,
    resetGame: handleResetGame,
  }
}
