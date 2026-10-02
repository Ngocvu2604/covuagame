import http from 'node:http'
import express from 'express'
import { Server } from 'socket.io'
import { config } from './config/config'
import { GameManager } from './game/GameManager'
import { RoomManager } from './rooms/RoomManager'
import { createRoomController } from './controllers/roomController'
import { GameService } from './services/gameService'
import { RoomService } from './services/roomService'
import { setupSocketServer } from './socket/socketServer'

/**
 * Entry point của Chess Arena server:
 * Express (REST phụ trợ) + Socket.IO (realtime rooms & games).
 */

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: { origin: config.corsOrigins },
})

const roomManager = new RoomManager()
const gameManager = new GameManager(
  { flagCheckIntervalMs: config.flagCheckIntervalMs },
  (roomCode, loserColor) => gameService.handleTimeout(roomCode, loserColor),
)
const roomService = new RoomService(io, roomManager, gameManager, config)
const gameService = new GameService(io, roomManager, roomService, gameManager)

app.use(createRoomController(roomManager))
setupSocketServer(io, { roomService, gameService, roomManager })

// Dọn phòng hết hạn; giải phóng ván cờ tương ứng
roomManager.startCleanup(
  {
    staleAfterMs: config.staleRoomMs,
    finishedTtlMs: config.finishedRoomTtlMs,
    intervalMs: config.cleanupIntervalMs,
  },
  (roomCode) => gameManager.removeGame(roomCode),
)

httpServer.listen(config.port, () => {
  console.log(`[chess-arena] server listening on http://localhost:${config.port}`)
})

function shutdown(): void {
  gameManager.dispose()
  roomManager.stopCleanup()
  io.close()
  httpServer.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000).unref()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
