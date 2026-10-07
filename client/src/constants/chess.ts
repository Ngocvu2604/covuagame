import type { BoardThemeId, PieceType } from '../types/chess'

/** Vị trí ban đầu chuẩn của ván cờ */
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/**
 * Các giao diện màu bàn cờ. Thêm theme mới = thêm 1 phần tử vào đây
 * (id, label, màu ô sáng/tối, màu glow viền bàn cờ).
 */
export interface BoardTheme {
  id: BoardThemeId
  label: string
  light: string
  dark: string
  /** Màu glow nhẹ cho viền/shadow bàn cờ (rgba) */
  glow: string
}

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    light: '#f0d9b5',
    dark: '#b58863',
    glow: 'rgba(181, 136, 99, 0.35)',
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    light: '#ecd8ae',
    dark: '#a97e4f',
    glow: 'rgba(93, 69, 43, 0.55)',
  },
  green: {
    id: 'green',
    label: 'Green',
    light: '#eeeed2',
    dark: '#769656',
    glow: 'rgba(118, 150, 86, 0.4)',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    light: '#e2eaf5',
    dark: '#6d8fc4',
    glow: 'rgba(109, 143, 196, 0.4)',
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    light: '#e5d9f2',
    dark: '#7d5ba6',
    glow: 'rgba(125, 91, 166, 0.45)',
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    light: '#566175',
    dark: '#232c3b',
    glow: 'rgba(86, 97, 117, 0.35)',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    light: '#26334d',
    dark: '#161f33',
    glow: 'rgba(34, 211, 238, 0.35)',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    light: '#f4f4f5',
    dark: '#d4d4d8',
    glow: 'rgba(161, 161, 170, 0.35)',
  },
}

/** Danh sách theme theo thứ tự hiển thị */
export const BOARD_THEME_LIST = Object.values(BOARD_THEMES)

/** Theme mặc định + fallback khi setting đã lưu không còn hợp lệ */
export const DEFAULT_BOARD_THEME: BoardThemeId = 'wood'

export function getBoardTheme(id: string | undefined): BoardTheme {
  if (id && id in BOARD_THEMES) return BOARD_THEMES[id as BoardThemeId]
  return BOARD_THEMES[DEFAULT_BOARD_THEME]
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
