import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { LastMove, MoveMode, PieceOnSquare, PlayerColor, SquareName } from '../../types/chess'
import { FILES, RANKS, getBoardTheme } from '../../constants/chess'
import { getViewPosition } from '../../chess/chessUtils'
import { useSettingsStore } from '../../state/settingsStore'
import { CheckIndicator } from './CheckIndicator'
import { ChessSquare } from './ChessSquare'

export interface SquareColors {
  light: string
  dark: string
}

interface ChessBoardProps {
  pieces: PieceOnSquare[]
  /** Góc nhìn: 'white' = phía Trắng ở dưới */
  orientation?: PlayerColor
  /** Ghi đè màu ô cờ (lấy từ settings nếu không truyền) */
  squareColors?: SquareColors
  selectedSquare: SquareName | null
  legalTargets: SquareName[]
  lastMove: LastMove | null
  /** Nước cuối là nước ăn quân → hiệu ứng ring tại ô đích */
  lastMoveIsCapture?: boolean
  checkSquare: SquareName | null
  /** Rê chuột qua một quân cờ (chỉ gọi với ô có quân, bàn đang tương tác) */
  onPieceHover?: (square: SquareName) => void
  /** Bắt đầu kéo một quân cờ (chỉ gọi với quân của người chơi đúng màu) */
  onDragStart?: (square: SquareName) => void
  /** Thả quân vào ô (chỉ gọi khi ô là đích hợp lệ) */
  onDrop?: (square: SquareName) => void
  /** Màu quân được phép kéo (null = không kéo được quân nào) */
  dragColor?: PlayerColor | null
  /** Chế độ di chuyển quân */
  moveMode?: MoveMode
  /** Chặn tương tác (khi ván đã kết thúc / tới lượt đối thủ) */
  disabled?: boolean
  onSquareClick: (square: SquareName) => void
}

/**
 * Bàn cờ 8x8: render 64 ô, tọa độ, highlight theo settings và theme.
 * Chỉ nhận dữ liệu đã xử lý qua props — không chứa logic AI/socket/room.
 */
export function ChessBoard({
  pieces,
  orientation = 'white',
  squareColors,
  selectedSquare,
  legalTargets,
  lastMove,
  lastMoveIsCapture = false,
  checkSquare,
  onPieceHover,
  onDragStart,
  onDrop,
  dragColor = null,
  moveMode = 'both',
  disabled = false,
  onSquareClick,
}: ChessBoardProps) {
  const storedTheme = useSettingsStore((s) => s.boardTheme)
  const pieceSet = useSettingsStore((s) => s.pieceSet)
  const showCoordinates = useSettingsStore((s) => s.showCoordinates)
  const showLegalMoves = useSettingsStore((s) => s.showLegalMoves)
  const showLastMove = useSettingsStore((s) => s.showLastMove)
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled)

  const theme = squareColors
    ? { ...getBoardTheme(storedTheme), light: squareColors.light, dark: squareColors.dark }
    : getBoardTheme(storedTheme)

  const pieceBySquare = useMemo(() => {
    const map = new Map<SquareName, PieceOnSquare>()
    for (const piece of pieces) map.set(piece.square, piece)
    return map
  }, [pieces])

  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse()
  const files = orientation === 'white' ? FILES : [...FILES].reverse()
  const squareColorVars = {
    '--sq-light': theme.light,
    '--sq-dark': theme.dark,
  } as CSSProperties

  // Hướng trượt của quân ở ô đích nước cuối (đúng theo góc nhìn hiện tại)
  const slideFrom = useMemo(() => {
    if (!lastMove || !animationsEnabled) return null
    const from = getViewPosition(lastMove.from, orientation)
    const to = getViewPosition(lastMove.to, orientation)
    return {
      square: lastMove.to,
      x: (from.col - to.col) * 100,
      y: (from.row - to.row) * 100,
    }
  }, [lastMove, orientation, animationsEnabled])

  return (
    <div
      style={{
        ...squareColorVars,
        boxShadow: `0 24px 60px -24px ${theme.glow}, 0 8px 24px -12px rgba(0, 0, 0, 0.6)`,
      }}
      className={`@container relative w-full max-w-[560px] overflow-hidden rounded-xl ring-1 ring-white/10 ${
        animationsEnabled ? '' : 'animations-off'
      }`}
    >
      {checkSquare && <CheckIndicator />}

      <div className="grid aspect-square w-full grid-cols-8 grid-rows-8">
        {ranks.map((rank, rowIndex) =>
          files.map((file, colIndex) => {
            const square: SquareName = `${file}${rank}`
            return (
              <ChessSquare
                key={square}
                square={square}
                piece={pieceBySquare.get(square) ?? null}
                pieceSet={pieceSet}
                isSelected={square === selectedSquare}
                isLegalTarget={!disabled && showLegalMoves && legalTargets.includes(square)}
                isLastMove={showLastMove && lastMove !== null && (square === lastMove.from || square === lastMove.to)}
                isCheck={square === checkSquare}
                slideFrom={slideFrom?.square === square ? { x: slideFrom.x, y: slideFrom.y } : undefined}
                captureKey={lastMoveIsCapture && lastMove?.to === square ? `cap-${lastMove.from}${lastMove.to}` : undefined}
                onPieceHover={onPieceHover ? () => onPieceHover(square) : undefined}
                onDragStart={onDragStart ? () => onDragStart(square) : undefined}
                onDrop={onDrop ? () => onDrop(square) : undefined}
                draggable={
                  !disabled &&
                  moveMode !== 'click' &&
                  dragColor !== null &&
                  pieceBySquare.get(square)?.color === dragColor
                }
                rankLabel={showCoordinates && colIndex === 0 ? rank : null}
                fileLabel={showCoordinates && rowIndex === 7 ? file.toUpperCase() : null}
                interactive={!disabled}
                onSquareClick={disabled ? () => undefined : onSquareClick}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
