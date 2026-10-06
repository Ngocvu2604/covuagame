import type { GameState, GameResult, MoveRecord, PlayerColor } from './game'
import type { ChatMessage, RoomPublicData } from './room'

/** Tên các sự kiện Socket.IO dùng chung server/client */
export const SOCKET_EVENTS = {
  // Phòng
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATED: 'room:updated',
  // Kết nối người chơi
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',
  // Ván đấu
  GAME_STARTED: 'game:started',
  GAME_MOVE: 'game:move',
  GAME_MOVE_APPLIED: 'game:move:applied',
  GAME_OVER: 'game:over',
  GAME_RESIGN: 'game:resign',
  GAME_DRAW_OFFER: 'game:draw:offer',
  GAME_DRAW_ACCEPT: 'game:draw:accept',
  GAME_DRAW_DECLINE: 'game:draw:decline',
  GAME_DRAW_OFFERED: 'game:draw:offered',
  GAME_DRAW_DECLINED: 'game:draw:declined',
  GAME_REMATCH_OFFER: 'game:rematch:offer',
  GAME_REMATCH_ACCEPT: 'game:rematch:accept',
  GAME_REMATCH_OFFERED: 'game:rematch:offered',
  GAME_REMATCH_DECLINE: 'game:rematch:decline',
  GAME_REMATCH_DECLINED: 'game:rematch:declined',
  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
} as const

export interface CreateRoomPayload {
  playerName: string
  colorChoice: 'white' | 'black' | 'random'
  timeMinutes: number | null
}

export interface JoinRoomPayload {
  playerName: string
  code: string
}

export interface MovePayload {
  from: string
  to: string
  promotion?: string
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
  /** Trạng thái hiện tại (có khi tham gia phòng đang chơi / kết nối lại) */
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
  result: GameResult
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

/** Thời gian còn lại của 2 bên (server là nguồn sự thật, client nội suy hiển thị) */
export interface ClockInfo {
  whiteMs: number
  blackMs: number
}

/** Gọi ack callback nếu client có gửi (socket.io cho phép emit không ack) */
export function replyAck(ack: unknown, data: unknown): void {
  if (typeof ack === 'function') {
    (ack as (data: unknown) => void)(data)
  }
}
