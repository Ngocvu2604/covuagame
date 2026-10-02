import { useEffect, useRef, useState } from 'react'
import type { PlayerColor } from '../types/chess'
import type { DifficultyId } from '../constants/difficulty'
import { useGameStore } from '../state/gameStore'
import { findBestMove } from '../ai/chessAI'

interface UseChessAIParams {
  /** Màu quân AI cầm; null = tắt AI (chơi qua lượt) */
  aiColor: PlayerColor | null
  difficulty: DifficultyId
}

/**
 * Điều khiển AI trong chế độ offline: quan sát gameStore, khi tới lượt AI
 * thì tính nước đi rồi thực hiện qua store. Chống race: nếu trạng thái
 * thay đổi (reset, đổi cấu hình) trong lúc AI đang tính thì bỏ kết quả cũ.
 */
export function useChessAI({ aiColor, difficulty }: UseChessAIParams) {
  const turn = useGameStore((s) => s.state.turn)
  const fen = useGameStore((s) => s.state.fen)
  const result = useGameStore((s) => s.state.result)
  const makeMove = useGameStore((s) => s.makeMove)

  const [isThinking, setIsThinking] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!aiColor || result || turn !== aiColor) {
      setIsThinking(false)
      return
    }

    let cancelled = false
    setIsThinking(true)
    const startedAt = Date.now()

    findBestMove(fen, difficulty).then((move) => {
      if (cancelled) return
      if (!move) {
        setIsThinking(false)
        return
      }

      // Trạng thái đã đổi trong lúc tính → bỏ kết quả
      const current = useGameStore.getState().state
      if (current.fen !== fen || current.turn !== aiColor) {
        setIsThinking(false)
        return
      }

      // Độ trễ tối thiểu để AI phản hồi tự nhiên hơn
      const elapsed = Date.now() - startedAt
      const minThinkMs = 400 + Math.random() * 400
      const wait = Math.max(0, minThinkMs - elapsed)

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        if (cancelled) return
        const latest = useGameStore.getState().state
        if (latest.fen === fen) {
          makeMove(move.from, move.to, move.promotion)
        }
        setIsThinking(false)
      }, wait)
    })

    return () => {
      cancelled = true
      setIsThinking(false)
    }
  }, [fen, turn, result, aiColor, difficulty, makeMove])

  // Dọn dẹp timeout khi component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { isThinking }
}
