import type { CSSProperties } from 'react'
import type { PieceOnSquare, SquareName } from '../../types/chess'
import { isLightSquare } from '../../chess/chessUtils'
import { ChessPiece } from './ChessPiece'
import { MoveIndicator } from './MoveIndicator'

interface ChessSquareProps {
  square: SquareName
  piece: PieceOnSquare | null
  isSelected: boolean
  isLegalTarget: boolean
  isLastMove: boolean
  isCheck: boolean
  /** Nước đi mới đến ô này: quân trượt từ vị trí % tương đối (x/y) */
  slideFrom?: { x: number; y: number }
  onSquareClick: (square: SquareName) => void
}

/** Một ô trên bàn cờ: nền, quân cờ, các highlight và xử lý click.
 * Màu nền lấy từ CSS variables --sq-light / --sq-dark (đặt trên ChessBoard). */
export function ChessSquare({
  square,
  piece,
  isSelected,
  isLegalTarget,
  isLastMove,
  isCheck,
  slideFrom,
  onSquareClick,
}: ChessSquareProps) {
  const squareClass = isLightSquare(square) ? 'bg-[var(--sq-light)]' : 'bg-[var(--sq-dark)]'
  const slideStyle: CSSProperties | undefined = slideFrom
    ? ({ '--slide-x': `${slideFrom.x}%`, '--slide-y': `${slideFrom.y}%` } as CSSProperties)
    : undefined

  return (
    <button
      type="button"
      data-square={square}
      aria-label={`${square}${piece ? ` ${piece.color} ${piece.type}` : ' empty'}`}
      onClick={() => onSquareClick(square)}
      className={`relative flex items-center justify-center ${squareClass} focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400`}
    >
      {isLastMove && (
        <span className="pointer-events-none absolute inset-0 animate-[fade-in_120ms_ease-out] bg-amber-300/45" />
      )}
      {isCheck && <span className="pointer-events-none absolute inset-0 animate-pulse bg-red-500/60" />}
      {isSelected && (
        <span className="pointer-events-none absolute inset-0 animate-[fade-in_100ms_ease-out] bg-emerald-400/55" />
      )}
      {isLegalTarget && <MoveIndicator variant={piece ? 'capture' : 'move'} />}
      {piece && (
        <span
          key={`${piece.color}-${piece.type}`}
          style={slideStyle}
          className={`flex ${slideFrom ? 'piece-slide' : ''}`}
        >
          <ChessPiece type={piece.type} color={piece.color} className="text-[10cqw]" />
        </span>
      )}
    </button>
  )
}
