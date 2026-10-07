/* Kiểm chứng replayMoves với dữ liệu thật trong DB (không cần API key — session ẩn danh) */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { Chess } = require('../node_modules/chess.js')

const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT = '6ac13f5d000d086aa616'
let cookie = ''

async function api(method, path, body) {
  const res = await fetch(ENDPOINT + path, {
    method,
    headers: { 'X-Appwrite-Project': PROJECT, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const sc = res.headers.get('set-cookie')
  if (sc) cookie = sc.split(';')[0]
  const json = await res.json()
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 150)}`)
  return json
}

const code = process.argv[2]
await api('POST', '/account/sessions/anonymous')
const q1 = encodeURIComponent(JSON.stringify({ method: 'equal', attribute: 'code', values: [code] }))
const rooms = await api('GET', `/databases/chess-arena/collections/rooms/documents?queries%5B0%5D=${q1}`)
const room = rooms.documents[0]
console.log('room:', { status: room.status, turn: room.turn, gameNumber: room.gameNumber, white: room.whitePlayerId.slice(0, 8), black: room.blackPlayerId.slice(0, 8) })

const queries = [
  { method: 'equal', attribute: 'roomId', values: [room.$id] },
  { method: 'equal', attribute: 'gameNumber', values: [room.gameNumber] },
  { method: 'orderAsc', attribute: 'ply' },
  { method: 'limit', values: [100] },
]
  .map((q) => 'queries[]=' + encodeURIComponent(JSON.stringify(q)))
  .join('&')
const moves = await api('GET', `/databases/chess-arena/collections/moves/documents?${queries}`)

const ordered = [...moves.documents].sort((a, b) => a.ply - b.ply || a.$createdAt.localeCompare(b.$createdAt))
const game = new Chess()
let expectedPly = 1
for (const move of ordered) {
  const color = move.userId === room.whitePlayerId ? 'white' : move.userId === room.blackPlayerId ? 'black' : null
  const reasons = []
  if (move.gameNumber !== room.gameNumber) reasons.push('gameNumber')
  if (move.ply !== expectedPly) reasons.push(`ply(${move.ply}!==${expectedPly})`)
  if (!color || color !== (game.turn() === 'w' ? 'white' : 'black')) reasons.push(`color(${color} vs turn ${game.turn()})`)
  const applied = reasons.length === 0 ? game.move({ from: move.from, to: move.to, promotion: move.promotion || undefined }) : null
  if (!applied) reasons.push('illegal')
  if (reasons.length === 0) expectedPly++
  console.log(`ply=${move.ply} ${move.from}${move.to} user=${move.userId.slice(0, 8)} →`, reasons.length ? 'SKIP: ' + reasons.join(',') : `OK ${applied.san}`)
}
console.log('final fen:', game.fen())
