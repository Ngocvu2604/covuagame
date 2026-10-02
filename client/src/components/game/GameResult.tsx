import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { COLOR_LABELS, END_REASON_LABELS } from '../../constants/game'
import type { GameResult as GameResultType } from '../../types/chess'

/** Tiêu đề lớn theo lý do kết thúc (thuật ngữ cờ tiếng Anh) */
const RESULT_TITLES: Record<GameResultType['reason'], string> = {
  checkmate: 'CHECKMATE',
  stalemate: 'STALEMATE',
  'threefold-repetition': 'DRAW',
  'fifty-move': 'DRAW',
  'insufficient-material': 'DRAW',
  resignation: 'RESIGNATION',
  timeout: 'TIME OUT',
  agreement: 'DRAW',
}

interface GameResultProps {
  result: GameResultType
  /** Tên hiển thị của bên thắng; null = hòa */
  winnerLabel: string | null
  onRematch: () => void
  onHome: () => void
}

/** Overlay kết thúc ván: kết quả, tỷ số và các hành động */
export function GameResult({ result, winnerLabel, onRematch, onHome }: GameResultProps) {
  const score =
    result.winner === 'white' ? '1 – 0' : result.winner === 'black' ? '0 – 1' : '½ – ½'

  return (
    <Modal>
      <div className="flex flex-col items-center text-center">
        <span aria-hidden className="text-5xl">
          {result.winner ? '🏆' : '🤝'}
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-widest text-slate-100">
          {RESULT_TITLES[result.reason]}
        </h2>
        <p className="mt-2 text-lg font-semibold text-gold">
          {winnerLabel ? `${winnerLabel} thắng!` : 'Hòa'}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {END_REASON_LABELS[result.reason]} · {score} ·{' '}
          {result.winner ? `${COLOR_LABELS[result.winner]} thắng` : 'hai bên bất phân thắng bại'}
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button variant="primary" fullWidth onClick={onRematch}>
            Chơi lại
          </Button>
          <Button variant="secondary" fullWidth onClick={onHome}>
            Về trang chủ
          </Button>
        </div>
      </div>
    </Modal>
  )
}
