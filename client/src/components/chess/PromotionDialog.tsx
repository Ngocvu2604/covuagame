import type { PieceType, PlayerColor } from '../../types/chess'
import { Modal } from '../common/Modal'
import { ChessPiece } from './ChessPiece'
import { useT } from '../../i18n/translations'

const PROMOTION_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight']

interface PromotionDialogProps {
  /** Màu của tốt được phong cấp */
  color: PlayerColor
  onSelect: (piece: PieceType) => void
  onCancel: () => void
}

/** Hộp thoại chọn quân phong cấp khi tốt đi tới cuối bàn */
export function PromotionDialog({ color, onSelect, onCancel }: PromotionDialogProps) {
  const t = useT()
  return (
    <Modal onClose={onCancel}>
      <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-slate-300">
        {t('promo.title')}
      </h2>

      <div className="flex justify-center gap-2">
        {PROMOTION_PIECES.map((type) => (
          <button
            key={type}
            type="button"
            aria-label={type}
            onClick={() => onSelect(type)}
            className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 transition hover:bg-emerald-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ChessPiece type={type} color={color} className="text-4xl" />
          </button>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline"
        >
          {t('promo.cancel')}
        </button>
      </div>
    </Modal>
  )
}
