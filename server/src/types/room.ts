import type { PlayerColor } from './game'
import type { PlayerPublicInfo } from './player'

export type RoomStatus = 'waiting' | 'playing' | 'finished'

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
