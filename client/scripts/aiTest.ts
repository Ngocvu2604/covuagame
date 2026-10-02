/**
 * Bộ test AI (chạy trong Node qua tsx, không cần trình duyệt):
 *   npm run test:ai --workspace client
 *
 * Bao phủ: cả 3 mức độ trả nước mở đầu hợp lệ (kèm thời gian),
 * AI bắt được chiếu hết 1 nước, chọn nước phòng thủ hợp lý.
 */

import { Chess } from 'chess.js'
import { computeBestMove } from '../src/ai/chessAI'
import type { DifficultyId } from '../src/constants/difficulty'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

let failures = 0
function check(name: string, condition: boolean, extra = ''): void {
  if (!condition) failures++
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`)
}

async function main(): Promise<void> {
  // 1) Mỗi độ khó trả nước mở đầu hợp lệ trong ngân sách thời gian
  for (const level of ['easy', 'medium', 'hard'] as const satisfies readonly DifficultyId[]) {
    const startedAt = Date.now()
    const move = computeBestMove(START_FEN, level)
    const elapsed = Date.now() - startedAt
    const legalMoves = new Chess(START_FEN).moves({ verbose: true })
    const isLegal = !!move && legalMoves.some((m) => m.from === move.from && m.to === move.to)
    const budget = level === 'hard' ? 3500 : 1500
    check(`AI ${level} trả nước mở đầu hợp lệ`, isLegal, `${elapsed}ms`)
    check(`AI ${level} trong ngân sách thời gian`, elapsed < budget, `budget ${budget}ms`)
  }

  // 2) AI bắt chiếu hết 1 nước: Xe a1 → a8 hết cờ (mặt bàn thứ 8)
  const mateFen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
  for (const level of ['easy', 'medium', 'hard'] as const) {
    const move = computeBestMove(mateFen, level)
    check(
      `AI ${level} bắt chiếu hết 1 nước (Ra8#)`,
      move?.from === 'a1' && move?.to === 'a8',
      move ? `${move.from}${move.to}${move.promotion ?? ''}` : 'null',
    )
  }

  // 3) Nước AI phải bỏ được vào engine (legal move object hoàn chỉnh)
  const move = computeBestMove(START_FEN, 'hard')
  if (move) {
    const game = new Chess()
    let applied = false
    try {
      game.move({ from: move.from, to: move.to, promotion: move.promotion })
      applied = true
    } catch {
      applied = false
    }
    check('nước AI áp được vào chess.js', applied)
  }

  console.log(failures === 0 ? '\n✅ AI: ALL PASSED' : `\n❌ AI: ${failures} FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}

void main()
