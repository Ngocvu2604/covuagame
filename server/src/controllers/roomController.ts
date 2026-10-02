import { Router } from 'express'
import type { RoomManager } from '../rooms/RoomManager'
import { toPublicData } from '../rooms/Room'
import { isValidRoomCode } from '../utils/validation'

/**
 * REST endpoints phụ trợ:
 * - GET /health        → kiểm tra server sống
 * - GET /rooms/:code   → tra cứu công khai trạng thái phòng (client dùng
 *                        để báo "không tìm thấy phòng" trước khi join)
 */
export function createRoomController(roomManager: RoomManager): Router {
  const router = Router()

  router.get('/health', (_request, response) => {
    response.json({ ok: true })
  })

  router.get('/rooms/:code', (request, response) => {
    const code = String(request.params.code ?? '').toUpperCase()
    if (!isValidRoomCode(code)) {
      response.status(400).json({ error: 'INVALID_CODE' })
      return
    }
    const room = roomManager.findByCode(code)
    if (!room) {
      response.status(404).json({ error: 'ROOM_NOT_FOUND' })
      return
    }
    response.json(toPublicData(room))
  })

  return router
}
