import type { Socket } from 'socket.io-client'
import type {
  GameOverPayload,
  GameStartedPayload,
  MoveAckData,
  MoveAppliedPayload,
  MovePayload,
  OfferedPayload,
  PlayerConnectionPayload,
  RoomUpdatedPayload,
  SimpleAckData,
} from '../types/socket'
import type { ChatMessage } from '../types/room'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { emitAck, getSocket } from './socketClient'

/**
 * Đồng bộ ván đấu: đăng ký lắng nghe sự kiện server → đẩy vào roomStore,
 * và gửi các hành động của người chơi lên server.
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

const EVENT_HANDLERS = {
  [SOCKET_EVENTS.ROOM_UPDATED]: 'onRoomUpdated',
  [SOCKET_EVENTS.GAME_STARTED]: 'onGameStarted',
  [SOCKET_EVENTS.GAME_MOVE_APPLIED]: 'onMoveApplied',
  [SOCKET_EVENTS.GAME_OVER]: 'onGameOver',
  [SOCKET_EVENTS.PLAYER_DISCONNECTED]: 'onPlayerDisconnected',
  [SOCKET_EVENTS.PLAYER_RECONNECTED]: 'onPlayerReconnected',
  [SOCKET_EVENTS.GAME_DRAW_OFFERED]: 'onDrawOffered',
  [SOCKET_EVENTS.GAME_DRAW_DECLINED]: 'onDrawDeclined',
  [SOCKET_EVENTS.GAME_REMATCH_OFFERED]: 'onRematchOffered',
  [SOCKET_EVENTS.CHAT_MESSAGE]: 'onChatMessage',
} as const

/** Đăng ký mọi sự kiện realtime; trả về hàm hủy đăng ký */
export function subscribeGameEvents(handlers: GameSyncHandlers): () => void {
  const socket: Socket = getSocket()

  const listeners = Object.entries(EVENT_HANDLERS).map(([event, handlerName]) => {
    const handler = handlers[handlerName] as (payload: unknown) => void
    const listener = (...args: unknown[]) => {
      handler(args[0])
    }
    socket.on(event, listener)
    return { event, listener }
  })

  return () => {
    for (const { event, listener } of listeners) {
      socket.off(event, listener)
    }
  }
}

export function sendMove(payload: MovePayload): Promise<MoveAckData> {
  return emitAck<MoveAckData>(SOCKET_EVENTS.GAME_MOVE, payload)
}

export function sendResign(): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_RESIGN)
}

export function sendDrawOffer(): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_DRAW_OFFER)
}

export function sendDrawAccept(): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_DRAW_ACCEPT)
}

export function sendDrawDecline(): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_DRAW_DECLINE)
}

export function sendRematchOffer(): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_REMATCH_OFFER)
}

export function sendRematchAccept(): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_REMATCH_ACCEPT)
}

export function sendChat(text: string): Promise<SimpleAckData> {
  return emitAck<SimpleAckData>(SOCKET_EVENTS.CHAT_SEND, { text })
}
