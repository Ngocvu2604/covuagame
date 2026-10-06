import { ID, Permission, Query, Role } from 'appwrite'
import type { CreateAckData, JoinAckData } from '../../types/socket'
import type { GameState, PlayerColor } from '../../types/chess'
import {
  DATABASE_ID,
  ensureAnonymousSession,
  getAppwrite,
  MOVES_COLLECTION_ID,
  ROOMS_COLLECTION_ID,
} from './client'
import { clockFromDoc, toRoomPublicData } from './documents'
import type { MoveDocument, RoomDocument } from './documents'
import { deriveGameState, replayMoves } from './stateReplay'
import { generateRoomCode } from '../../utils/generateRoomCode'

/**
 * Quản lý vòng đời phòng trên Appwrite:
 * - create: tạo document `rooms` với ghế của người tạo theo colorChoice
 * - join:   tìm phòng theo code → vào ghế còn trống, hoặc lấy lại ghế cũ
 *           khi mình đã là chủ phòng (reconnect — đúng màu, đúng trạng thái)
 * - leave:  đang chơi → xử thua; đang chờ → đánh dấu phòng abandoned
 *
 * Màu quân KHÔNG do client khai báo — được suy ra từ anonymousUserId
 * đối chiếu whitePlayerId / blackPlayerId của document (mục 14).
 */

function initialClockMs(timeMinutes: number | null): number {
  return timeMinutes === null ? 0 : timeMinutes * 60_000
}

async function findRoomByCode(code: string): Promise<RoomDocument | null> {
  const { databases } = getAppwrite()
  const result = await databases.listDocuments(DATABASE_ID, ROOMS_COLLECTION_ID, [
    Query.equal('code', code),
    Query.limit(2),
  ])
  return (result.documents[0] as unknown as RoomDocument | undefined) ?? null
}

export interface AppwriteRoomInput {
  playerName: string
  colorChoice: 'white' | 'black' | 'random'
  timeMinutes: number | null
}

/** Tạo phòng mới; trả về ack kèm document phòng + màu của người tạo */
export async function createAppwriteRoom(input: AppwriteRoomInput): Promise<CreateAckData & { roomDoc?: RoomDocument }> {
  const userId = await ensureAnonymousSession()
  const { databases } = getAppwrite()

  const color: PlayerColor =
    input.colorChoice === 'random'
      ? Math.random() < 0.5
        ? 'white'
        : 'black'
      : input.colorChoice

  // Sinh mã không trùng (mã 6 ký tự khó trùng — thử tối đa 5 lần)
  let code = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRoomCode(() => false)
    const existing = await findRoomByCode(candidate)
    if (!existing) {
      code = candidate
      break
    }
  }
  if (!code) return { ok: false, error: 'INVALID_CODE' }

  const now = Date.now()
  const doc = await databases.createDocument(
    DATABASE_ID,
    ROOMS_COLLECTION_ID,
    ID.unique(),
    {
      code,
      status: 'waiting',
      timeMinutes: input.timeMinutes ?? 0,
      whitePlayerId: color === 'white' ? userId : '',
      whitePlayerName: color === 'white' ? input.playerName : '',
      blackPlayerId: color === 'black' ? userId : '',
      blackPlayerName: color === 'black' ? input.playerName : '',
      whiteMs: initialClockMs(input.timeMinutes),
      blackMs: initialClockMs(input.timeMinutes),
      turnStartedAt: 0,
      turn: 'white',
      gameNumber: 1,
      winner: '',
      resultReason: '',
      drawOfferedBy: '',
      rematchOfferedBy: '',
      whiteLastSeenAt: now,
      blackLastSeenAt: now,
    },
    // đọc/ghi: mọi session đã xác thực — tính toàn vẹn nước đi được bảo vệ
    // bởi lớp replay (stateReplay.ts), không phải bởi quyền ghi document
    [Permission.read(Role.users()), Permission.write(Role.users())],
  )

  const roomDoc = doc as unknown as RoomDocument
  return { ok: true, room: toRoomPublicData(roomDoc), color, roomDoc }
}

