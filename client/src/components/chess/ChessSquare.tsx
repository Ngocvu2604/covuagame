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
  onSquareClick,
}: ChessSquareProps) {
  const squareClass = isLightSquare(square) ? 'bg-[var(--sq-light)]' : 'bg-[var(--sq-dark)]'

  return (
    <button
      type="button"
      data-square={square}
      aria-label={`${square}${piece ? ` ${piece.color} ${piece.type}` : ' empty'}`}
      onClick={() => onSquareClick(square)}
      className={`relative flex items-center justify-center ${squareClass} focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400`}
    >
      {isLastMove && <span className="pointer-events-none absolute inset-0 bg-amber-300/45" />}
      {isCheck && <span className="pointer-events-none absolute inset-0 animate-pulse bg-red-500/60" />}
      {isSelected && <span className="pointer-events-none absolute inset-0 bg-emerald-400/55" />}
      {isLegalTarget && <MoveIndicator variant={piece ? 'capture' : 'move'} />}
      {piece && <ChessPiece type={piece.type} color={piece.color} className="text-[10cqw]" />}
    </button>
  )
}
