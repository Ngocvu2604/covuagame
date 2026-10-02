/**
 * Bộ test luật cờ vua chạy trên ChessGame engine (chess.js):
 *   npm run test:rules --workspace client
 *
 * Bao phủ: nhập thành (2 cánh), bắt tốt qua đường, phong cấp,
 * stalemate, lặp lại 3 lần, thiếu lực lượng, nước bất hợp lệ, reset.
 */

import { ChessGame } from '../src/chess/chessEngine'

let failures = 0
function check(name: string, condition: boolean, extra = ''): void {
  if (!condition) failures++
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`)
}

function playSetup(game: ChessGame, moves: readonly (readonly [string, string])[]): void {
  for (const [from, to] of moves) {
    const record = game.tryMove(from, to)
    if (!record) throw new Error(`Nước setup thất bại: ${from}${to}`)
  }
}

// 1) Nhập thành cánh vua
{
  const game = new ChessGame()
  playSetup(game, [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5'],
  ])
  const record = game.tryMove('e1', 'g1')
  check('nhập thành cánh vua hợp lệ', record !== null && record.piece === 'king')
  const snap = game.getSnapshot()
  const king = snap.pieces.find((p) => p.type === 'king' && p.color === 'white')
  const rook = snap.pieces.find((p) => p.type === 'rook' && p.color === 'white' && p.square === 'f1')
  check('vua về g1, xe về f1', king?.square === 'g1' && !!rook)
  check('không nhập thành lần nữa', game.tryMove('e1', 'g1') === null)
}

// 2) Nhập thành cánh hậu
{
  const game = new ChessGame()
  playSetup(game, [
    ['d2', 'd4'], ['d7', 'd5'],
    ['b1', 'c3'], ['g8', 'f6'],
    ['c1', 'e3'], ['e7', 'e6'],
    ['d1', 'd2'], ['f8', 'e7'],
  ])
  const record = game.tryMove('e1', 'c1')
  check('nhập thành cánh hậu hợp lệ', record !== null && record.piece === 'king')
}

// 3) Bắt tốt qua đường
{
  const game = new ChessGame()
  playSetup(game, [
    ['e2', 'e4'], ['a7', 'a6'],
    ['e4', 'e5'], ['d7', 'd5'],
  ])
  const record = game.tryMove('e5', 'd6')
  check('bắt tốt qua đường được chấp nhận', record?.captured === 'pawn' && record.to === 'd6')
  const snap = game.getSnapshot()
  const pawnOnD6 = snap.pieces.find((p) => p.square === 'd6')
  const pawnOnD5 = snap.pieces.find((p) => p.square === 'd5')
  check('tốt đen ở d5 bị lấy, tốt trắng tới d6', !!pawnOnD6 && !pawnOnD5)
}

// 4) Phong cấp (bắt mã phong Hậu)
{
  const game = new ChessGame()
  playSetup(game, [
    ['h2', 'h4'], ['g7', 'g5'],
    ['h4', 'g5'], ['h7', 'h6'],
    ['g5', 'h6'], ['f7', 'f6'],
    ['h6', 'h7'], ['f6', 'f5'],
  ])
  const record = game.tryMove('h7', 'g8', 'queen')
  check('phong cấp Hậu (bắt mã) hợp lệ', record?.promotion === 'queen')
  const queen = game.getSnapshot().pieces.find((p) => p.square === 'g8')
  check('trên g8 là Hậu trắng', queen?.type === 'queen' && queen?.color === 'white')
}

// 5) Stalemate — thế trận hòa của Sam Loyd (10 nước)
{
  const game = new ChessGame()
  playSetup(game, [
    ['e2', 'e3'], ['a7', 'a5'],
    ['d1', 'h5'], ['a8', 'a6'],
    ['h5', 'a5'], ['h7', 'h5'],
    ['a5', 'c7'], ['a6', 'h6'],
    ['h2', 'h4'], ['f7', 'f6'],
    ['c7', 'd7'], ['e8', 'f7'],
    ['d7', 'b7'], ['d8', 'd3'],
    ['b7', 'b8'], ['d3', 'h7'],
    ['b8', 'c8'], ['f7', 'g6'],
    ['c8', 'e6'],
  ])
  const snap = game.getSnapshot()
  check(
    'stalemate → hòa, không bị chiếu',
    snap.result?.reason === 'stalemate' && snap.result.winner === null && !snap.inCheck,
  )
}

// 6) Lặp lại 3 lần
{
  const game = new ChessGame()
  playSetup(game, [
    ['g1', 'f3'], ['g8', 'f6'],
    ['f3', 'g1'], ['f6', 'g8'],
    ['g1', 'f3'], ['g8', 'f6'],
    ['f3', 'g1'], ['f6', 'g8'],
  ])
  const snap = game.getSnapshot()
  check('lặp lại 3 lần → hòa', snap.result?.reason === 'threefold-repetition')
}

// 7) Thiếu lực lượng (nạp FEN Vua vs Vua)
{
  const game = new ChessGame()
  const loaded = game.loadFen('8/8/4k3/8/8/4K3/8/8 w - - 0 1')
  const snap = game.getSnapshot()
  check('Vua vs Vua → hòa thiếu lực lượng', loaded && snap.result?.reason === 'insufficient-material')
}

// 8) loadFen với FEN sai
{
  const game = new ChessGame()
  const loaded = game.loadFen('đây không phải fen')
  check('loadFen sai → false, giữ vị trí đầu', !loaded && game.getFen().startsWith('rnbqkbnr'))
}

// 9) Nước bất hợp lệ + reset
{
  const game = new ChessGame()
  check('tốt đi 3 ô → null', game.tryMove('e2', 'e5') === null)
  check('đi sai mã quân → null', game.tryMove('e4', 'e5') === null)
  game.tryMove('e2', 'e4')
  game.reset()
  check(
    'reset về vị trí đầu',
    game.getFen().startsWith('rnbqkbnr/pppppppp') && game.getMoveHistory().length === 0,
  )
}

console.log(failures === 0 ? '\n✅ RULES: ALL PASSED' : `\n❌ RULES: ${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)
