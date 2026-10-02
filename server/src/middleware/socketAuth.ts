import type { Server } from 'socket.io'
import { isValidPlayerName } from '../utils/validation'

/**
 * Xác thực handshake: mọi kết nối phải gửi tên người chơi hợp lệ
 * trong auth payload (auth: { playerName }).
 */
export function attachAuthMiddleware(io: Server): void {
  io.use((socket, next) => {
    const name = socket.handshake.auth?.playerName
    if (!isValidPlayerName(name)) {
      next(new Error('INVALID_NAME'))
      return
    }
    socket.data.playerName = name.trim()
    next()
  })
}
