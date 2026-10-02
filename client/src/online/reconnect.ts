import { joinRoom } from './roomService'
import { getSocket } from './socketClient'
import { usePlayerStore } from '../state/playerStore'
import { useRoomStore } from '../state/roomStore'

/**
 * Tự động lấy lại chỗ khi socket kết nối lại (mất mạng, máy chủ restart).
 * Khi sự kiện 'connect' bắn ra và phiên phòng vẫn còn trong store
 * → gọi room:join; server nhận diện tên và trả lại chỗ ngồi cùng
 * state, đồng hồ và lịch sử chat (xử lý reconnect phía server mục 18).
 */
export function attachAutoRejoin(): () => void {
  const socket = getSocket()

  const onConnect = () => {
    const { room, yourColor } = useRoomStore.getState()
    const playerName = usePlayerStore.getState().name
    if (!room || !yourColor || !playerName) return

    void joinRoom(playerName, room.code)
      .then((ack) => {
        if (!ack.ok || !ack.room || !ack.color) return
        const store = useRoomStore.getState()
        store.setRoom(ack.room)
        store.setYourColor(ack.color)
        if (ack.state) store.setGameState(ack.state)
        store.setClock(ack.clock, Date.now())
        if (ack.chat) store.setChat(ack.chat)
      })
      .catch(() => undefined)
  }

  socket.on('connect', onConnect)
  return () => socket.off('connect', onConnect)
}
