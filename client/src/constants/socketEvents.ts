/**
 * Tên sự kiện Socket.IO phía client — mirror của server/src/types/socket.ts.
 * Hai package tách biệt nên giữ bản sao đồng bộ (theo kiến trúc spec mục 28).
 */

export const SOCKET_EVENTS = {
  // Phòng
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATED: 'room:updated',
  // Kết nối người chơi
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',
  // Ván đấu
  GAME_STARTED: 'game:started',
  GAME_MOVE: 'game:move',
  GAME_MOVE_APPLIED: 'game:move:applied',
  GAME_OVER: 'game:over',
  GAME_RESIGN: 'game:resign',
  GAME_DRAW_OFFER: 'game:draw:offer',
  GAME_DRAW_ACCEPT: 'game:draw:accept',
  GAME_DRAW_DECLINE: 'game:draw:decline',
  GAME_DRAW_OFFERED: 'game:draw:offered',
  GAME_DRAW_DECLINED: 'game:draw:declined',
  GAME_REMATCH_OFFER: 'game:rematch:offer',
  GAME_REMATCH_ACCEPT: 'game:rematch:accept',
  GAME_REMATCH_OFFERED: 'game:rematch:offered',
  GAME_REMATCH_DECLINE: 'game:rematch:decline',
  GAME_REMATCH_DECLINED: 'game:rematch:declined',
  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
} as const
