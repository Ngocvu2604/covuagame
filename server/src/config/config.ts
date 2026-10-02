/** Cấu hình server — đọc từ environment variables, có giá trị mặc định cho dev */

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export interface Config {
  port: number
  corsOrigins: string[]
  /** Thời gian chờ người chơi kết nối lại trước khi xử thua (mục 18) */
  disconnectGraceMs: number
  /** Chu kỳ kiểm tra hết giờ */
  flagCheckIntervalMs: number
  /** Phòng chờ/biến động quá lâu không có hoạt động sẽ bị dọn */
  staleRoomMs: number
  /** Phòng đã kết thúc bị dọn sau khoảng này */
  finishedRoomTtlMs: number
  cleanupIntervalMs: number
}

export const config: Config = {
  port: num(process.env.PORT, 3001),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  disconnectGraceMs: num(process.env.DISCONNECT_GRACE_MS, 30_000),
  flagCheckIntervalMs: num(process.env.FLAG_CHECK_INTERVAL_MS, 500),
  staleRoomMs: num(process.env.STALE_ROOM_MS, 6 * 60 * 60_000),
  finishedRoomTtlMs: num(process.env.FINISHED_ROOM_TTL_MS, 30 * 60_000),
  cleanupIntervalMs: num(process.env.CLEANUP_INTERVAL_MS, 5 * 60_000),
}
