import type { CreateAckData, JoinAckData } from '../types/socket'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { emitAck, getSocket } from './socketClient'

/**
 * Các thao tác phòng: tạo, tham gia, rời phòng.
 * Giao tiếp với server qua socket ack (server là nguồn sự thật).
 */

export interface CreateRoomInput {
  playerName: string
  colorChoice: 'white' | 'black' | 'random'
  timeMinutes: number | null
}

export function createRoom(input: CreateRoomInput): Promise<CreateAckData> {
  return emitAck<CreateAckData>(SOCKET_EVENTS.ROOM_CREATE, input)
}

export function joinRoom(playerName: string, code: string): Promise<JoinAckData> {
  return emitAck<JoinAckData>(SOCKET_EVENTS.ROOM_JOIN, { playerName, code })
}

export function leaveRoom(): void {
  getSocket().emit(SOCKET_EVENTS.ROOM_LEAVE)
}
