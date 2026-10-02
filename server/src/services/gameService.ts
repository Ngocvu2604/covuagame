import type { Server, Socket } from 'socket.io'
import type { PlayerColor } from '../types/game'
import type { MoveAckData, SimpleAckData } from '../types/socket'
import { SOCKET_EVENTS } from '../types/socket'
import type { GameManager } from '../game/GameManager'
import type { RoomManager } from '../rooms/RoomManager'
import { findPlayerBySocket, swapColors, toPublicData, touch } from '../rooms/Room'
import type { RoomService } from './roomService'
import { isValidPromotion } from '../utils/validation'

/**
 * Điều phối ván đấu: đi quân, đầu hàng, hòa, chơi lại.
 * Server xác thực mọi thao tác rồi mới phát kết quả cho cả phòng.
 */
export class GameService {
  constructor(
    private readonly io: Server,
    private readonly roomManager: RoomManager,
    private readonly roomService: RoomService,
    private readonly gameManager: GameManager,
  ) {}

  move(socket: Socket, payload: unknown, ack: (data: MoveAckData) => void): void {
    const context = this.getPlayingContext(socket)
    if (!context) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }
    const { room, player } = context

    const data = (payload ?? {}) as Record<string, unknown>
    if (data.promotion !== undefined && !isValidPromotion(data.promotion)) {
      ack({ ok: false, error: 'INVALID_MOVE' })
      return
    }

    const outcome = this.gameManager.tryMove(room.code, player.color, data)
    if (!outcome.ok) {
      ack({ ok: false, error: outcome.error })
      return
    }

    touch(room)
    ack({ ok: true, move: outcome.record, state: outcome.state })
    this.io.to(room.code).emit(SOCKET_EVENTS.GAME_MOVE_APPLIED, {
      move: outcome.record,
      state: outcome.state,
    })

    if (outcome.state.result) {
      this.roomService.finishGame(room, outcome.state.result, outcome.state)
    }
  }

  resign(socket: Socket, ack: (data: SimpleAckData) => void): void {
    const context = this.getPlayingContext(socket)
    if (!context) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }

    const outcome = this.gameManager.resign(context.room.code, context.player.color)
    if (!outcome.ok) {
      ack({ ok: false, error: outcome.error })
      return
    }
    this.roomService.finishGame(context.room, outcome.result, outcome.state)
    ack({ ok: true })
  }

  drawOffer(socket: Socket, ack: (data: SimpleAckData) => void): void {
    const context = this.getPlayingContext(socket)
    if (!context) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }
    const { room, player } = context
    if (room.drawOfferedBy === player.color) {
      ack({ ok: false, error: 'NO_OFFER' })
      return
    }
    room.drawOfferedBy = player.color
    this.io.to(room.code).emit(SOCKET_EVENTS.GAME_DRAW_OFFERED, { from: player.color })
    ack({ ok: true })
  }

  drawAccept(socket: Socket, ack: (data: SimpleAckData) => void): void {
    const context = this.getPlayingContext(socket)
    if (!context) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }
    const { room, player } = context
    if (!room.drawOfferedBy || room.drawOfferedBy === player.color) {
      ack({ ok: false, error: 'NO_OFFER' })
      return
    }

    const outcome = this.gameManager.agreeDraw(room.code)
    if (!outcome.ok) {
      ack({ ok: false, error: outcome.error })
      return
    }
    this.roomService.finishGame(room, outcome.result, outcome.state)
    ack({ ok: true })
  }

  drawDecline(socket: Socket, ack: (data: SimpleAckData) => void): void {
    const context = this.getPlayingContext(socket)
    if (!context) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }
    const { room, player } = context
    if (!room.drawOfferedBy || room.drawOfferedBy === player.color) {
      ack({ ok: false, error: 'NO_OFFER' })
      return
    }
    room.drawOfferedBy = null
    this.io.to(room.code).emit(SOCKET_EVENTS.GAME_DRAW_DECLINED, { from: player.color })
    ack({ ok: true })
  }

  rematchOffer(socket: Socket, ack: (data: SimpleAckData) => void): void {
    const code = this.roomManager.findCodeBySocket(socket.id)
    const room = code ? this.roomManager.findByCode(code) : undefined
    const player = room ? findPlayerBySocket(room, socket.id) : undefined
    if (!room || !player) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }
    if (room.status !== 'finished') {
      ack({ ok: false, error: 'GAME_NOT_ACTIVE' })
      return
    }
    if (room.rematchOfferedBy === player.color) {
      ack({ ok: false, error: 'NO_OFFER' })
      return
    }
    room.rematchOfferedBy = player.color
    this.io.to(room.code).emit(SOCKET_EVENTS.GAME_REMATCH_OFFERED, { from: player.color })
    ack({ ok: true })
  }

  rematchAccept(socket: Socket, ack: (data: SimpleAckData) => void): void {
    const code = this.roomManager.findCodeBySocket(socket.id)
    const room = code ? this.roomManager.findByCode(code) : undefined
    const player = room ? findPlayerBySocket(room, socket.id) : undefined
    if (!room || !player) {
      ack({ ok: false, error: 'NOT_IN_ROOM' })
      return
    }
    if (room.status !== 'finished' || !room.rematchOfferedBy || room.rematchOfferedBy === player.color) {
      ack({ ok: false, error: 'NO_OFFER' })
      return
    }

    // Chơi lại: đổi màu hai bên, tạo ván mới
    swapColors(room)
    room.drawOfferedBy = null
    room.rematchOfferedBy = null
    this.roomManager.setStatus(room, 'playing')
    this.gameManager.createGame(room.code, room.timeMinutes)
    const state = this.gameManager.getState(room.code)

    this.io.to(room.code).emit(SOCKET_EVENTS.GAME_STARTED, {
      room: toPublicData(room),
      state: state,
    })
    this.io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: toPublicData(room) })
    ack({ ok: true })
  }

  /** Được GameManager gọi khi bộ đếm phát hiện một bên hết giờ */
  handleTimeout(roomCode: string, loserColor: PlayerColor): void {
    const room = this.roomManager.findByCode(roomCode)
    if (!room || room.status !== 'playing') return
    const outcome = this.gameManager.flag(roomCode, loserColor)
    if (outcome.ok) {
      this.roomService.finishGame(room, outcome.result, outcome.state)
    }
  }

  private getPlayingContext(
    socket: Socket,
  ): { room: NonNullable<ReturnType<RoomManager['findByCode']>>; player: NonNullable<ReturnType<typeof findPlayerBySocket>> } | null {
    const code = this.roomManager.findCodeBySocket(socket.id)
    const room = code ? this.roomManager.findByCode(code) : undefined
    if (!room || room.status !== 'playing') return null
    const player = findPlayerBySocket(room, socket.id)
    if (!player) return null
    return { room, player }
  }
}
