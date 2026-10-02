import type { BoardThemeId, PieceType } from '../types/chess'

/** Vị trí ban đầu chuẩn của ván cờ */
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Các giao diện màu bàn cờ */
export const BOARD_THEMES: Record<BoardThemeId, { id: BoardThemeId; label: string; light: string; dark: string }> = {
  classic: { id: 'classic', label: 'Cổ điển', light: '#ebecd0', dark: '#779556' },
  ocean: { id: 'ocean', label: 'Đại dương', light: '#dee3e6', dark: '#788a94' },
  walnut: { id: 'walnut', label: 'Gỗ óc chó', light: '#e6c9a3', dark: '#8b5f3d' },
}

/** Các cột theo thứ tự trái → phải khi nhìn từ phía Trắng */
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

/** Các hàng theo thứ tự trên → dưới khi nhìn từ phía Trắng (rank 8 ở trên cùng) */
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

/**
 * Glyph Unicode của quân cờ — dùng chung một bộ glyph "đậm" cho cả hai màu,
 * phân biệt màu bằng CSS (fill + text-stroke) để hiển thị đồng nhất.
 */
export const PIECE_GLYPHS: Record<PieceType, string> = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟',
}

/** Font có glyph cờ vua trên đa số hệ điều hành */
export const PIECE_FONT_STACK =
  "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', 'Arial Unicode MS', sans-serif"
