import type { GameState, MoveRecord, PlayerColor } from './chess'
import type { ChatMessage, RoomPublicData } from './room'

/** Payload/ack của Socket.IO — mirror của server/src/types/socket.ts */

export interface ClockInfo {
  whiteMs: number
  blackMs: number
}

export interface CreateAckData {
  ok: boolean
  room?: RoomPublicData
  color?: PlayerColor
  error?: string
}

export interface JoinAckData {
  ok: boolean
  room?: RoomPublicData
  color?: PlayerColor
  state?: GameState | null
  clock?: ClockInfo | null
  /** Lịch sử chat (khi kết nối lại vào phòng đang chơi) */
  chat?: ChatMessage[]
  error?: string
}

export interface MoveAckData {
  ok: boolean
  move?: MoveRecord
  state?: GameState
  clock?: ClockInfo | null
  error?: string
}

export interface SimpleAckData {
  ok: boolean
  error?: string
}

export interface RoomUpdatedPayload {
  room: RoomPublicData
}

export interface GameStartedPayload {
  room: RoomPublicData
  state: GameState
  clock?: ClockInfo | null
}

export interface MoveAppliedPayload {
  move: MoveRecord
  state: GameState
  clock?: ClockInfo | null
}

export interface GameOverPayload {
  result: GameState['result']
  state: GameState
  clock?: ClockInfo | null
}

export interface PlayerConnectionPayload {
  name: string
  color: PlayerColor
}

export interface OfferedPayload {
  from: PlayerColor
}

export interface MovePayload {
  from: string
  to: string
  promotion?: string
}

/**
 * Hợp đồng của provider online (Socket.IO hoặc Appwrite).
 * Cả hai provider emit/cùng kiểu payload nên pages và hooks
 * không cần biết phía sau là gì.
 */
export interface GameSyncHandlers {
  onRoomUpdated: (payload: RoomUpdatedPayload) => void
  onGameStarted: (payload: GameStartedPayload) => void
  onMoveApplied: (payload: MoveAppliedPayload) => void
  onGameOver: (payload: GameOverPayload) => void
  onPlayerDisconnected: (payload: PlayerConnectionPayload) => void
  onPlayerReconnected: (payload: PlayerConnectionPayload) => void
  onDrawOffered: (payload: OfferedPayload) => void
  onDrawDeclined: (payload: OfferedPayload) => void
  onRematchOffered: (payload: OfferedPayload) => void
  onChatMessage: (payload: ChatMessage) => void
}

export interface GameSyncProvider {
  subscribe: (handlers: GameSyncHandlers) => () => void
  sendMove: (payload: MovePayload) => Promise<MoveAckData>
  sendResign: () => Promise<SimpleAckData>
  sendDrawOffer: () => Promise<SimpleAckData>
  sendDrawAccept: () => Promise<SimpleAckData>
  sendDrawDecline: () => Promise<SimpleAckData>
  sendRematchOffer: () => Promise<SimpleAckData>
  sendRematchAccept: () => Promise<SimpleAckData>
  sendChat: (text: string) => Promise<SimpleAckData>
}
