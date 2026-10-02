import type { PieceType } from '../types/chess'

/**
 * Hệ piece sets: mỗi set là một style-preset áp lên glyph quân cờ hiện có
 * (fill / viền / shadow / gradient / glow). Thêm set mới = thêm 1 phần tử
 * vào registry — sau này muốn dùng SVG thật chỉ cần thay cách ChessPiece
 * render theo `id`, không đổi gì tầng trên.
 *
 * Ràng buộc: quân Trắng luôn fill sáng, quân Đen luôn fill tối
 * → không bao giờ mất khả năng phân biệt 2 bên.
 */

export type PieceSetId =
  | 'classic'
  | 'modern'
  | 'minimal'
  | 'glass'
  | '3d'
  | 'fantasy'
  | 'neon'
  | 'wooden'

export interface PieceStyle {
  /** Màu fill chính của glyph */
  fill: string
  /** Màu viền */
  stroke: string
  /** Độ dày viền (px) */
  strokeWidth: number
  /** text-shadow: drop shadow nhẹ tạo chiều sâu */
  shadow?: string
  /** Glow (text-shadow phát sáng) — dùng cho set neon/glass */
  glow?: string
  /** Gradient nhẹ 2 màu (background-clip: text) — dùng cho set 3d/fantasy/wooden */
  gradient?: [string, string]
}

export interface PieceSet {
  id: PieceSetId
  label: string
  white: PieceStyle
  black: PieceStyle
}

export const PIECE_SETS: Record<PieceSetId, PieceSet> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    white: {
      fill: '#f8fafc',
      stroke: '#334155',
      strokeWidth: 1.4,
      shadow: '0 2px 3px rgba(0, 0, 0, 0.35)',
    },
    black: {
      fill: '#1e293b',
      stroke: '#cbd5e1',
      strokeWidth: 1,
      shadow: '0 2px 3px rgba(0, 0, 0, 0.4)',
    },
  },
  modern: {
    id: 'modern',
    label: 'Modern',
    white: {
      fill: '#ffffff',
      stroke: '#0f172a',
      strokeWidth: 1.1,
      shadow: '0 3px 4px rgba(0, 0, 0, 0.35)',
    },
    black: {
      fill: '#111827',
      stroke: '#94a3b8',
      strokeWidth: 1.1,
      shadow: '0 3px 4px rgba(0, 0, 0, 0.45)',
    },
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    white: {
      fill: '#fafafa',
      stroke: '#78716c',
      strokeWidth: 0.6,
      shadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
    },
    black: {
      fill: '#292524',
      stroke: '#a8a29e',
      strokeWidth: 0.6,
      shadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    },
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    white: {
      fill: 'rgba(255, 255, 255, 0.85)',
      stroke: 'rgba(255, 255, 255, 0.95)',
      strokeWidth: 1,
      glow: '0 0 6px rgba(255, 255, 255, 0.45)',
    },
    black: {
      fill: 'rgba(15, 23, 42, 0.88)',
      stroke: 'rgba(203, 213, 225, 0.75)',
      strokeWidth: 1,
      glow: '0 0 6px rgba(148, 163, 184, 0.4)',
    },
  },
  '3d': {
    id: '3d',
    label: '3D',
    white: {
      fill: '#e7e5e4',
      stroke: '#44403c',
      strokeWidth: 1,
      gradient: ['#ffffff', '#c9c5c0'],
      shadow: '0 4px 3px rgba(0, 0, 0, 0.45)',
    },
    black: {
      fill: '#374151',
      stroke: '#0f172a',
      strokeWidth: 1,
      gradient: ['#566274', '#141c2b'],
      shadow: '0 4px 3px rgba(0, 0, 0, 0.5)',
    },
  },
  fantasy: {
    id: 'fantasy',
    label: 'Fantasy',
    white: {
      fill: '#f5edcf',
      stroke: '#7c5a1e',
      strokeWidth: 1,
      gradient: ['#fdf6e3', '#e2cd97'],
      shadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
    },
    black: {
      fill: '#2a1e3d',
      stroke: '#b79cd8',
      strokeWidth: 1,
      gradient: ['#3d2b57', '#191026'],
      shadow: '0 2px 4px rgba(0, 0, 0, 0.45)',
    },
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    white: {
      fill: '#ecfeff',
      stroke: '#22d3ee',
      strokeWidth: 0.9,
      glow: '0 0 7px rgba(34, 211, 238, 0.85)',
    },
    black: {
      fill: '#0f172a',
      stroke: '#e879f9',
      strokeWidth: 0.9,
      glow: '0 0 7px rgba(232, 121, 249, 0.8)',
    },
  },
  wooden: {
    id: 'wooden',
    label: 'Wooden',
    white: {
      fill: '#f0e2bd',
      stroke: '#6b4a24',
      strokeWidth: 1,
      gradient: ['#f5e7c8', '#d9bd82'],
      shadow: '0 2px 3px rgba(0, 0, 0, 0.35)',
    },
    black: {
      fill: '#3a2c1f',
      stroke: '#c8a878',
      strokeWidth: 1,
      gradient: ['#5d4632', '#291e15'],
      shadow: '0 2px 3px rgba(0, 0, 0, 0.4)',
    },
  },
}

export const PIECE_SET_LIST = Object.values(PIECE_SETS)

export const DEFAULT_PIECE_SET: PieceSetId = 'classic'

export function getPieceSet(id: string | undefined): PieceSet {
  if (id && id in PIECE_SETS) return PIECE_SETS[id as PieceSetId]
  return PIECE_SETS[DEFAULT_PIECE_SET]
}

/** Glyph hiển thị cho từng loại quân */
export const PIECE_SET_GLYPHS: Record<PieceType, string> = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟',
}
