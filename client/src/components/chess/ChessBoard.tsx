import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { LastMove, PieceOnSquare, PlayerColor, SquareName } from '../../types/chess'
import { FILES, RANKS } from '../../constants/chess'
import { CheckIndicator } from './CheckIndicator'
import { ChessSquare } from './ChessSquare'

export interface SquareColors {
  light: string
  dark: string
}

const DEFAULT_SQUARE_COLORS: SquareColors = { light: '#ebecd0', dark: '#779556' }

interface ChessBoardProps {
  pieces: PieceOnSquare[]
  /** Góc nhìn: 'white' = phía Trắng ở dưới */
  orientation?: PlayerColor
  /** Màu ô cờ theo theme cài đặt */
  squareColors?: SquareColors
  selectedSquare: SquareName | null
  legalTargets: SquareName[]
  lastMove: LastMove | null
  checkSquare: SquareName | null
  /** Chặn tương tác (khi ván đã kết thúc / tới lượt đối thủ) */
  disabled?: boolean
  onSquareClick: (square: SquareName) => void
}

/**
 * Bàn cờ 8x8: render 64 ô, hiển thị quân cờ và các highlight.
 * Chỉ nhận dữ liệu đã xử lý qua props — không chứa logic AI/socket/room.
 */
export function ChessBoard({
  pieces,
  orientation = 'white',
  squareColors = DEFAULT_SQUARE_COLORS,
  selectedSquare,
  legalTargets,
  lastMove,
  checkSquare,
  disabled = false,
  onSquareClick,
}: ChessBoardProps) {
  const pieceBySquare = useMemo(() => {
    const map = new Map<SquareName, PieceOnSquare>()
    for (const piece of pieces) map.set(piece.square, piece)
    return map
  }, [pieces])

  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse()
  const files = orientation === 'white' ? FILES : [...FILES].reverse()
  const squareColorVars = {
    '--sq-light': squareColors.light,
    '--sq-dark': squareColors.dark,
  } as CSSProperties

  return (
    <div
      style={squareColorVars}
      className="@container relative w-full max-w-[560px] overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
    >
      {checkSquare && <CheckIndicator />}

      <div className="grid aspect-square w-full grid-cols-8 grid-rows-8">
        {ranks.map((rank) =>
          files.map((file) => {
            const square: SquareName = `${file}${rank}`
            return (
              <ChessSquare
                key={square}
                square={square}
                piece={pieceBySquare.get(square) ?? null}
                isSelected={square === selectedSquare}
                isLegalTarget={!disabled && legalTargets.includes(square)}
                isLastMove={lastMove !== null && (square === lastMove.from || square === lastMove.to)}
                isCheck={square === checkSquare}
                onSquareClick={disabled ? () => undefined : onSquareClick}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
