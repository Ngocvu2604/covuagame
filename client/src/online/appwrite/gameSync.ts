import { Chess } from 'chess.js'
import { ID, Permission, Role } from 'appwrite'
import type { GameSyncHandlers, GameSyncProvider, MovePayload } from '../../types/socket'
import type { ClockInfo, MoveAckData, SimpleAckData } from '../../types/socket'
import type { PieceType } from '../../types/chess'
import type { GameEndReason, GameState, MoveRecord, PlayerColor, SquareName } from '../../types/chess'
import {
  DATABASE_ID,
  ensureAnonymousSession,
  getAppwrite,
  MESSAGES_COLLECTION_ID,
  MOVES_COLLECTION_ID,
  ROOMS_COLLECTION_ID,
} from './client'
import { clockFromDoc, toRoomPublicData } from './documents'
import type { MessageDocument, MoveDocument, RoomDocument } from './documents'
import { deriveGameState } from './stateReplay'
import { fetchRoomMoves } from './roomService'
import { findLegalMove } from '../../chess/moveValidator'
import { toPieceType, toPlayerColor } from '../../chess/chessUtils'
import { usePlayerStore } from '../../state/playerStore'
import { useRoomStore } from '../../state/roomStore'
import { pushToast } from '../../state/uiStore'
import { getT } from '../../i18n/translations'

/**
 * GameSyncProvider chạy trên Appwrite Realtime + Database.
 *
 * Nguồn sự thật:
 * - document `rooms`   : ghế ngồi, trạng thái, đồng hồ, kết quả, lời mời
 * - collection `moves` : log nước đi append-only → mọi client REPLAY qua
 *   chess.js để suy ra bàn cờ đã kiểm định (stateReplay.ts)
 * - collection `messages`: chat
 *
 * Presence: mỗi client cập nhật lastSeenAt của ghế mình mỗi 10s; đối thủ
 * không cập nhật trong 25s → hiển thị "mất kết nối"; quá 60s → xử thua.
 */

const PRESENCE_INTERVAL_MS = 10_000
/** 30 giây grace — đối thủ mất kết nối quá hạn thì xử thắng (mục 18) */
const ABANDON_AFTER_MS = 30_000
/** Khoảng nghỉ tối thiểu giữa 2 lần touch presence qua realtime events */
const PRESENCE_TOUCH_THROTTLE_MS = 8_000

function colorOfUser(userId: string, doc: RoomDocument): PlayerColor | null {
  if (userId === doc.whitePlayerId) return 'white'
  if (userId === doc.blackPlayerId) return 'black'
  return null
}

function docResult(doc: RoomDocument): GameState['result'] {
  if (doc.status !== 'finished' || !doc.resultReason) return null
  const winner = doc.winner === 'white' ? 'white' : doc.winner === 'black' ? 'black' : null
  return { winner, reason: doc.resultReason as GameEndReason }
}

class AppwriteSync implements GameSyncProvider {
  private handlers: GameSyncHandlers | null = null
  private roomDoc: RoomDocument | null = null
  private moveDocs = new Map<string, MoveDocument>()
  private liveChess = new Chess()
  private unsubscribes: (() => void)[] = []
  private timers: number[] = []
  private emittedMessageIds = new Set<string>()
  private lastEmittedDrawOffer = ''
  private lastEmittedRematchOffer = ''
  private gameOverHandledGame = -1
  private starting = false
  private lastPresenceTouch = 0
  private waitTimer: number | null = null

  subscribe(handlers: GameSyncHandlers): () => void {
    this.handlers = handlers
    const room = useRoomStoreSnapshot()
    if (room?.id) {
      if (!this.starting) {
        this.starting = true
        void this.init(room.id)
      }
      return () => this.teardown()
    }

    // Chưa có phòng (ví dụ đang khôi phục phiên sau refresh): đợi store
    // có phòng rồi mới init — nếu không, provider sẽ không bao giờ khởi
    // động và mọi send/realtime đều im lặng.
    this.waitTimer = window.setInterval(() => {
      const pending = useRoomStoreSnapshot()
      if (pending?.id) {
        window.clearInterval(this.waitTimer ?? 0)
        this.waitTimer = null
        if (!this.starting) {
          this.starting = true
          void this.init(pending.id)
        }
      }
    }, 250)
    return () => this.teardown()
  }


