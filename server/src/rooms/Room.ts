import type { PlayerColor } from '../types/game'
import type { PlayerPublicInfo, Room, RoomPublicData, ServerPlayer } from '../types/room'

/** Entity phòng + các hàm thuần thao tác trên phòng */

export function createRoom(params: {
  id: string
  code: string
  host: ServerPlayer
  timeMinutes: number | null
}): Room {
  return {
    id: params.id,
    code: params.code,
    players: [params.host],
    status: 'waiting',
    timeMinutes: params.timeMinutes,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    drawOfferedBy: null,
    rematchOfferedBy: null,
  }
}

export function toPublicData(room: Room): RoomPublicData {
  return {
    code: room.code,
    status: room.status,
    timeMinutes: room.timeMinutes,
    players: room.players.map(
      (player): PlayerPublicInfo => ({
        name: player.name,
        color: player.color,
        connected: player.connected,
      }),
    ),
  }
}

export function findPlayerBySocket(room: Room, socketId: string): ServerPlayer | undefined {
  return room.players.find((player) => player.socketId === socketId)
}

export function findPlayerByName(room: Room, name: string): ServerPlayer | undefined {
  return room.players.find((player) => player.name === name)
}

export function findOpponent(room: Room, color: PlayerColor): ServerPlayer | null {
  return room.players.find((player) => player.color !== color) ?? null
}

export function swapColors(room: Room): void {
  if (room.players.length === 2) {
    const [first, second] = room.players
    const temp = first.color
    first.color = second.color
    second.color = temp
  }
}

export function touch(room: Room): void {
  room.lastActivity = Date.now()
}
