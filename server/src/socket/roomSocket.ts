import type { Socket } from 'socket.io'
import { SOCKET_EVENTS, replyAck } from '../types/socket'
import type { RoomService } from '../services/roomService'

/** Đăng ký các handler sự kiện phòng cho một kết nối */
export function registerRoomHandlers(socket: Socket, roomService: RoomService): void {
  socket.on(SOCKET_EVENTS.ROOM_CREATE, (payload: unknown, ack: unknown) => {
    replyAck(ack, roomService.createRoom(socket, payload))
  })

  socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload: unknown, ack: unknown) => {
    replyAck(ack, roomService.joinRoom(socket, payload))
  })

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
    roomService.leaveRoom(socket)
  })

  socket.on('disconnect', () => {
    roomService.handleDisconnect(socket)
  })
}
