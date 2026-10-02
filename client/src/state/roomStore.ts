import { create } from 'zustand'
import type { GameState, PlayerColor } from '../types/chess'
import type { ChatMessage, RoomPublicData } from '../types/room'
import type { ClockInfo } from '../types/socket'

/** Ảnh chụp đồng hồ từ server kèm thời điểm nhận — client nội suy hiển thị */
export interface ClockSnapshot {
  whiteMs: number
  blackMs: number
  receivedAt: number
}

const MAX_CHAT_MESSAGES = 50

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
  reset: () =>
    set({
      room: null,
      yourColor: null,
      gameState: null,
      clock: null,
      drawOfferFrom: null,
      rematchOfferFrom: null,
      chatMessages: [],
    }),
}))
