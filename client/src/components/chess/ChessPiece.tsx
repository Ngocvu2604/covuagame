import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { PieceType, PlayerColor } from '../../types/chess'
import { getPieceSet } from '../../constants/pieceSets'
import type { PieceSetId } from '../../constants/pieceSets'

interface ChessPieceProps {
  type: PieceType
  color: PlayerColor
  /** Bộ quân cờ (mặc định classic) */
  pieceSet?: PieceSetId
  /** Kích thước qua font-size (svg tự co = 1em) + hiệu ứng bổ sung */
  className?: string
}

/**
 * Đường nét SVG của 6 loại quân — viewBox 100×100, đế đối xứng chung.
 * Tự vẽ (silhouette hình học, bo góc mềm) để hình dạng/tỷ lệ/tâm GIỐNG NHAU
 * trên mọi nền tảng — glyph Unicode phụ thuộc font của hệ điều hành
 * (trên iPhone quân tốt bị to, dẹt, lệch tâm so với bộ quân).
 */
const PIECE_PATHS: Record<PieceType, string> = {
  // Tốt: đầu tròn + thân loe + đế
  pawn: 'M50 13c7.7 0 14 6.3 14 14 0 4.6-2.3 8.7-5.8 11.2 8.9 2.8 15.8 11.4 15.8 21.8 0 5.4-1.9 10.4-5 14.3l5 7.7H25l5-7.7c-3.1-3.9-5-8.9-5-14.3 0-10.4 6.9-19 15.8-21.8C47.3 35.7 45 31.6 45 27c0-7.7 6.3-14 14-14z M18 86h64a4 4 0 0 1 4 4v4H14v-4a4 4 0 0 1 4-4z',
  // Xe: răng cưa + thân thắt + đế
  rook: 'M27 12h10v9h8v-9h10v9h8v-9h10v18l-5 5v31l6 6v8H26v-8l6-6V35l-5-5V12z M16 84h68a4 4 0 0 1 4 4v4H12v-4a4 4 0 0 1 4-4z',
  // Mã: đầu ngựa quay trái + tai + mắt + bờm
  knight:
    'M26 36c0-6 3.4-9.6 7.6-11l7.4-16 7.5 8.5C64 19 76 32 78 49c1.2 10 1.4 19 1 25H68c.5-5-.8-9-3.3-12-3.4 5.4-9 9.2-15.7 10.2L45 84H32c-1-17 3-29 12-37 2.6-2.3 3.6-5 3-8l-1.6-7L37 42c-6 2-11-1-11-6z M14 84h72a4 4 0 0 1 4 4v4H10v-4a4 4 0 0 1 4-4z',
  // Tượng: cầu nhỏ + mũ nhọn + khe chéo + đế
  bishop:
    'M44 15a6 6 0 1 1 12 0 6 6 0 1 1-12 0z M50 21c11 7 19 18 19 29 0 6.8-2.2 12.6-5.9 16.6l7.9 3.5c1.9.8 3 2.4 3 4.4V84H26v-8.9c0-2 1.1-3.6 3-4.4l7.9-3.5C33.2 63.6 31 57.8 31 51c0-11 8-22 19-30z M55.5 30 40 51h11l12-17.5z M16 84h68a4 4 0 0 1 4 4v4H12v-4a4 4 0 0 1 4-4z',
  // Hậu: vương miện 5 gai + 5 cầu ngọc + đai + đế
  queen:
    'M12 54 18 24 26 41 34 15 42 37 46.5 21 50 12 53.5 21 58 37 66 15 74 41 82 24 88 54c.9 3.3-1.3 6-4.8 6H16.8c-3.5 0-5.7-2.7-4.8-6z M18 19a4.2 4.2 0 1 1 .1 0z M34 9a4.2 4.2 0 1 1 .1 0z M50 5a4.2 4.2 0 1 1 .1 0z M66 9a4.2 4.2 0 1 1 .1 0z M82 19a4.2 4.2 0 1 1 .1 0z M17 60h66l-2 8H19l-2-8z M22 70h56l4 14H18l4-14z M16 84h68a4 4 0 0 1 4 4v4H12v-4a4 4 0 0 1 4-4z',
  // Vua: thánh giá + vòm + đế
  king:
    'M46 4h8v9h9v8h-9v9h-8v-9h-9v-8h9V4z M50 32c13.5 0 24 10.5 24 23.5 0 5.4-1.8 10.3-4.9 14.3l5.9 2.7c1.9.9 3 2.4 3 4.5V84H22v-7.5c0-2.1 1.1-3.6 3-4.5l5.9-2.7C27.9 65.8 26 61.2 26 55.5 26 42.5 36.5 32 50 32z M14 84h72a4 4 0 0 1 4 4v4H10v-4a4 4 0 0 1 4-4z',
}

/** Chi tiết vạch/khe vẽ đè bằng màu viền (gờ ngang, mắt mã) — stroke-only */
const PIECE_DETAILS: Partial<Record<PieceType, string>> = {
  pawn: 'M39.5 49h21',
  rook: 'M31 40h38',
  knight: 'M45 33a3 3 0 1 0 .1 0z M60 28c4.5 3.5 7 9 7.2 15',
  bishop: 'M35 62h30',
  queen: 'M28 76h44 M25 81h50',
  king: 'M31 60h38 M29 66h42',
}

/** Hiển thị một quân cờ bằng SVG vector — cùng hình dạng trên mọi thiết bị */
export function ChessPiece({ type, color, pieceSet = 'classic', className = '' }: ChessPieceProps) {
  const set = getPieceSet(pieceSet)
  const style = color === 'white' ? set.white : set.black
  const gradientId = useId()

  const svgStyle: CSSProperties = {
    // Hiệu ứng chiều sâu của từng bộ quân (shadow/glow) giữ nguyên qua CSS filter
    filter: style.glow ?? (style.shadow ? `drop-shadow(${style.shadow})` : undefined),
  }

  const fill = style.gradient ? `url(#${gradientId})` : style.fill
  const strokeProps = style.stroke
    ? { stroke: style.stroke, strokeWidth: style.strokeWidth * 2.2, strokeLinejoin: 'round' as const }
    : {}

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      style={{ width: '1em', height: '1em', ...svgStyle }}
      className={`pointer-events-none block select-none overflow-visible leading-none ${className}`}
    >
      {style.gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={style.gradient[0]} />
            <stop offset="1" stopColor={style.gradient[1]} />
          </linearGradient>
        </defs>
      )}
      <path d={PIECE_PATHS[type]} fill={fill} fillRule="evenodd" {...strokeProps} />
      {style.stroke && PIECE_DETAILS[type] && (
        <path
          d={PIECE_DETAILS[type]}
          fill={style.stroke}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth * 1.8}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
