import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { useT } from '../../i18n/translations'
import type { GameResult as GameResultType, GameEndReason } from '../../types/chess'

/** Tiêu đề lớn theo lý do kết thúc (thuật ngữ cờ tiếng Anh — dùng chung mọi ngôn ngữ) */
const RESULT_TITLES: Record<GameEndReason, string> = {
  checkmate: 'CHECKMATE',
  stalemate: 'STALEMATE',
  'threefold-repetition': 'DRAW',
  'fifty-move': 'DRAW',
  'insufficient-material': 'DRAW',
  resignation: 'RESIGNATION',
  left: 'LEFT',
  abandoned: 'DISCONNECTED',
  timeout: 'TIME OUT',
  agreement: 'DRAW',
}

interface GameResultProps {
  result: GameResultType
  /** Tên hiển thị của bên thắng; null = hòa */
  winnerLabel: string | null
  /** Nhãn nút chơi lại (online: "Mời chơi lại" với luồng đề nghị) */
  rematchLabel?: string
  rematchDisabled?: boolean
  onRematch: () => void
  onHome: () => void
}

/** Overlay kết thúc ván: kết quả, tỷ số và các hành động */
export function GameResult({ result, winnerLabel, rematchLabel, rematchDisabled = false, onRematch, onHome }: GameResultProps) {
  const t = useT()
  const score =
    result.winner === 'white' ? '1 – 0' : result.winner === 'black' ? '0 – 1' : '½ – ½'
  const winnerSuffix = result.winner
    ? `${result.winner === 'white' ? t('game.white') : t('game.black')} ${t('result.wins')}`
    : t('result.drawTitle')

  return (
    <Modal>
      <div className="flex flex-col items-center text-center">
        <span aria-hidden className="text-5xl">
          {result.winner ? '🏆' : '🤝'}
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-widest text-slate-100">
          {RESULT_TITLES[result.reason]}
        </h2>
        <p className="mt-2 text-lg font-semibold text-gold">{winnerLabel ?? t('result.drawTitle')}</p>
        <p className="mt-1 text-sm text-slate-400">
          {t(`reason.${result.reason}`)} · {score} ·{' '}
          {result.winner ? winnerSuffix : ''}
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button variant="primary" fullWidth onClick={onRematch} disabled={rematchDisabled}>
            {rematchLabel ?? t('result.rematch')}
          </Button>
          <Button variant="secondary" fullWidth onClick={onHome}>
            {t('result.home')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
