import type { Server } from 'socket.io'
import type { RoomManager } from '../rooms/RoomManager'
import type { GameService } from '../services/gameService'
import type { RoomService } from '../services/roomService'
import { attachAuthMiddleware } from '../middleware/socketAuth'
import { registerChatHandlers } from './chatSocket'
import { registerGameHandlers } from './gameSocket'
import { registerRoomHandlers } from './roomSocket'

/** Khởi tạo Socket.IO: xác thực handshake rồi gắn handler cho từng kết nối */
export function setupSocketServer(
  io: Server,
  services: {
    roomService: RoomService
    gameService: GameService
    roomManager: RoomManager
  },
): void {
  attachAuthMiddleware(io)

  io.on('connection', (socket) => {
    registerRoomHandlers(socket, services.roomService)
    registerGameHandlers(socket, services.gameService)
    registerChatHandlers(socket, io, services.roomManager)
  })
}
