import type { PlayerColor } from './game'
import type { PlayerPublicInfo, ServerPlayer } from './player'

export type { PlayerPublicInfo, ServerPlayer }

export type RoomStatus = 'waiting' | 'playing' | 'finished'

/** Tin nhắn chat trong phòng */
export interface ChatMessage {
  from: PlayerColor
  fromName: string
  text: string
  sentAt: number
}

export interface Room {
  id: string
  code: string
  /** Tối đa 2 người chơi */
  players: ServerPlayer[]
  status: RoomStatus
  /** null = không giới hạn thời gian */
  timeMinutes: number | null
  createdAt: number
  lastActivity: number
  /** Bên đang đề nghị hòa (nếu có) */
  drawOfferedBy: PlayerColor | null
  /** Bên đang mời chơi lại (nếu có) */
  rematchOfferedBy: PlayerColor | null
  /** Lịch sử chat của phòng (giữ tối đa 50 tin gần nhất) */
  messages: ChatMessage[]
}

/** Dữ liệu phòng công khai phát cho client */
export interface RoomPublicData {
  code: string
  status: RoomStatus
  timeMinutes: number | null
  players: PlayerPublicInfo[]
}

export type RoomErrorCode =
  | 'INVALID_NAME'
  | 'INVALID_CODE'
  | 'INVALID_TIME_CONTROL'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_FINISHED'
  | 'NOT_IN_ROOM'
  | 'GAME_NOT_ACTIVE'
  | 'NOT_YOUR_TURN'
  | 'INVALID_MOVE'
  | 'TIMEOUT'
  | 'NO_OFFER'