  private teardown(): void {
    if (this.waitTimer !== null) {
      window.clearInterval(this.waitTimer)
      this.waitTimer = null
    }
    for (const unsub of this.unsubscribes) unsub()
    this.unsubscribes = []
    for (const timer of this.timers) clearInterval(timer)
    this.timers = []
    this.handlers = null
    this.starting = false
    this.roomDoc = null
    this.moveDocs.clear()
    this.liveChess = new Chess()
    this.emittedMessageIds.clear()
    this.lastEmittedDrawOffer = ''
    this.lastEmittedRematchOffer = ''
    this.gameOverHandledGame = -1
  }

  private async init(roomId: string): Promise<void> {
    try {
      const { databases, client } = getAppwrite()
      const doc = (await databases.getDocument(DATABASE_ID, ROOMS_COLLECTION_ID, roomId)) as unknown as RoomDocument
      this.setRoomDoc(doc)

      const moves = await fetchRoomMoves(doc)
      for (const move of moves) this.moveDocs.set(move.$id, move)
      this.rebuildLive()

      this.handlers?.onRoomUpdated({ room: toRoomPublicData(doc) })
      if (doc.status === 'playing') {
        this.handlers?.onGameStarted({
          room: toRoomPublicData(doc),
          state: this.buildState(),
          clock: clockFromDoc(doc),
        })
      }
      // Phòng đã kết thúc trước đó (reload giữa/khi sau ván) → phát lại kết quả
      if (doc.status === 'finished') {
        const result = docResult(doc)
        if (result) {
          this.handlers?.onGameOver({ result, state: this.buildState(), clock: clockFromDoc(doc) })
        }
      }

      const roomChannel = `databases.${DATABASE_ID}.collections.${ROOMS_COLLECTION_ID}.documents.${roomId}`
      const movesChannel = `databases.${DATABASE_ID}.collections.${MOVES_COLLECTION_ID}.documents`
      const messagesChannel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`

      this.unsubscribes.push(
        client.subscribe(roomChannel, (response) => {
          void this.touchPresence()
          this.onRoomDocChanged(response.payload as RoomDocument)
        }),
        client.subscribe(movesChannel, (response) => {
          void this.touchPresence()
          const payload = response.payload as MoveDocument
          if (payload.roomId !== roomId) return
          this.onMoveDocArrived(payload)
        }),
        client.subscribe(messagesChannel, (response) => {
          void this.touchPresence()
          const payload = response.payload as MessageDocument
          if (payload.roomId !== roomId) return
          this.onMessageDocArrived(payload)
        }),
      )

      this.timers.push(window.setInterval(() => void this.heartbeat(), PRESENCE_INTERVAL_MS))
      this.timers.push(window.setInterval(() => this.emitPresenceIfChanged(), 5_000))
      this.timers.push(window.setInterval(() => void this.checkAbandon(), 5_000))

      // Tab vừa được nhìn lại → touch presence ngay (không chờ interval bị throttle)
      const onVisible = () => {
        if (!document.hidden) void this.touchPresence(true)
      }
      document.addEventListener('visibilitychange', onVisible)
      this.unsubscribes.push(() => document.removeEventListener('visibilitychange', onVisible))
    } catch (error) {
      pushToast(getT()('game.initServerFail'), 'error')
      console.error('[appwrite] init failed:', error)
    }
  }

  // ----- Sự kiện từ Appwrite Realtime -----

  private onRoomDocChanged(doc: RoomDocument): void {
    const prev = this.roomDoc
    this.setRoomDoc(doc)

    // Rematch: số ván tăng → dọn cache nước đi, ván mới bắt đầu
    if (prev && doc.gameNumber !== prev.gameNumber) {
      this.moveDocs.clear()
      this.liveChess = new Chess()
      this.gameOverHandledGame = -1
      void this.emitFreshGame(doc)
      return
    }

    // Ván mới bắt đầu (waiting → playing): màn hình đang chờ nhận full state
    if (prev && prev.status !== 'playing' && doc.status === 'playing') {
      this.rebuildLive()
      this.handlers?.onGameStarted({
        room: toRoomPublicData(doc),
        state: this.buildState(),
        clock: clockFromDoc(doc),
      })
      return
    }

    // Kết thúc ván (status đổi sang finished) → phát game over
    if (prev && prev.status !== 'finished' && doc.status === 'finished') {
      const result = docResult(doc)
      if (result && this.gameOverHandledGame !== doc.gameNumber) {
        this.gameOverHandledGame = doc.gameNumber
        this.rebuildLive()
        this.handlers?.onGameOver({ result, state: this.buildState(), clock: clockFromDoc(doc) })
      }
    }

    // Lời mời hòa / chơi lại
    if (doc.drawOfferedBy !== this.lastEmittedDrawOffer) {
      if (doc.drawOfferedBy) {
        const from = colorOfUser(doc.drawOfferedBy, doc)
        if (from) this.handlers?.onDrawOffered({ from })
      } else if (prev?.drawOfferedBy) {
        this.handlers?.onDrawDeclined({ from: 'white' })
      }
      this.lastEmittedDrawOffer = doc.drawOfferedBy
    }
    if (doc.rematchOfferedBy !== this.lastEmittedRematchOffer) {
      if (doc.rematchOfferedBy) {
        const from = colorOfUser(doc.rematchOfferedBy, doc)
        if (from) this.handlers?.onRematchOffered({ from })
      } else if (prev?.rematchOfferedBy) {
        // Lời mời bị từ chối (xóa sau khi có) — người gửi thấy trạng thái "Bị từ chối"
        this.handlers?.onRematchDeclined({ from: 'white' })
      }
      this.lastEmittedRematchOffer = doc.rematchOfferedBy
    }
  }

  private onMoveDocArrived(doc: MoveDocument): void {
    if (this.moveDocs.has(doc.$id)) return
    if (doc.gameNumber !== (this.roomDoc?.gameNumber ?? -1)) return
    this.moveDocs.set(doc.$id, doc)

    const state = this.rebuildLive()
    const record = state.moveHistory[doc.ply - 1] ?? null
    // entry bị replay loại (bất hợp lệ/sai lượt) → không phát
    if (!record) return
    this.handlers?.onMoveApplied({
      move: record,
      state,
      clock: this.roomDoc ? clockFromDoc(this.roomDoc) : null,
    })
  }

  private onMessageDocArrived(doc: MessageDocument): void {
    if (this.emittedMessageIds.has(doc.$id)) return
    this.emittedMessageIds.add(doc.$id)
    const room = this.roomDoc
    const from: PlayerColor | null = room
      ? doc.userId === room.whitePlayerId
        ? 'white'
        : doc.userId === room.blackPlayerId
          ? 'black'
          : null
      : null
    if (!from) return
    this.handlers?.onChatMessage({ from, fromName: doc.name, text: doc.text, sentAt: doc.sentAt })
  }

  // ----- Send actions -----

  async sendMove(payload: MovePayload): Promise<MoveAckData> {
    const { databases } = getAppwrite()
    const userId = await this.withUserId()
    if (!this.roomDoc) return { ok: false, error: 'GAME_NOT_ACTIVE' }

    // Tự chữa lành: refetch room doc + move log TƯƠI từ Appwrite trước khi
    // validate — realtime có thể miss event khi tab nền, state cục bộ stale
    // sẽ khiến nước đi hợp lệ bị từ chối nhầm (NOT_YOUR_TURN).
    const freshDoc = (await databases.getDocument(
      DATABASE_ID,
      ROOMS_COLLECTION_ID,
      this.roomDoc.$id,
    )) as unknown as RoomDocument
    const freshMoves = await fetchRoomMoves(freshDoc)
    for (const move of freshMoves) this.moveDocs.set(move.$id, move)

    if (freshDoc.status !== 'playing') return { ok: false, error: 'GAME_NOT_ACTIVE' }

    const myColor = colorOfUser(userId, freshDoc)
    if (!myColor) return { ok: false, error: 'NOT_IN_ROOM' }

    // Rebuild bàn cờ đã kiểm định từ move log tươi — nguồn sự thật duy nhất
    const state = this.rebuildLive()
    if (state.turn !== myColor) return { ok: false, error: 'NOT_YOUR_TURN' }

    const legal = findLegalMove(this.liveChess, payload.from as SquareName, payload.to as SquareName, payload.promotion as PieceType | undefined)
    if (!legal) return { ok: false, error: 'INVALID_MOVE' }

    const now = Date.now()
    let whiteMs = freshDoc.whiteMs
    let blackMs = freshDoc.blackMs
    if (freshDoc.timeMinutes > 0 && freshDoc.turnStartedAt > 0) {
      const elapsed = now - freshDoc.turnStartedAt
      if (myColor === 'white') whiteMs = Math.max(0, whiteMs - elapsed)
      else blackMs = Math.max(0, blackMs - elapsed)
    }

    const ply = this.liveChess.history().length + 1
    await databases.createDocument(
      DATABASE_ID,
      MOVES_COLLECTION_ID,
      ID.unique(),
      {
        roomId: freshDoc.$id,
        gameNumber: freshDoc.gameNumber,
        ply,
        userId,
        color: myColor,
        from: payload.from,
        to: payload.to,
        promotion: payload.promotion ?? '',
      },
      [Permission.read(Role.users()), Permission.write(Role.user(userId))],
    )

    // Áp vào mirror cục bộ để kiểm tra kết thúc + tính state cho ack
    const applied = this.liveChess.move({
      from: payload.from,
      to: payload.to,
      promotion: payload.promotion || undefined,
    })
    const moveRecord: MoveRecord = {
      san: applied.san,
      from: applied.from as SquareName,
      to: applied.to as SquareName,
      color: myColor,
      piece: toPieceType(applied.piece),
      captured: applied.captured ? toPieceType(applied.captured) : null,
      promotion: applied.promotion ? toPieceType(applied.promotion) : null,
    }

    const nextTurn: PlayerColor = myColor === 'white' ? 'black' : 'white'
    const update: Record<string, unknown> = {
      turn: nextTurn,
      turnStartedAt: now,
      whiteMs,
      blackMs,
      [myColor === 'white' ? 'whiteLastSeenAt' : 'blackLastSeenAt']: now,
    }
    if (this.liveChess.isGameOver()) {
      update.status = 'finished'
      update.turnStartedAt = 0
      const derived = deriveResultOf(this.liveChess)
      if (derived) {
        update.winner = derived.winner ?? ''
        update.resultReason = derived.reason
      }
    }
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, freshDoc.$id, update)

    const updatedDoc: RoomDocument = { ...freshDoc, whiteMs, blackMs, turn: nextTurn, turnStartedAt: now }
    const finalState = deriveGameState(this.liveChess, this.historyOf(this.liveChess))
    const clock: ClockInfo | null = clockFromDoc(updatedDoc)
    return { ok: true, move: moveRecord, state: finalState, clock }
  }

  async sendResign(): Promise<SimpleAckData> {
    return this.finishBySelf('resignation')
  }

  async sendDrawOffer(): Promise<SimpleAckData> {
    return this.updateRoomIfPlaying((userId) => ({ drawOfferedBy: userId }))
  }

  async sendDrawAccept(): Promise<SimpleAckData> {
    return this.acceptDrawIfOffered()
  }

  async sendDrawDecline(): Promise<SimpleAckData> {
    return this.updateRoomIfPlaying((userId, doc) =>
      doc.drawOfferedBy && doc.drawOfferedBy !== userId ? { drawOfferedBy: '' } : null,
    )
  }

  async sendRematchOffer(): Promise<SimpleAckData> {
    return this.updateRoomIfNotPlaying((userId) => ({ rematchOfferedBy: userId }))
  }

  async sendRematchAccept(): Promise<SimpleAckData> {
    const doc = this.roomDoc
    const userId = await ensureAnonymousSession()
    if (!doc || doc.status === 'playing') return { ok: false, error: 'NO_OFFER' }
    if (!doc.rematchOfferedBy || doc.rematchOfferedBy === userId) return { ok: false, error: 'NO_OFFER' }

    const { databases } = getAppwrite()
    const initial = doc.timeMinutes > 0 ? doc.timeMinutes * 60_000 : 0
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, {
      // đổi màu hai bên như rematch truyền thống
      whitePlayerId: doc.blackPlayerId,
      whitePlayerName: doc.blackPlayerName,
      blackPlayerId: doc.whitePlayerId,
      blackPlayerName: doc.whitePlayerName,
      status: 'playing',
      gameNumber: doc.gameNumber + 1,
      winner: '',
      resultReason: '',
      drawOfferedBy: '',
      rematchOfferedBy: '',
      whiteMs: initial,
      blackMs: initial,
      turn: 'white',
      turnStartedAt: Date.now(),
    })
    return { ok: true }
  }

  async sendRematchDecline(): Promise<SimpleAckData> {
    const doc = this.roomDoc
    const userId = await ensureAnonymousSession()
    if (!doc || doc.status === 'playing') return { ok: false, error: 'NO_OFFER' }
    if (!doc.rematchOfferedBy || doc.rematchOfferedBy === userId) return { ok: false, error: 'NO_OFFER' }
    const { databases } = getAppwrite()
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, { rematchOfferedBy: '' })
    return { ok: true }
  }

  async sendChat(text: string): Promise<SimpleAckData> {
    const doc = this.roomDoc
    if (!doc) return { ok: false, error: 'NOT_IN_ROOM' }
    const userId = await ensureAnonymousSession()
    const { databases } = getAppwrite()
    await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        roomId: doc.$id,
        userId,
        name: usePlayerStore.getState().name || 'Người chơi',
        text,
        sentAt: Date.now(),
      },
      [Permission.read(Role.users()), Permission.write(Role.user(userId))],
    )
    return { ok: true }
  }

  // ----- helpers -----

  private cachedUserId: string | null = null

  private async withUserId(): Promise<string> {
    if (!this.cachedUserId) this.cachedUserId = await ensureAnonymousSession()
    return this.cachedUserId
  }

  private async updateRoomIfPlaying(
    build: (userId: string, doc: RoomDocument) => Record<string, unknown> | null,
  ): Promise<SimpleAckData> {
    const doc = this.roomDoc
    if (!doc || doc.status !== 'playing') return { ok: false, error: 'GAME_NOT_ACTIVE' }
    const userId = await this.withUserId()
    const update = build(userId, doc)
    if (!update) return { ok: false, error: 'NO_OFFER' }
    const { databases } = getAppwrite()
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, update)
    return { ok: true }
  }

  private async updateRoomIfNotPlaying(
    build: (userId: string, doc: RoomDocument) => Record<string, unknown> | null,
  ): Promise<SimpleAckData> {
    const doc = this.roomDoc
    if (!doc || doc.status === 'playing') return { ok: false, error: 'GAME_NOT_ACTIVE' }
    const userId = await this.withUserId()
    const update = build(userId, doc)
    if (!update) return { ok: false, error: 'NO_OFFER' }
    const { databases } = getAppwrite()
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, update)
    return { ok: true }
  }

  private async acceptDrawIfOffered(): Promise<SimpleAckData> {
    const doc = this.roomDoc
    const userId = await this.withUserId()
    if (!doc || doc.status !== 'playing') return { ok: false, error: 'GAME_NOT_ACTIVE' }
    if (!doc.drawOfferedBy || doc.drawOfferedBy === userId) return { ok: false, error: 'NO_OFFER' }
    const { databases } = getAppwrite()
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, {
      status: 'finished',
      winner: '',
      resultReason: 'agreement',
      drawOfferedBy: '',
      turnStartedAt: 0,
    })
    return { ok: true }
  }

  private async finishBySelf(reason: 'resignation'): Promise<SimpleAckData> {
    const doc = this.roomDoc
    const userId = await this.withUserId()
    if (!doc || doc.status !== 'playing') return { ok: false, error: 'GAME_NOT_ACTIVE' }
    const myColor = colorOfUser(userId, doc)
    if (!myColor) return { ok: false, error: 'NOT_IN_ROOM' }
    const { databases } = getAppwrite()
    await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, {
      status: 'finished',
      winner: myColor === 'white' ? 'black' : 'white',
      resultReason: reason,
      turnStartedAt: 0,
    })
    return { ok: true }
  }

  private setRoomDoc(doc: RoomDocument): void {
    this.roomDoc = doc
    this.handlers?.onRoomUpdated({ room: toRoomPublicData(doc) })
  }

  private rebuildLive(): GameState {
    const doc = this.roomDoc
    if (!doc) return deriveGameState(this.liveChess, [])
    const moves = [...this.moveDocs.values()]
    // Tất định: ply tăng dần, trùng ply thì document tạo trước thắng
    const sorted = [...moves].sort(
      (a, b) => a.ply - b.ply || a.$createdAt.localeCompare(b.$createdAt),
    )
    const replayGame = new Chess()
    const history: MoveRecord[] = []
    let expectedPly = 1
    for (const move of sorted) {
      if (move.gameNumber !== doc.gameNumber || move.ply !== expectedPly) continue
      const color = colorOfUser(move.userId, doc)
      if (!color || color !== (replayGame.turn() === 'w' ? 'white' : 'black')) continue
      const applied = replayGame.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || undefined,
      })
      if (!applied) continue
      history.push({
        san: applied.san,
        from: move.from as SquareName,
        to: move.to as SquareName,
        color,
        piece: toPieceType(applied.piece),
        captured: applied.captured ? toPieceType(applied.captured) : null,
        promotion: applied.promotion ? toPieceType(applied.promotion) : null,
      })
      expectedPly++
    }
    this.liveChess = replayGame
    return deriveGameState(this.liveChess, history)
  }

  private buildState(): GameState {
    return this.rebuildLive()
  }

  private historyOf(game: Chess): MoveRecord[] {
    return game.history({ verbose: true }).map((entry) => ({
      san: entry.san,
      from: entry.from as SquareName,
      to: entry.to as SquareName,
      color: toPlayerColor(entry.color),
      piece: toPieceType(entry.piece),
      captured: entry.captured ? toPieceType(entry.captured) : null,
      promotion: entry.promotion ? toPieceType(entry.promotion) : null,
    }))
  }

  private async emitFreshGame(doc: RoomDocument): Promise<void> {
    const moves = await fetchRoomMoves(doc)
    for (const move of moves) {
      if (move.gameNumber === doc.gameNumber) this.moveDocs.set(move.$id, move)
    }
    this.rebuildLive()
    this.handlers?.onGameStarted({
      room: toRoomPublicData(doc),
      state: this.buildState(),
      clock: clockFromDoc(doc),
    })
  }

  private async heartbeat(): Promise<void> {
    const doc = this.roomDoc
    if (!doc || doc.status !== 'playing') return
    const userId = await this.withUserId()
    const field = userId === doc.whitePlayerId ? 'whiteLastSeenAt' : 'blackLastSeenAt'
    try {
      const { databases } = getAppwrite()
      await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, { [field]: Date.now() })
    } catch {
      // mạng chập chờn — lần sau thử lại
    }
  }

  /**
   * Touch lastSeen của ghế mình. Gọi từ MỌI realtime callback (throttled):
   * WebSocket không bị Chrome throttle khi tab nền như setInterval, nên
   * chỉ cần còn nhận event (kể cả heartbeat của đối thủ) là presence tươi —
   * người chơi không bị xử thua oan khi tab nền.
   */
  private async touchPresence(force = false): Promise<void> {
    const doc = this.roomDoc
    if (!doc || doc.status !== 'playing') return
    if (!force && Date.now() - this.lastPresenceTouch < PRESENCE_TOUCH_THROTTLE_MS) return
    this.lastPresenceTouch = Date.now()
    const userId = await this.withUserId()
    const field = userId === doc.whitePlayerId ? 'whiteLastSeenAt' : 'blackLastSeenAt'
    try {
      const { databases } = getAppwrite()
      await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, { [field]: Date.now() })
    } catch {
      // bỏ qua — heartbeat định kỳ sẽ thử lại
    }
  }

  private lastPresenceConnected: boolean | null = null

  private emitPresenceIfChanged(): void {
    const doc = this.roomDoc
    if (!doc || doc.status !== 'playing') return
    const room = toRoomPublicData(doc)
    const connected = room.players.every((p) => p.connected)
    if (this.lastPresenceConnected !== null && connected !== this.lastPresenceConnected) {
      this.handlers?.onRoomUpdated({ room })
    }
    this.lastPresenceConnected = connected
  }

  private async checkAbandon(): Promise<void> {
    const doc = this.roomDoc
    if (!doc || doc.status !== 'playing') return
    const userId = await this.withUserId()
    const myColor = colorOfUser(userId, doc)
    if (!myColor) return
    const opponentLastSeen = myColor === 'white' ? doc.blackLastSeenAt : doc.whiteLastSeenAt
    if (opponentLastSeen > 0 && Date.now() - opponentLastSeen > ABANDON_AFTER_MS) {
      const { databases } = getAppwrite()
      await databases.updateDocument(DATABASE_ID, ROOMS_COLLECTION_ID, doc.$id, {
        status: 'finished',
        winner: myColor,
        resultReason: 'abandoned',
        turnStartedAt: 0,
      })
      pushToast(getT()('game.abandonWinToast'), 'info')
    }
  }
}


function useRoomStoreSnapshot() {
  return useRoomStore.getState().room
}

function deriveResultOf(game: Chess): GameState['result'] {
  if (game.isCheckmate()) {
    return { winner: game.turn() === 'w' ? 'black' : 'white', reason: 'checkmate' }
  }
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' }
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'threefold-repetition' }
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty-move' }
  return { winner: null, reason: 'insufficient-material' }
}

export function createAppwriteProvider(): GameSyncProvider {
  return new AppwriteSync()
}
