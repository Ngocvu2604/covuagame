import type { Server, Socket } from 'socket.io'
import type { ChatMessage } from '../types/room'
import { SOCKET_EVENTS, replyAck } from '../types/socket'
import type { RoomManager } from '../rooms/RoomManager'
import { addChatMessage, findPlayerBySocket } from '../rooms/Room'
import { isValidChatText } from '../utils/validation'

/**
 * Relay chat giữa 2 người chơi trong phòng: validate nội dung,
 * lưu vào lịch sử phòng (phục vụ reconnect) rồi phát cho cả phòng.
 */
export function registerChatHandlers(socket: Socket, io: Server, roomManager: RoomManager): void {
  socket.on(SOCKET_EVENTS.CHAT_SEND, (payload: unknown, ack: unknown) => {
    const code = roomManager.findCodeBySocket(socket.id)
    const room = code ? roomManager.findByCode(code) : undefined
    const player = room ? findPlayerBySocket(room, socket.id) : undefined
    if (!room || !player) {
      replyAck(ack, { ok: false, error: 'NOT_IN_ROOM' })
      return
    }

    const data = (payload ?? {}) as { text?: unknown }
    if (!isValidChatText(data.text)) {
      replyAck(ack, { ok: false, error: 'INVALID_MESSAGE' })
      return
    }

    const message: ChatMessage = {
      from: player.color,
      fromName: player.name,
      text: data.text.trim(),
      sentAt: Date.now(),
    }
    addChatMessage(room, message)
    io.to(room.code).emit(SOCKET_EVENTS.CHAT_MESSAGE, message)
    replyAck(ack, { ok: true })
  })
}
