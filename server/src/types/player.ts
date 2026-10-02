import type { PlayerColor } from './game'

/** Người chơi phía server — socketId là định danh kết nối hiện tại */
export interface ServerPlayer {
  socketId: string
  name: string
  color: PlayerColor
  connected: boolean
}

/** Thông tin người chơi gửi cho client (không lộ socketId) */
export interface PlayerPublicInfo {
  name: string
  color: PlayerColor
  connected: boolean
}
