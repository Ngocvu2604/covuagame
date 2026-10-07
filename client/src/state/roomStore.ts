import { create } from 'zustand'
import type { GameState, PlayerColor } from '../types/chess'
import type { ChatMessage, RoomPublicData } from '../types/room'
import type { ClockInfo, JoinAckData } from '../types/socket'

// Debug trên dev: đọc state phòng từ console (window.__roomStore.getState())
if (import.meta.env.DEV) {
  ;(window as unknown as { __roomStore?: unknown }).__roomStore = undefined
}

/** Ảnh chụp đồng hồ từ server kèm thời điểm nhận — client nội suy hiển thị */
export interface ClockSnapshot {
  whiteMs: number
  blackMs: number
  receivedAt: number
}

const MAX_CHAT_MESSAGES = 50

/** localStorage key lưu code phòng đang chơi — dùng khôi phục sau refresh */
export const ACTIVE_ROOM_KEY = "chess-arena:active-room"

export function getActiveRoomCode(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ROOM_KEY)
  } catch {
    return null
  }
}

export function clearActiveRoom(): void {
  try {
    localStorage.removeItem(ACTIVE_ROOM_KEY)
  } catch {
    /* bỏ qua */
  }
}

/**
 * Trạng thái phiên chơi Online — dữ liệu đều đến từ server,
 * client không tự quyết định luật chơi.
 */

interface RoomStore {
  room: RoomPublicData | null
  yourColor: PlayerColor | null
  gameState: GameState | null
  clock: ClockSnapshot | null
  /** Bên đang đề nghị hòa (nếu có) */
  drawOfferFrom: PlayerColor | null
  /** Bên đang mời chơi lại (nếu có) */
  rematchOfferFrom: PlayerColor | null
  /** Tin nhắn chat của phiên hiện tại */
  chatMessages: ChatMessage[]

  setRoom: (room: RoomPublicData) => void
  setYourColor: (color: PlayerColor) => void
  setGameState: (state: GameState) => void
  setClock: (clock: ClockInfo | null | undefined, receivedAt: number) => void
  setDrawOffer: (from: PlayerColor | null) => void
  setRematchOffer: (from: PlayerColor | null) => void
  appendChat: (message: ChatMessage) => void
  setChat: (messages: ChatMessage[]) => void
  /** Nạp kết quả create/join room (dùng chung lobby + invite link) */
  applyJoin: (ack: JoinAckData | { ok: true; room: RoomPublicData; color: PlayerColor; state?: GameState | null; clock?: ClockInfo | null; chat?: ChatMessage[] }) => void
  reset: () => void
}

export const useRoomStore = create<RoomStore>()((set) => ({
  room: null,
  yourColor: null,
  gameState: null,
  clock: null,
  drawOfferFrom: null,
  rematchOfferFrom: null,
  chatMessages: [],

  setRoom: (room) => set({ room }),
  setYourColor: (yourColor) => set({ yourColor }),
  setGameState: (gameState) => set({ gameState }),
  setClock: (clock, receivedAt) =>
    set({ clock: clock ? { ...clock, receivedAt } : null }),
  setDrawOffer: (drawOfferFrom) => set({ drawOfferFrom }),
  setRematchOffer: (rematchOfferFrom) => set({ rematchOfferFrom }),
  appendChat: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-(MAX_CHAT_MESSAGES - 1)), message],
    })),
  setChat: (chatMessages) => set({ chatMessages: chatMessages.slice(-MAX_CHAT_MESSAGES) }),
  applyJoin: (ack) => {
    if (!ack.ok || !ack.room || !ack.color) return
    const payload = ack as Extract<typeof ack, { ok: true }>
    // Lưu code để khôi phục phiên qua refresh (mục 12) — xoá ở reset/leave
    try {
      localStorage.setItem(ACTIVE_ROOM_KEY, payload.room.code)
    } catch {
      /* localStorage không khả dụng */
    }
    set({
      room: payload.room,
      yourColor: payload.color,
      gameState: payload.state ?? null,
      clock: payload.clock ? { ...payload.clock, receivedAt: Date.now() } : null,
      drawOfferFrom: null,
      rematchOfferFrom: null,
      chatMessages: payload.chat?.slice(-MAX_CHAT_MESSAGES) ?? [],
    })
  },
  reset: () => {
    try {
      localStorage.removeItem(ACTIVE_ROOM_KEY)
    } catch {
      /* bỏ qua */
    }
    set({
      room: null,
      yourColor: null,
      gameState: null,
      clock: null,
      drawOfferFrom: null,
      rematchOfferFrom: null,
      chatMessages: [],
    })
  },
}))

if (import.meta.env.DEV) {
  ;(window as unknown as { __roomStore: typeof useRoomStore }).__roomStore = useRoomStore
}
