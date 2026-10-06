import type { Socket } from 'socket.io'
import { SOCKET_EVENTS, replyAck } from '../types/socket'
import type { GameService } from '../services/gameService'

/** Đăng ký các handler sự kiện ván đấu cho một kết nối */
export function registerGameHandlers(socket: Socket, gameService: GameService): void {
  socket.on(SOCKET_EVENTS.GAME_MOVE, (payload: unknown, ack: unknown) => {
    gameService.move(socket, payload, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_RESIGN, (ack: unknown) => {
    gameService.resign(socket, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_DRAW_OFFER, (ack: unknown) => {
    gameService.drawOffer(socket, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_DRAW_ACCEPT, (ack: unknown) => {
    gameService.drawAccept(socket, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_DRAW_DECLINE, (ack: unknown) => {
    gameService.drawDecline(socket, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_REMATCH_OFFER, (ack: unknown) => {
    gameService.rematchOffer(socket, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_REMATCH_ACCEPT, (ack: unknown) => {
    gameService.rematchAccept(socket, (data) => replyAck(ack, data))
  })

  socket.on(SOCKET_EVENTS.GAME_REMATCH_DECLINE, (ack: unknown) => {
    gameService.rematchDecline(socket, (data) => replyAck(ack, data))
  })
}
