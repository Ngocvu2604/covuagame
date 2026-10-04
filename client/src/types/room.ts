import type { PlayerColor } from './chess'

/** Thông tin phòng công khai — mirror của server/src/types/room.ts */

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface PlayerPublicInfo {
  name: string
  color: PlayerColor
  connected: boolean
}

export interface RoomPublicData {
  /** Appwrite: id document phòng (undefined trên socket provider) */
  id?: string
  code: string
  status: RoomStatus
  timeMinutes: number | null
  players: PlayerPublicInfo[]
}

/** Tin nhắn chat trong phòng */
export interface ChatMessage {
  from: PlayerColor
  fromName: string
  text: string
  sentAt: number
}
