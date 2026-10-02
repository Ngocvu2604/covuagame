import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

/**
 * Kết nối Socket.IO duy nhất của app (singleton).
 * Gửi tên người chơi trong auth payload — server xác thực ở handshake.
 * socket.io tự động kết nối lại khi mất mạng; auth được giữ nguyên.
 */

export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/** Đặt auth (tên người chơi) rồi kết nối nếu chưa kết nối */
export function connectSocket(playerName: string): Socket {
  const instance = getSocket()
  instance.auth = { playerName }
  if (!instance.connected) {
    instance.connect()
  }
  return instance
}

/**
 * Emit kèm ack, trả về response qua Promise.
 * Với event không cần payload, emit đúng dạng (event, ack) để
 * khớp chữ ký handler phía server.
 */
export function emitAck<T>(event: string, payload?: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const instance = getSocket()
    const timer = setTimeout(() => reject(new Error('ACK_TIMEOUT')), 5000)

    const onReply = (response: T) => {
      clearTimeout(timer)
      resolve(response)
    }

    if (payload === undefined) {
      instance.emit(event, onReply)
    } else {
      instance.emit(event, payload, onReply)
    }
  })
}
