import { PIECE_FONT_STACK, PIECE_GLYPHS } from '../../constants/chess'
import type { PieceType, PlayerColor } from '../../types/chess'

interface ChessPieceProps {
  type: PieceType
  color: PlayerColor
  /** Kích thước và style bổ sung, ví dụ 'text-[10cqw]' */
  className?: string
}

/** Hiển thị một quân cờ bằng glyph Unicode, tô màu bằng CSS */
export function ChessPiece({ type, color, className = '' }: ChessPieceProps) {
  const colorClass =
    color === 'white'
      ? 'text-slate-50 [-webkit-text-stroke:1.5px_#312e2b]'
      : 'text-slate-900 [-webkit-text-stroke:1px_#d6d3d1]'

  return (
    <span
      aria-hidden
      style={{ fontFamily: PIECE_FONT_STACK }}
      className={`pointer-events-none select-none leading-none drop-shadow-sm ${colorClass} ${className}`}
    >
      {PIECE_GLYPHS[type]}
    </span>
  )
}
