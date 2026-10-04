import type { CreateAckData, JoinAckData } from '../types/socket'
import { connectSocket, emitAck, getSocket } from './socketClient'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { ensureAnonymousSession, isAppwriteConfigured } from './appwrite/client'
import { createAppwriteRoom, joinAppwriteRoom, leaveAppwriteRoom } from './appwrite/roomService'
import { useRoomStore } from '../state/roomStore'

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

export const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'Không tìm thấy phòng.',
  ROOM_FULL: 'Phòng đã đầy.',
  ROOM_FINISHED: 'Phòng này không còn hoạt động.',
  INVALID_CODE: 'Mã phòng không hợp lệ.',
  INVALID_NAME: 'Tên người chơi không hợp lệ.',
  INVALID_TIME_CONTROL: 'Thời gian không hợp lệ.',
  ACK_TIMEOUT: 'Máy chủ không phản hồi.',
}

export function describeRoomError(code?: string): string {
  return (code && ERROR_MESSAGES[code]) || 'Không thể kết nối máy chủ.'
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
