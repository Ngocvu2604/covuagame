/**
 * Smoke test cho online server (chạy với server đang mở):
 *   npm run server        # terminal 1
 *   npm run test:online   # terminal 2 (hoặc: SERVER_URL=... node scripts/onlineSmokeTest.mjs)
 *
 * Kịch bản: kết nối 2 clients → tạo/join phòng → chặn nước đi gian lận
 * → chơi Fool's mate (chiếu hết) → rematch (đổi màu) → hòa thỏa thuận
 * → disconnect/reconnect → đầu hàng.
 */

import { io } from 'socket.io-client'

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3001'
let failures = 0

function check(name, condition, extra = '') {
  const ok = Boolean(condition)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`)
}

function connect(name) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, { auth: { playerName: name }, transports: ['websocket'] })
    socket.on('connect', () => resolve(socket))
    socket.on('connect_error', (error) => reject(new Error(`connect_error: ${error.message}`)))
  })
}

function emitAck(socket, event, payload = {}) {
  return new Promise((resolve) => {
    socket.timeout(3000).emit(event, payload, (error, response) => {
      resolve(error ? { ok: false, error: 'ACK_TIMEOUT' } : response)
    })
  })
}

function waitFor(socket, event, predicate = () => true, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, listener)
      reject(new Error(`timeout waiting for ${event}`))
    }, timeoutMs)
    const listener = (data) => {
      if (predicate(data)) {
        clearTimeout(timer)
        socket.off(event, listener)
        resolve(data)
      }
    }
    socket.on(event, listener)
  })
}

async function main() {
  console.log(`Smoke test → ${SERVER_URL}\n`)

  // 0) Health + kết nối bị chặn khi thiếu tên
  const health = await fetch(`${SERVER_URL}/health`).then((r) => r.json())
  check('GET /health', health.ok === true)

  const rejected = new Promise((resolve) => {
    const socket = io(SERVER_URL, { auth: { playerName: '' }, reconnection: false })
    socket.on('connect_error', (error) => resolve(error.message))
    socket.on('connect', () => resolve(null))
  })
  check('handshake without name rejected', (await rejected) === 'INVALID_NAME')

  // 1) Kết nối 2 người chơi
  const anh = await connect('AnhVu')
  const minh = await connect('Minh')
  check('2 clients connected', anh.connected && minh.connected)

  // 2) Tạo phòng
  const created = await emitAck(anh, 'room:create', {
    playerName: 'AnhVu',
    colorChoice: 'white',
    timeMinutes: 5,
  })
  check(
    'create room ok (code 6 ký tự, waiting, cầm Trắng)',
    created.ok === true &&
      typeof created.room?.code === 'string' &&
      created.room.code.length === 6 &&
      created.room.status === 'waiting' &&
      created.color === 'white',
  )
  const code = created.room.code

  // 3) REST tra cứu phòng
  const roomInfo = await fetch(`${SERVER_URL}/rooms/${code}`).then((r) => r.json())
  check('GET /rooms/:code', roomInfo.status === 'waiting' && roomInfo.players.length === 1)

  // 4) Join sai mã phòng
  const wrongCode = await emitAck(minh, 'room:join', { playerName: 'Minh', code: 'ZZZZZZ' })
  check('join wrong code → ROOM_NOT_FOUND', wrongCode.ok === false && wrongCode.error === 'ROOM_NOT_FOUND')

  // 5) Join đúng → ván bắt đầu, Minh cầm Đen
  const startedForAnh = waitFor(anh, 'game:started')
  const joined = await emitAck(minh, 'room:join', { playerName: 'Minh', code })
  const started = await startedForAnh
  check(
    'join ok → playing, cầm Đen, nhận GameState',
    joined.ok === true &&
      joined.color === 'black' &&
      joined.room?.status === 'playing' &&
      joined.state?.turn === 'white' &&
      joined.state?.moveHistory.length === 0,
  )
  check('game:started phát cho cả phòng', started.state?.turn === 'white')

  // 6) Chặn gian lận
  const notTurn = await emitAck(minh, 'game:move', { from: 'e7', to: 'e5' })
  check('đi nhầm lượt → NOT_YOUR_TURN', notTurn.ok === false && notTurn.error === 'NOT_YOUR_TURN')

  const illegal = await emitAck(anh, 'game:move', { from: 'e2', to: 'e5' })
  check('nước không hợp lệ → INVALID_MOVE', illegal.ok === false && illegal.error === 'INVALID_MOVE')

  // 7) Phòng đầy: người thứ 3 không vào được
  const tuan = await connect('Tuan')
  const full = await emitAck(tuan, 'room:join', { playerName: 'Tuan', code })
  check('người thứ 3 → ROOM_FULL', full.ok === false && full.error === 'ROOM_FULL')

  // 7b) Chat: gửi/nhận, chặn tin rỗng
  const chatToMinh = waitFor(minh, 'chat:message')
  const chatAck = await emitAck(anh, 'chat:send', { text: 'Good luck!' })
  const chatMsg = await chatToMinh
  check(
    'chat gửi và phát cho phòng',
    chatAck.ok === true && chatMsg.fromName === 'AnhVu' && chatMsg.text === 'Good luck!',
  )
  const emptyChat = await emitAck(anh, 'chat:send', { text: '   ' })
  check('tin nhắn rỗng bị chặn', emptyChat.ok === false && emptyChat.error === 'INVALID_MESSAGE')

  // 8) Fool's mate: f3 e5 g4 Qh4#
  const applyToMinh = waitFor(minh, 'game:move:applied')
  const m1 = await emitAck(anh, 'game:move', { from: 'f2', to: 'f3' })
  check('white f3 ok', m1.ok === true && m1.state?.turn === 'black')
  await applyToMinh

  const applyToAnh = waitFor(anh, 'game:move:applied')
  const m2 = await emitAck(minh, 'game:move', { from: 'e7', to: 'e5' })
  check('black e5 ok', m2.ok === true && m2.state?.turn === 'white')
  await applyToAnh

  const gameOverPair = Promise.all([waitFor(anh, 'game:over'), waitFor(minh, 'game:over')])
  await emitAck(anh, 'game:move', { from: 'g2', to: 'g4' })
  await emitAck(minh, 'game:move', { from: 'd8', to: 'h4' })
  const overs = await gameOverPair
  check(
    'chiếu hết phát cho cả 2 (Đen thắng)',
    overs.every((o) => o.result?.reason === 'checkmate' && o.result?.winner === 'black'),
  )
  check(
    'game:over payload state.result khớp result',
    overs.every((o) => o.state?.result?.reason === o.result?.reason && o.state?.result?.winner === o.result?.winner),
  )

  // 9) Phòng FINISHED: người mới join bị chặn
  const finishedJoin = await emitAck(tuan, 'room:join', { playerName: 'Tuan', code })
  check('join phòng đã kết thúc → ROOM_FINISHED', finishedJoin.ok === false && finishedJoin.error === 'ROOM_FINISHED')
  tuan.close()

  // 10) Rematch: Anh mời, Minh nhận → đổi màu (Anh thành Đen)
  const rematchPair = Promise.all([waitFor(anh, 'game:started'), waitFor(minh, 'game:started')])
  await emitAck(anh, 'game:rematch:offer', {})
  await emitAck(minh, 'game:rematch:accept', {})
  const rematch = await rematchPair
  const anhColorAfterRematch = rematch[0].room.players.find((p) => p.name === 'AnhVu')?.color
  check(
    'rematch bắt đầu ván mới + đổi màu',
    rematch.every((s) => s.state?.moveHistory.length === 0) && anhColorAfterRematch === 'black',
  )

  // 11) Hòa thỏa thuận: Anh đề nghị, Minh chấp nhận
  const drawPair = Promise.all([waitFor(anh, 'game:over'), waitFor(minh, 'game:over')])
  await emitAck(anh, 'game:draw:offer', {})
  await emitAck(minh, 'game:draw:accept', {})
  const draws = await drawPair
  check(
    'hòa thỏa thuận',
    draws.every((o) => o.result?.reason === 'agreement' && o.result?.winner === null),
  )

  // 12) Disconnect + reconnect: rematch rồi Minh mất kết nối
  await emitAck(anh, 'game:rematch:offer', {})
  await emitAck(minh, 'game:rematch:accept', {})
  const disconnectedEvent = waitFor(anh, 'player:disconnected', (d) => d.name === 'Minh')
  minh.disconnect()
  await disconnectedEvent
  check('player:disconnected phát cho đối thủ', true)

  const reconnectedEvent = waitFor(anh, 'player:reconnected', (d) => d.name === 'Minh')
  const minh2 = await connect('Minh')
  const rejoined = await emitAck(minh2, 'room:join', { playerName: 'Minh', code })
  await reconnectedEvent
  check(
    'reconnect lấy lại chỗ + nhận state',
    rejoined.ok === true && rejoined.color === 'black' && Array.isArray(rejoined.state?.moveHistory),
  )
  check(
    'reconnect nhận lại lịch sử chat',
    Array.isArray(rejoined.chat) && rejoined.chat.some((m) => m.text === 'Good luck!'),
  )

  // 13) Đầu hàng: Minh (Đen) đầu hàng → Anh (Trắng) thắng
  const resignOver = waitFor(anh, 'game:over')
  await emitAck(minh2, 'game:resign', {})
  const resignResult = await resignOver
  check(
    'đầu hàng → ván kết thúc đúng người thắng',
    resignResult.result?.reason === 'resignation' &&
      resignResult.result?.winner === 'white' &&
      resignResult.state?.result?.reason === 'resignation',
  )

  anh.close()
  minh.close()
  minh2.close()

  console.log(failures === 0 ? '\n✅ ALL TESTS PASSED' : `\n❌ ${failures} TEST(S) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Smoke test crashed:', error.message)
  process.exit(1)
})
