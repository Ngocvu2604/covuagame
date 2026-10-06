import type { CSSProperties } from 'react'
import type { PieceOnSquare, SquareName } from '../../types/chess'
import type { PieceSetId } from '../../constants/pieceSets'
import { isLightSquare } from '../../chess/chessUtils'
import { ChessPiece } from './ChessPiece'
import { MoveIndicator } from './MoveIndicator'

interface ChessSquareProps {
  square: SquareName
  piece: PieceOnSquare | null
  pieceSet: PieceSetId
  isSelected: boolean
  isLegalTarget: boolean
  isLastMove: boolean
  isCheck: boolean
  slideFrom?: { x: number; y: number }
  /** Nước cuối là nước ăn quân → hiệu ứng ring tại ô đích */
  captureKey?: string
  /** Rê chuột vào quân cờ trên ô này (chỉ gọi khi ô có quân và ô đang tương tác) */
  onPieceHover?: () => void
  /** Nhãn tọa độ hiển thị trong ô (hàng dọc bên trái / hàng ngang dưới) */
  rankLabel?: string | null
  fileLabel?: string | null
  interactive: boolean
}

/** Một ô trên bàn cờ: nền, quân cờ, tọa độ, các highlight và xử lý click.
 * Màu nền lấy từ CSS variables --sq-light / --sq-dark (đặt trên ChessBoard). */
export function ChessSquare({
  square,
  piece,
  pieceSet,
  isSelected,
  isLegalTarget,
  isLastMove,
  isCheck,
  slideFrom,
  captureKey,
  onPieceHover,
  rankLabel,
  fileLabel,
  interactive,
}: ChessSquareProps) {
  const light = isLightSquare(square)
  const squareClass = light ? 'bg-[var(--sq-light)]' : 'bg-[var(--sq-dark)]'
  const slideStyle: CSSProperties | undefined = slideFrom
    ? ({ '--slide-x': `${slideFrom.x}%`, '--slide-y': `${slideFrom.y}%` } as CSSProperties)
    : undefined
  const labelColor = light ? 'text-black/45' : 'text-white/60'

  return (
    <button
      type="button"
      data-square={square}
      aria-label={`${square}${piece ? ` ${piece.color} ${piece.type}` : ' empty'}`}
      onMouseEnter={() => {
        if (piece && interactive) onPieceHover?.()
      }}
      className={`group relative flex items-center justify-center ${squareClass} focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 ${
        interactive && piece ? 'square-interactive' : ''
      }`}
    >
      {isLastMove && (
        <span className="pointer-events-none absolute inset-0 animate-[fade-in_120ms_ease-out] bg-amber-300/45" />
      )}
      {isCheck && <span className="pointer-events-none absolute inset-0 animate-pulse bg-red-500/60" />}
      {isSelected && (
        <span className="pointer-events-none absolute inset-0 animate-[fade-in_100ms_ease-out] bg-emerald-400/55" />
      )}
      {captureKey && isLastMove && (
        <span key={captureKey} className="capture-ring pointer-events-none absolute inset-0" />
      )}
      {isLegalTarget && <MoveIndicator variant={piece ? 'capture' : 'move'} />}

      {rankLabel && (
        <span
          aria-hidden
          className={`pointer-events-none absolute left-1 top-0.5 z-10 select-none text-[9px] font-bold sm:text-[10px] ${labelColor}`}
        >
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-0 right-1 z-10 select-none text-[9px] font-bold sm:text-[10px] ${labelColor}`}
        >
          {fileLabel}
        </span>
      )}

      {piece && (
        <span
          key={`${piece.color}-${piece.type}`}
          style={slideStyle}
          className={`flex ${slideFrom ? 'piece-slide' : ''} ${isCheck ? 'piece-shake' : ''}`}
        >
          <ChessPiece
            type={piece.type}
            color={piece.color}
            pieceSet={pieceSet}
            className="text-[10cqw] transition-transform duration-150 ease-out group-hover:-translate-y-[4px] group-hover:drop-shadow-[0_5px_4px_rgba(0,0,0,0.4)]"
          />
        </span>
      )}
    </button>
  )
}