/** Tham gia phòng theo code (hoặc reconnect về đúng ghế cũ) */
export async function joinAppwriteRoom(playerName: string, code: string): Promise<JoinAckData> {
  const userId = await ensureAnonymousSession()
  const { databases } = getAppwrite()

  const roomDoc = await findRoomByCode(code)
  if (!roomDoc) return { ok: false, error: 'ROOM_NOT_FOUND' }

  // Reconnect: mình đã là một ghế trong phòng → lấy lại nguyên trạng thái
  if (userId === roomDoc.whitePlayerId || userId === roomDoc.blackPlayerId) {
    return finishJoin(roomDoc, userId === roomDoc.whitePlayerId ? 'white' : 'black')
  }

  if (roomDoc.status === 'finished' || roomDoc.status === 'abandoned') {
    return { ok: false, error: 'ROOM_FINISHED' }
  }
  if (roomDoc.blackPlayerId.length > 0) {
    return { ok: false, error: 'ROOM_FULL' }
  }

  const doc = await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, roomDoc.$id, {
    blackPlayerId: userId,
    blackPlayerName: playerName,
    status: 'playing',
    turnStartedAt: Date.now(),
    whiteLastSeenAt: Date.now(),
    blackLastSeenAt: Date.now(),
  })
  return finishJoin(doc as unknown as RoomDocument, 'black')
}

async function finishJoin(roomDoc: RoomDocument, color: PlayerColor): Promise<JoinAckData> {
  const { state, clock } = await fetchRoomState(roomDoc)
  return { ok: true, room: toRoomPublicData(roomDoc), color, state, clock }
}

/** Lấy toàn bộ nước đi của ván hiện tại (đúng thứ tự ply) */
export async function fetchRoomMoves(roomDoc: RoomDocument): Promise<MoveDocument[]> {
  const { databases } = getAppwrite()
  const result = await databases.listDocuments(DATABASE_ID, MOVES_COLLECTION_ID, [
    Query.equal('roomId', roomDoc.$id),
    Query.equal('gameNumber', roomDoc.gameNumber),
    Query.orderAsc('ply'),
    Query.limit(100),
  ])
  return result.documents as unknown as MoveDocument[]
}

/** Trạng thái đã kiểm định của phòng: replay toàn bộ nước đi qua chess.js */
export async function fetchRoomState(roomDoc: RoomDocument): Promise<{
  state: GameState | null
  clock: { whiteMs: number; blackMs: number } | null
}> {
  const moves = await fetchRoomMoves(roomDoc)
  const { state } = replayMoves(moves, roomDoc)
  return { state, clock: clockFromDoc(roomDoc) }
}

/** Rời phòng: đang chơi → xử thua; đang chờ → đánh dấu abandoned */
export async function leaveAppwriteRoom(roomId: string): Promise<void> {
  const userId = await ensureAnonymousSession()
  const { databases } = getAppwrite()
  const roomDoc = (await databases.getDocument(DATABASE_ID, ROOMS_COLLECTION_ID, roomId)) as unknown as RoomDocument

  const myColor: PlayerColor | null =
    userId === roomDoc.whitePlayerId ? 'white' : userId === roomDoc.blackPlayerId ? 'black' : null
  if (!myColor) return

  if (roomDoc.status === 'playing') {
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, roomId, {
      status: 'finished',
      winner: myColor === 'white' ? 'black' : 'white',
      resultReason: 'left',
      turnStartedAt: 0,
      [myColor === 'white' ? 'whiteLastSeenAt' : 'blackLastSeenAt']: Date.now(),
    })
  } else {
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, roomId, {
      status: 'abandoned',
      turnStartedAt: 0,
      [myColor === 'white' ? 'whiteLastSeenAt' : 'blackLastSeenAt']: Date.now(),
    })
  }
}

export { deriveGameState, replayMoves }
