import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { LastMove, MoveMode, PieceOnSquare, PlayerColor, SquareName } from '../../types/chess'
import { FILES, RANKS, getBoardTheme } from '../../constants/chess'
import { getViewPosition } from '../../chess/chessUtils'
import { useSettingsStore } from '../../state/settingsStore'
import { CheckIndicator } from './CheckIndicator'
import { ChessSquare } from './ChessSquare'
import { ChessPiece } from './ChessPiece'

export interface SquareColors {
  light: string
  dark: string
}


const DRAG_MOVE_THRESHOLD_PX = 6

interface DragState {
  from: SquareName
  /** Đã rời khỏi ô gốc quá ngưỡng jitter (phân biệt click vs kéo) */
  moved: boolean
  /** Ô này ĐÃ được chọn trước khi bắt đầu kéo */
  wasSelected: boolean
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
  /** Thả quân vào ô (chỉ gọi khi ô là đích hợp lệ; sai đích do hook tự xử lý) */
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
 * Bàn cờ 8x8: render 64 ô, tọa độ, highlight theo settings/theme và
 * kéo-thả quân bằng Pointer Events (ghost là quân sạch không nền, ô gốc
 * ẩn khi kéo, quân đang kéo rung nhẹ). Chỉ nhận dữ liệu qua props —
 * không chứa logic AI/socket/room.
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

  const boardRef = useRef<HTMLDivElement | null>(null)
  const floatingRef = useRef<HTMLDivElement | null>(null)
  const lastPointer = useRef({ x: 0, y: 0 })
  const [drag, setDrag] = useState<DragState | null>(null)

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

  function squareFromPoint(x: number, y: number): SquareName | null {
    const element = document.elementFromPoint(x, y)?.closest('[data-square]')
    return element ? (element.getAttribute('data-square') as SquareName) : null
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (disabled || event.button !== 0) return
    const square = squareFromPoint(event.clientX, event.clientY)
    if (!square) return

    const piece = pieceBySquare.get(square)
    const canDrag =
      moveMode !== 'click' && dragColor !== null && !!piece && piece.color === dragColor

    if (canDrag) {
      // Bắt đầu kéo: quân gốc ẩn, ghost quân sạch bám theo con trỏ.
      // Chọn quân nếu chưa chọn (hiện đích hợp lệ); nếu đã chọn thì giữ nguyên
      // để thả ra ngoài vẫn giữ selection, và click lần 2 mới bỏ chọn.
      lastPointer.current = { x: event.clientX, y: event.clientY }
      setDrag({ from: square, moved: false, wasSelected: selectedSquare === square })
      try {
        boardRef.current?.setPointerCapture(event.pointerId)
      } catch {
        /* bỏ qua */
      }
      if (selectedSquare !== square) onSquareClick(square)
      return
    }

    onSquareClick(square)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!drag) return
    const dx = event.clientX - lastPointer.current.x
    const dy = event.clientY - lastPointer.current.y
    if (!drag.moved && dx * dx + dy * dy > DRAG_MOVE_THRESHOLD_PX * DRAG_MOVE_THRESHOLD_PX) {
      setDrag((current) => (current ? { ...current, moved: true } : current))
    }
    lastPointer.current = { x: event.clientX, y: event.clientY }
    if (floatingRef.current) {
      floatingRef.current.style.left = `${event.clientX}px`
      floatingRef.current.style.top = `${event.clientY}px`
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!drag) return
    const finished = drag
    setDrag(null)

    const target = squareFromPoint(event.clientX, event.clientY)

    // Click (không kéo) vào chính quân đang chọn → bỏ chọn
    if (!finished.moved && target === finished.from) {
      if (finished.wasSelected) onSquareClick(finished.from)
      return
    }

    // Thả vào ô khác → hook tự xử lý: hợp lệ thì đi, sai thì bỏ chọn an toàn
    if (target && target !== finished.from) onDrop?.(target)
  }

  return (
    <div
      style={{
        ...squareColorVars,
        boxShadow: `0 24px 60px -24px ${theme.glow}, 0 8px 24px -12px rgba(0, 0, 0, 0.6)`,
      }}
      className={`@container relative w-full max-w-[640px] overflow-hidden rounded-xl ring-1 ring-white/10 ${
        animationsEnabled ? '' : 'animations-off'
      }`}
    >
      {checkSquare && <CheckIndicator />}

      <div
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
        className="grid aspect-square w-full touch-none select-none grid-cols-8 grid-rows-8"
      >
        {ranks.map((rank, rowIndex) =>
          files.map((file, colIndex) => {
            const square: SquareName = `${file}${rank}`
            const hidden = drag?.from === square
            return (
              <ChessSquare
                key={square}
                square={square}
                piece={hidden ? null : (pieceBySquare.get(square) ?? null)}
                pieceSet={pieceSet}
                isSelected={square === selectedSquare}
                isLegalTarget={!disabled && showLegalMoves && legalTargets.includes(square)}
                isLastMove={
                  showLastMove && lastMove !== null && (square === lastMove.from || square === lastMove.to)
                }
                isCheck={square === checkSquare}
                slideFrom={slideFrom?.square === square ? { x: slideFrom.x, y: slideFrom.y } : undefined}
                captureKey={
                  lastMoveIsCapture && lastMove?.to === square ? `cap-${lastMove.from}${lastMove.to}` : undefined
                }
                onPieceHover={onPieceHover ? () => onPieceHover(square) : undefined}
                rankLabel={showCoordinates && colIndex === 0 ? rank : null}
                fileLabel={showCoordinates && rowIndex === 7 ? file.toUpperCase() : null}
                interactive={!disabled}
              />
            )
          }),
        )}
      </div>

      {/* Quân đang kéo: ghost sạch bám con trỏ, rung nhẹ (mục "kéo mượt") */}
      {drag &&
        (() => {
          const piece = pieceBySquare.get(drag.from)
          if (!piece) return null
          const width = boardRef.current?.getBoundingClientRect().width ?? 560
          const size = width / 8
          return (
            <div
              ref={floatingRef}
              aria-hidden
              style={{
                position: 'fixed',
                left: `${lastPointer.current.x}px`,
                top: `${lastPointer.current.y}px`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 50,
              }}
              className="drag-wobble flex items-center justify-center"
            >
              <span style={{ fontSize: `${size * 0.82}px`, lineHeight: 1 }}>
                <ChessPiece type={piece.type} color={piece.color} pieceSet={pieceSet} />
              </span>
            </div>
          )
        })()}
    </div>
  )
}

