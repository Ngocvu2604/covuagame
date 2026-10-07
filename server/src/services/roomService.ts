import type { Server, Socket } from 'socket.io'
import type { Config } from '../config/config'
import type { GameResult, GameState, PlayerColor } from '../types/game'
import type { Room, ServerPlayer } from '../types/room'
import type { CreateAckData, JoinAckData } from '../types/socket'
import { SOCKET_EVENTS } from '../types/socket'
import type { GameManager } from '../game/GameManager'
import type { RoomManager } from '../rooms/RoomManager'
import { findPlayerByName, findPlayerBySocket, toPublicData, touch } from '../rooms/Room'
import {
  isValidColorChoice,
  isValidPlayerName,
  isValidTimeMinutes,
} from '../utils/validation'

/**
 * Điều phối vòng đời phòng: tạo, tham gia, rời phòng, disconnect/reconnect.
 * Khi đủ 2 người → gọi GameManager tạo ván và phát game:started cho phòng.
 */
export class RoomService {
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>()

  constructor(
    private readonly io: Server,
    private readonly roomManager: RoomManager,
    private readonly gameManager: GameManager,
    private readonly config: Config,
  ) {}

  createRoom(socket: Socket, payload: unknown): CreateAckData {
    const data = (payload ?? {}) as Record<string, unknown>
    if (!isValidPlayerName(data.playerName)) return { ok: false, error: 'INVALID_NAME' }
    if (!isValidColorChoice(data.colorChoice)) return { ok: false, error: 'INVALID_NAME' }
    if (!isValidTimeMinutes(data.timeMinutes)) return { ok: false, error: 'INVALID_TIME_CONTROL' }

    const color: PlayerColor =
      data.colorChoice === 'random'
        ? Math.random() < 0.5
          ? 'white'
          : 'black'
        : data.colorChoice

    const host: ServerPlayer = {
      socketId: socket.id,
      name: data.playerName.trim(),
      color,
      connected: true,
    }
    const room = this.roomManager.create(host, data.timeMinutes)
    socket.join(room.code)

    return { ok: true, room: toPublicData(room), color }
  }

