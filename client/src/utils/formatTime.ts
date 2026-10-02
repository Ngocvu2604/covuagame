/**
 * Định dạng thời gian đồng hồ cờ.
 * ≥ 20s: "m:ss" (ví dụ "10:00"); < 20s: "s.t" (ví dụ "9.4") tạo cảm giác gấp gáp.
 */
export function formatChessClock(ms: number): string {
  const safeMs = Math.max(0, ms)
  if (safeMs < 20_000) {
    return (safeMs / 1000).toFixed(1)
  }
  const totalSeconds = Math.ceil(safeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
