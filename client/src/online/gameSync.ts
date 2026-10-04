import type {
  GameSyncHandlers,
  GameSyncProvider,
  MoveAckData,
  MovePayload,
  SimpleAckData,
} from '../types/socket'
import { emitAck, getSocket } from './socketClient'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { isAppwriteConfigured } from './appwrite/client'
import { createAppwriteProvider } from './appwrite/gameSync'

/**
 * Dispatcher của tầng online: chọn provider theo cấu hình.
 * - Có VITE_APPWRITE_*  → Appwrite (Database + Realtime, chạy 24/7 trên cloud)
 * - Không có            → Socket.IO server tự host (local dev / VPS)
 *
 * Pages và hooks chỉ gọi các hàm dưới đây — không biết phía sau là gì.
 */

export type { GameSyncHandlers } from '../types/socket'

function createSocketProvider(): GameSyncProvider {
  return {
    subscribe(handlers: GameSyncHandlers): () => void {
      const socket = getSocket()

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
    },

    sendMove: (payload: MovePayload) => emitAck<MoveAckData>(SOCKET_EVENTS.GAME_MOVE, payload),
    sendResign: () => emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_RESIGN),
    sendDrawOffer: () => emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_DRAW_OFFER),
    sendDrawAccept: () => emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_DRAW_ACCEPT),
    sendDrawDecline: () => emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_DRAW_DECLINE),
    sendRematchOffer: () => emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_REMATCH_OFFER),
    sendRematchAccept: () => emitAck<SimpleAckData>(SOCKET_EVENTS.GAME_REMATCH_ACCEPT),
    sendChat: (text: string) => emitAck<SimpleAckData>(SOCKET_EVENTS.CHAT_SEND, { text }),
  }
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

let provider: GameSyncProvider | null = null

export function getGameSyncProvider(): GameSyncProvider {
  if (!provider) {
    provider = isAppwriteConfigured() ? createAppwriteProvider() : createSocketProvider()
  }
  return provider
}

export function subscribeGameEvents(handlers: GameSyncHandlers): () => void {
  return getGameSyncProvider().subscribe(handlers)
}

export function sendMove(payload: MovePayload): Promise<MoveAckData> {
  return getGameSyncProvider().sendMove(payload)
}

export function sendResign(): Promise<SimpleAckData> {
  return getGameSyncProvider().sendResign()
}

export function sendDrawOffer(): Promise<SimpleAckData> {
  return getGameSyncProvider().sendDrawOffer()
}

export function sendDrawAccept(): Promise<SimpleAckData> {
  return getGameSyncProvider().sendDrawAccept()
}

export function sendDrawDecline(): Promise<SimpleAckData> {
  return getGameSyncProvider().sendDrawDecline()
}

export function sendRematchOffer(): Promise<SimpleAckData> {
  return getGameSyncProvider().sendRematchOffer()
}

export function sendRematchAccept(): Promise<SimpleAckData> {
  return getGameSyncProvider().sendRematchAccept()
}

export function sendChat(text: string): Promise<SimpleAckData> {
  return getGameSyncProvider().sendChat(text)
}
