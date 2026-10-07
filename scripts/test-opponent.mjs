/* Đối thủ thử nghiệm B: session ẩn danh qua REST, lưu cookie để tái dùng đúng ghế */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT = '6ac13f5d000d086aa616'
const COOKIE_FILE = new URL('./.test-opponent-cookie', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
let cookie = existsSync(COOKIE_FILE) ? readFileSync(COOKIE_FILE, 'utf8').trim() : ''

async function api(method, path, body) {
  const res = await fetch(ENDPOINT + path, {
    method,
    headers: {
      'X-Appwrite-Project': PROJECT,
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const sc = res.headers.get('set-cookie')
  if (sc) {
    cookie = sc.split(';')[0]
    writeFileSync(COOKIE_FILE, cookie)
  }
  const json = await res.json()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 200)}`)
  return json
}

const code = process.argv[2]
const action = process.argv[3] ?? 'join'

async function main() {
  // có cookie lưu sẵn → dùng lại session (đúng ghế); không thì tạo mới
  if (!cookie) await api('POST', '/account/sessions/anonymous')
  const me = await api('GET', '/account')
  const q = encodeURIComponent(JSON.stringify({ method: 'equal', attribute: 'code', values: [code] }))
  const rooms = await api('GET', `/databases/chess-arena/collections/rooms/documents?queries%5B0%5D=${q}`)
  const room = rooms.documents[0]
  if (action === 'join') {
    await api('PATCH', `/databases/chess-arena/collections/rooms/documents/${room.$id}`, {
      data: {
        blackPlayerId: me.$id,
        blackPlayerName: 'OpponentB',
        status: 'playing',
        turnStartedAt: Date.now(),
        whiteLastSeenAt: Date.now(),
        blackLastSeenAt: Date.now(),
      },
    })
    console.log('JOINED', me.$id, room.$id)
  } else if (action === 'reply') {
    // mỗi lần chạy là một session mới → chiếm lại ghế đen trước khi đi
    await api('PATCH', `/databases/chess-arena/collections/rooms/documents/${room.$id}`, {
      data: {
        blackPlayerId: me.$id,
        blackPlayerName: 'OpponentB',
        blackLastSeenAt: Date.now(),
        whiteLastSeenAt: Date.now(),
      },
    })
    // B đi một nước hợp lệ để ván tiếp diễn (dùng cho các lần đo sau)
    const mv = process.argv[4]
    const gameNumber = room.gameNumber
    const queries = [
      { method: 'equal', attribute: 'roomId', values: [room.$id] },
      { method: 'equal', attribute: 'gameNumber', values: [gameNumber] },
      { method: 'orderAsc', attribute: 'ply' },
      { method: 'limit', values: [100] },
    ]
      .map((q) => 'queries[]=' + encodeURIComponent(JSON.stringify(q)))
      .join('&')
    const moves = await api('GET', `/databases/chess-arena/collections/moves/documents?${queries}`)
    // ply = số ply còn thiếu đầu tiên (không phải tổng số doc — có thể có doc rác)
    const usedPlies = new Set(moves.documents.map((m) => m.ply))
    let ply = 1
    while (usedPlies.has(ply)) ply++
    const [from, to] = [mv.slice(0, 2), mv.slice(2, 4)]
    await api('POST', '/databases/chess-arena/collections/moves/documents', {
      documentId: 'unique()',
      data: { roomId: room.$id, gameNumber, ply, userId: me.$id, color: 'black', from, to, promotion: '' },
    })
    await api('PATCH', `/databases/chess-arena/collections/rooms/documents/${room.$id}`, {
      data: { turn: 'white', turnStartedAt: Date.now(), blackLastSeenAt: Date.now() },
    })
    console.log('REPLIED', mv)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
