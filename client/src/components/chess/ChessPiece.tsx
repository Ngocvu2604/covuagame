import type { CSSProperties } from 'react'
import type { PieceType, PlayerColor } from '../../types/chess'
import { getPieceSet, PIECE_SET_GLYPHS } from '../../constants/pieceSets'
import type { PieceSetId } from '../../constants/pieceSets'
import { PIECE_FONT_STACK } from '../../constants/chess'

interface ChessPieceProps {
  type: PieceType
  color: PlayerColor
  /** Bộ quân cờ (mặc định classic) */
  pieceSet?: PieceSetId
  /** Kích thước và style bổ sung, ví dụ 'text-[10cqw]' */
  className?: string
}

/** Hiển thị một quân cờ bằng glyph Unicode được style theo Piece Set */
export function ChessPiece({ type, color, pieceSet = 'classic', className = '' }: ChessPieceProps) {
  const set = getPieceSet(pieceSet)
  const style = color === 'white' ? set.white : set.black

  const inlineStyle: CSSProperties = {
    fontFamily: PIECE_FONT_STACK,
    ...(style.gradient
      ? {
          backgroundImage: `linear-gradient(165deg, ${style.gradient[0]}, ${style.gradient[1]})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }
      : { color: style.fill }),
    WebkitTextStroke: `${style.strokeWidth}px ${style.stroke}`,
    textShadow: style.glow ?? style.shadow,
  }

  return (
    <span aria-hidden style={inlineStyle} className={`pointer-events-none select-none leading-none ${className}`}>
      {PIECE_SET_GLYPHS[type]}
    </span>
  )
}
