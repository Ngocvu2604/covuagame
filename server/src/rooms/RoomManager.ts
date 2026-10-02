import { randomUUID } from 'node:crypto'
import type { ServerPlayer } from '../types/player'
import type { Room, RoomStatus } from '../types/room'
import { createRoom, touch } from './Room'
import { generateRoomCode } from '../utils/generateRoomCode'

export interface RoomCleanupOptions {
  staleAfterMs: number
  finishedTtlMs: number
  intervalMs: number
}

/**
 * Quản lý toàn bộ phòng trong bộ nhớ: tạo, tra cứu, xóa, dọn phòng cũ,
 * và ánh xạ socketId → mã phòng để biết socket đang ở phòng nào.
 */
export class RoomManager {
  private readonly rooms = new Map<string, Room>() // key: room code
  private readonly socketToRoom = new Map<string, string>() // socketId → room code
  private cleanupTimer: NodeJS.Timeout | null = null

  create(host: ServerPlayer, timeMinutes: number | null): Room {
    const code = generateRoomCode((candidate) => this.rooms.has(candidate))
    const room = createRoom({ id: randomUUID(), code, host, timeMinutes })
    this.rooms.set(code, room)
    this.socketToRoom.set(host.socketId, code)
    return room
  }

  findByCode(code: string): Room | undefined {
    return this.rooms.get(code)
  }

  findCodeBySocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId)
  }

  registerSocket(socketId: string, code: string): void {
    this.socketToRoom.set(socketId, code)
  }

  unregisterSocket(socketId: string): void {
    this.socketToRoom.delete(socketId)
  }

  setStatus(room: Room, status: RoomStatus): void {
    room.status = status
    touch(room)
  }

  remove(code: string): void {
    const room = this.rooms.get(code)
    if (!room) return
    for (const player of room.players) {
      if (this.socketToRoom.get(player.socketId) === code) {
        this.socketToRoom.delete(player.socketId)
      }
    }
    this.rooms.delete(code)
  }

  /**
   * Dọn phòng theo chu kỳ: phòng đã kết thúc bị xóa sau TTL,
   * phòng còn lại không có hoạt động quá lâu cũng bị xóa.
   * Trả về danh sách mã phòng bị xóa qua callback để giải phóng game tương ứng.
   */
  startCleanup(
    options: RoomCleanupOptions,
    onRoomRemoved: (code: string) => void,
  ): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [code, room] of this.rooms) {
        const age = now - room.lastActivity
        const expired =
          room.status === 'finished' ? age > options.finishedTtlMs : age > options.staleAfterMs
        if (expired) {
          this.remove(code)
          onRoomRemoved(code)
        }
      }
    }, options.intervalMs)
    this.cleanupTimer.unref()
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}
