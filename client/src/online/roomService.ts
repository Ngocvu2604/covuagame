import type { CreateAckData, JoinAckData } from '../types/socket'
import { connectSocket, emitAck, getSocket } from './socketClient'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { ensureAnonymousSession, isAppwriteConfigured } from './appwrite/client'
import { createAppwriteRoom, joinAppwriteRoom, leaveAppwriteRoom } from './appwrite/roomService'
import { useRoomStore } from '../state/roomStore'
import type { TranslationKey } from '../i18n/translations'

/**
 * Quản lý phòng — dispatcher giống gameSync:
 * - Appwrite khi có env (24/7 trên cloud)
 * - Socket.IO khi không có env (local dev / server tự host)
 */

export interface CreateRoomInput {
  playerName: string
  colorChoice: 'white' | 'black' | 'random'
  timeMinutes: number | null
}

const ERROR_MESSAGE_KEYS: Record<string, TranslationKey> = {
  ROOM_NOT_FOUND: 'lobby.errNotFound',
  ROOM_FULL: 'lobby.errFull',
  ROOM_FINISHED: 'lobby.errFinished',
  INVALID_CODE: 'lobby.errInvalidCode',
  INVALID_NAME: 'lobby.errInvalidName',
  INVALID_TIME_CONTROL: 'lobby.errInvalidTime',
  ACK_TIMEOUT: 'lobby.errAckTimeout',
}

/** Map error code → thông báo đã dịch theo ngôn ngữ hiện tại */
export function describeRoomError(
  code: string | undefined,
  t: (key: TranslationKey) => string,
): string {
  const key = code ? ERROR_MESSAGE_KEYS[code] : undefined
  return key ? t(key) : t('lobby.errGeneric')
}

/** Provider đang hoạt động (dùng để hiển thị nhãn) */
export function getOnlineProvider(): 'appwrite' | 'socket' {
  return isAppwriteConfigured() ? 'appwrite' : 'socket'
}

/**
 * Chuẩn bị kết nối trước khi create/join:
 * - Appwrite: đảm bảo có Anonymous Session
 * - Socket:   connect kèm tên trong auth payload
 */
export async function prepareConnection(playerName: string): Promise<void> {
  if (isAppwriteConfigured()) {
    await ensureAnonymousSession()
    return
  }
  connectSocket(playerName)
}

export async function createRoom(input: CreateRoomInput): Promise<CreateAckData> {
  if (isAppwriteConfigured()) {
    const ack = await createAppwriteRoom(input)
    if (!ack.ok) return { ok: false, error: ack.error }
    return { ok: true, room: ack.room, color: ack.color }
  }
  return emitAck<CreateAckData>(SOCKET_EVENTS.ROOM_CREATE, input)
}

export async function joinRoom(playerName: string, code: string): Promise<JoinAckData> {
  if (isAppwriteConfigured()) {
    return joinAppwriteRoom(playerName, code)
  }
  return emitAck<JoinAckData>(SOCKET_EVENTS.ROOM_JOIN, { playerName, code })
}

export function leaveRoom(): void {
  if (isAppwriteConfigured()) {
    const room = useRoomStore.getState().room
    if (room?.id) {
      void leaveAppwriteRoom(room.id).catch(() => undefined)
    }
    return
  }
  getSocket().emit(SOCKET_EVENTS.ROOM_LEAVE)
}
