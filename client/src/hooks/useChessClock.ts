import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerColor } from '../types/chess'

interface UseChessClockParams {
  /** Thời gian ban đầu mỗi bên; null = không dùng đồng hồ */
  initialMs: number | null
  /** Bên đang được chạy đồng hồ; null = đồng hồ dừng */
  activeSide: PlayerColor | null
  running: boolean
  /** Gọi một lần khi một bên hết giờ (bên đó thua) */
  onFlag: (side: PlayerColor) => void
}

const TICK_INTERVAL_MS = 100

/**
 * Đồng hồ cờ cho 2 bên: giảm thời gian của bên tới lượt, tính delta
 * theo Date.now() để không trôi khi tab bị throttle.
 * Được thiết kế dùng chung cho offline (Phase 4) và online (Phase 6).
 */
export function useChessClock({ initialMs, activeSide, running, onFlag }: UseChessClockParams) {
  const [times, setTimes] = useState({ whiteMs: initialMs ?? 0, blackMs: initialMs ?? 0 })
  const lastTickRef = useRef<number | null>(null)
  const flaggedRef = useRef(false)
  const onFlagRef = useRef(onFlag)
  onFlagRef.current = onFlag

  const resetClock = useCallback(() => {
    flaggedRef.current = false
    setTimes({ whiteMs: initialMs ?? 0, blackMs: initialMs ?? 0 })
  }, [initialMs])

  useEffect(() => {
    if (initialMs === null || !running || !activeSide) {
      lastTickRef.current = null
      return
    }

    lastTickRef.current = Date.now()
    const interval = window.setInterval(() => {
      const now = Date.now()
      const delta = now - (lastTickRef.current ?? now)
      lastTickRef.current = now
      const key = activeSide === 'white' ? ('whiteMs' as const) : ('blackMs' as const)
      setTimes((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - delta) }))
    }, TICK_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [initialMs, activeSide, running])

  // Báo hết giờ đúng một lần cho mỗi ván
  useEffect(() => {
    if (initialMs === null || flaggedRef.current) return
    if (times.whiteMs === 0) {
      flaggedRef.current = true
      onFlagRef.current('white')
    } else if (times.blackMs === 0) {
      flaggedRef.current = true
      onFlagRef.current('black')
    }
  }, [times, initialMs])

  return { whiteMs: times.whiteMs, blackMs: times.blackMs, resetClock }
}