  joinRoom(socket: Socket, payload: unknown): JoinAckData {
    const data = (payload ?? {}) as Record<string, unknown>
    if (!isValidPlayerName(data.playerName)) return { ok: false, error: 'INVALID_NAME' }
    if (typeof data.code !== 'string') return { ok: false, error: 'INVALID_CODE' }

    const room = this.roomManager.findByCode(data.code.toUpperCase())
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' }
    console.log(`[room ${room.code}] join attempt: name=${data.playerName} status=${room.status} players=${room.players.map((p) => `${p.name}(${p.connected ? 'on' : 'off'})`).join(',')}`)
    touch(room)

    const name = data.playerName.trim()

    // Kết nối lại: có slot cùng tên → lấy lại chỗ cũ. Chấp nhận cả trường hợp
    // server chưa kịp đánh dấu mất kết nối (refresh/reconnect rất nhanh).
    // Không có hệ thống tài khoản nên tên là định danh phiên (mục 11).
    const existing = findPlayerByName(room, name)
    if (existing) {
      if (existing.socketId === socket.id) {
        // Chính socket này join lại → trả trạng thái hiện tại, không phát sự kiện
        const state = this.gameManager.getState(room.code)
        return {
          ok: true,
          room: toPublicData(room),
          color: existing.color,
          state,
          clock: this.gameManager.getClock(room.code),
          chat: [...room.messages],
        }
      }
      const oldSocketId = existing.socketId
      this.clearDisconnectTimer(oldSocketId)
      this.roomManager.unregisterSocket(oldSocketId)
      existing.socketId = socket.id
      existing.connected = true
      this.roomManager.registerSocket(socket.id, room.code)
      socket.join(room.code)
      this.io.to(room.code).emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
        name: existing.name,
        color: existing.color,
      })
      this.io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: toPublicData(room) })
      const state = this.gameManager.getState(room.code)
      const clock = this.gameManager.getClock(room.code)
      // Người reconnect nhận lại lịch sử chat đã bỏ lỡ
      return {
        ok: true,
        room: toPublicData(room),
        color: existing.color,
        state,
        clock,
        chat: [...room.messages],
      }
    }

    if (room.status === 'finished') return { ok: false, error: 'ROOM_FINISHED' }
    if (room.players.length >= 2) return { ok: false, error: 'ROOM_FULL' }

    // Tham gia phòng đang chờ → nhận màu còn lại và bắt đầu ván
    const host = room.players[0]
    const color: PlayerColor = host.color === 'white' ? 'black' : 'white'
    const player: ServerPlayer = { socketId: socket.id, name, color, connected: true }
    room.players.push(player)
    this.roomManager.registerSocket(socket.id, room.code)
    socket.join(room.code)

    this.roomManager.setStatus(room, 'playing')
    this.gameManager.createGame(room.code, room.timeMinutes)
    const state = this.gameManager.getState(room.code)
    const clock = this.gameManager.getClock(room.code)

    for (const player of room.players) {
      this.io.to(player.socketId).emit(SOCKET_EVENTS.GAME_STARTED, {
        room: toPublicData(room),
        state: state,
        clock,
        color: player.color,
      })
    }
    this.io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: toPublicData(room) })

    return { ok: true, room: toPublicData(room), color, state, clock }
  }

  /** Rời phòng chủ động: đang chơi thì coi như đầu hàng */
  leaveRoom(socket: Socket): void {
    const code = this.roomManager.findCodeBySocket(socket.id)
    if (!code) return
    console.log(`[room ${code}] leave requested by socket ${socket.id}`)
    const room = this.roomManager.findByCode(code)
    if (!room) return
    const player = findPlayerBySocket(room, socket.id)
    if (!player) return

    if (room.status === 'playing') {
      // Rời phòng qua xác nhận → lý do 'left' (phân biệt đầu hàng trực tiếp)
      const outcome = this.gameManager.leave(room.code, player.color)
      if (outcome.ok) this.finishGame(room, outcome.result, outcome.state)
    }

    this.removePlayer(room, socket.id)
    socket.leave(room.code)
  }

  /** Mất kết nối: đang chơi thì chờ reconnect trong một khoảng thời gian (mục 18) */
  handleDisconnect(socket: Socket): void {
    const code = this.roomManager.findCodeBySocket(socket.id)
    if (!code) return
    const room = this.roomManager.findByCode(code)
    if (!room) {
      this.roomManager.unregisterSocket(socket.id)
      return
    }
    const player = findPlayerBySocket(room, socket.id)
    if (!player) {
      this.roomManager.unregisterSocket(socket.id)
      return
    }

    player.connected = false
    console.log(`[room ${room.code}] disconnect: ${player.name} status=${room.status}`)
    this.io
      .to(room.code)
      .emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, { name: player.name, color: player.color })
    this.io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: toPublicData(room) })

    if (room.status === 'playing') {
      const timer = setTimeout(() => {
        this.disconnectTimers.delete(socket.id)
        const current = this.roomManager.findByCode(room.code)
        if (!current || current.status !== 'playing') return
        const still = findPlayerBySocket(current, socket.id)
        if (!still || still.connected) return
        // Quá thời gian chờ không reconnect → xử thua (lý do 'abandoned' —
        // phân biệt với đầu hàng trực tiếp và rời trận có xác nhận)
        console.log(`[room ${room.code}] grace timer expired → ${player.name} loses`)
        const outcome = this.gameManager.abandon(room.code, player.color)
        if (outcome.ok) this.finishGame(current, outcome.result, outcome.state)
      }, this.config.disconnectGraceMs)
      this.disconnectTimers.set(socket.id, timer)
    } else {
      this.removePlayer(room, socket.id)
    }
  }

  /** Kết thúc ván: cập nhật phòng + phát kết quả cho cả phòng.
   * `result` do tầng app quyết định (đầu hàng/hết giờ/thỏa thuận) nên được
   * merge vào state — vị trí cờ bản thân nó không mang kết quả này. */
  finishGame(room: Room, result: GameResult, state: GameState): void {
    console.log(`[room ${room.code}] game finished: ${result.reason} winner=${result.winner ?? 'draw'}`)
    this.roomManager.setStatus(room, 'finished')
    room.drawOfferedBy = null
    room.rematchOfferedBy = null
    touch(room)
    const stateWithResult: GameState = { ...state, result }
    this.io
      .to(room.code)
      .emit(SOCKET_EVENTS.GAME_OVER, { result, state: stateWithResult, clock: this.gameManager.getClock(room.code) })
    this.io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: toPublicData(room) })
  }

  private removePlayer(room: Room, socketId: string): void {
    this.clearDisconnectTimer(socketId)
    room.players = room.players.filter((player) => player.socketId !== socketId)
    this.roomManager.unregisterSocket(socketId)
    if (room.players.length === 0) {
      this.roomManager.remove(room.code)
      this.gameManager.removeGame(room.code)
    } else {
      touch(room)
      this.io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: toPublicData(room) })
    }
  }

  private clearDisconnectTimer(socketId: string): void {
    const timer = this.disconnectTimers.get(socketId)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(socketId)
    }
  }
}
