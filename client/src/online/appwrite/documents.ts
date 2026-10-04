import type { RoomPublicData, RoomStatus } from '../../types/room'
import type { PlayerColor } from '../../types/chess'

/**
 * Hình dạng document của các collection Appwrite + mapper sang domain types.
 *
 * rooms:    1 document = 1 phòng (trạng thái, 2 ghế chơi, đồng hồ, kết quả)
 * moves:    1 document = 1 nước đi (append-only, nguồn sự thật của bàn cờ)
 * messages: 1 document = 1 tin nhắn chat
 */

export type AppwriteRoomStatus = RoomStatus | 'abandoned'

export interface RoomDocument {
  $id: string
  code: string
  /** 'waiting' | 'playing' | 'finished' | 'abandoned' */
  status: string
  timeMinutes: number
  whitePlayerId: string
  whitePlayerName: string
  blackPlayerId: string
  blackPlayerName: string
  /** Mức ms còn lại của từng bên (0 = chơi không giới hạn thời gian) */
  whiteMs: number
  blackMs: number
  /** Epoch ms khi lượt hiện tại bắt đầu tính giờ; 0 = chưa chạy */
  turnStartedAt: number
  /** Bên tới lượt ('white' | 'black') */
  turn: string
  gameNumber: number
  winner: string
  resultReason: string
  drawOfferedBy: string
  rematchOfferedBy: string
  whiteLastSeenAt: number
  blackLastSeenAt: number
  $createdAt: string
  $updatedAt: string
}

export interface MoveDocument {
  $id: string
  roomId: string
  gameNumber: number
  ply: number
  userId: string
  color: string
  from: string
  to: string
  promotion: string
}

export interface MessageDocument {
  $id: string
  roomId: string
  userId: string
  name: string
  text: string
  sentAt: number
}

const STALE_THRESHOLD_MS = 25_000

/** Đánh dấu một ghế còn "online" không: lastSeen trong 25 giây trở lại */
function seatConnected(lastSeenAt: number, filled: boolean, status: string): boolean {
  if (!filled) return false
  if (status !== 'playing') return true
  return Date.now() - lastSeenAt < STALE_THRESHOLD_MS
}

export function toRoomPublicData(doc: RoomDocument): RoomPublicData {
  const status: RoomStatus = doc.status === 'abandoned' ? 'finished' : (doc.status as RoomStatus)
  const hasWhite = doc.whitePlayerId.length > 0
  const hasBlack = doc.blackPlayerId.length > 0

  return {
    id: doc.$id,
    code: doc.code,
    status,
    timeMinutes: doc.timeMinutes > 0 ? doc.timeMinutes : null,
    players: [
      {
        name: doc.whitePlayerName || 'Đang chờ…',
        color: 'white' as PlayerColor,
        connected: seatConnected(doc.whiteLastSeenAt, hasWhite, doc.status),
      },
      {
        name: doc.blackPlayerName || 'Đang chờ…',
        color: 'black' as PlayerColor,
        connected: seatConnected(doc.blackLastSeenAt, hasBlack, doc.status),
      },
    ],
  }
}

/** Đồng hồ còn lại thực tế (trừ thời gian đang trôi của lượt hiện tại) */
export function clockFromDoc(doc: RoomDocument): { whiteMs: number; blackMs: number } | null {
  if (doc.timeMinutes <= 0) return null
  if (doc.status !== 'playing' || doc.turnStartedAt <= 0) {
    return { whiteMs: doc.whiteMs, blackMs: doc.blackMs }
  }
  const elapsed = Date.now() - doc.turnStartedAt
  const key = doc.turn === 'white' ? 'whiteMs' : 'blackMs'
  const remaining = Math.max(0, doc[key] - elapsed)
  return { whiteMs: doc.whiteMs, blackMs: doc.blackMs, [key]: remaining }
}
