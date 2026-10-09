/**
 * Kiểm thử logic chọn âm thanh theo nước đi (pickMoveSound) + cấu trúc recipe.
 * Chạy: npm --prefix client run test:sound
 */
import { pickMoveSound, RECIPES as RECIPES_EXPORT } from '../src/services/soundService'
import type { MoveRecord } from '../src/types/chess'

let failed = 0
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected
  if (!ok) failed++
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'} — ${label}${ok ? '' : ` (expected ${expected}, got ${actual})`}`)
}

const move = (over: Partial<MoveRecord>): MoveRecord => ({
  san: 'x',
  from: 'e2',
  to: 'e4',
  color: 'white',
  piece: 'pawn',
  captured: null,
  promotion: null,
  ...over,
})

// Đi thường
check('đi thường → move', pickMoveSound(move({}), false), 'move')
// Ăn quân
check('ăn quân → capture', pickMoveSound(move({ captured: 'pawn' }), false), 'capture')
// Chiếu (ưu tiên trên ăn quân)
check('chiếu (kể cả khi ăn) → check', pickMoveSound(move({ captured: 'pawn' }), true), 'check')
// Nhập thành: vua đi ngang 2 cột
check('nhập thành → castle', pickMoveSound(move({ piece: 'king', from: 'e1', to: 'g1' }), false), 'castle')
check('vua đi 1 cột → move', pickMoveSound(move({ piece: 'king', from: 'e1', to: 'f1' }), false), 'move')
// Phong cấp
check('phong cấp → promote', pickMoveSound(move({ promotion: 'queen', from: 'e7', to: 'e8' }), false), 'promote')

// Mỗi sound đều có recipe hợp lệ. Các lớp phát TUẦN TỰ nên tổng gain không phải
// giới hạn âm lượng thật (MASTER_VOLUME 0.5 chặn) — ràng buộc đúng: mỗi lớp
// không chói + tổng có trần mềm.
for (const [name, recipe] of Object.entries(RECIPES_EXPORT)) {
  const peakLayer = Math.max(...recipe.map((s) => s.gain ?? 0.4))
  check(`recipe ${name}: mỗi lớp không chói (≤0.65)`, peakLayer <= 0.65, true)
  const total = recipe.reduce((sum, s) => sum + (s.gain ?? 0.4), 0)
  check(`recipe ${name}: tổng trần mềm (≤2.2)`, total <= 2.2, true)
  check(`recipe ${name}: có tối thiểu 1 lớp`, recipe.length >= 1, true)
}

// Cân bằng: ăn quân đậm hơn đi quân, chiếu dài ngân hơn
const peak = (r: { gain?: number }[]) => Math.max(...r.map((s) => s.gain ?? 0.4))
check('capture đậm hơn move', peak(RECIPES_EXPORT.capture) > peak(RECIPES_EXPORT.move), true)
const dur = (r: { duration: number }[]) => r.reduce((s, x) => Math.max(s, x.duration), 0)
check('check ngân dài hơn move', dur(RECIPES_EXPORT.check) > dur(RECIPES_EXPORT.move), true)

console.log(failed === 0 ? '\n✅ SOUND: ALL PASSED' : `\n❌ SOUND: ${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
