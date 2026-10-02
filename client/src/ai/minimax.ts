import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import type { PieceType, SquareName } from '../types/chess'
import { toPieceType } from '../chess/chessUtils'
import { evaluatePosition } from './evaluation'
import { orderMoves } from './moveOrdering'

/**
 * Tìm kiếm Negamax + Alpha-Beta Pruning với iterative deepening.
 * Có mốc thời gian (deadline): nếu quá ngân sách, trả về kết quả của
 * độ sâu hoàn thành gần nhất — tìm kiếm luôn dừng đúng hẹn.
 * Không chứa UI, không biết gì về độ khó (chỉ nhận SearchConfig).
 */

const MATE_SCORE = 100_000
const INFINITY = MATE_SCORE * 2
const MAX_QUIESCENCE_PLY = 6
const DEADLINE_CHECK_MASK = 1023 // kiểm tra deadline mỗi 1024 node

export interface RootCandidate {
  from: SquareName
  to: SquareName
  promotion: PieceType | null
  /** Điểm centipawn từ góc nhìn bên đi nước tại gốc */
  scoreCp: number
}

export interface SearchAnalysis {
  /** Toàn bộ nước đi ở gốc, sắp theo điểm giảm dần */
  candidates: RootCandidate[]
  reachedDepth: number
  nodeCount: number
  durationMs: number
}

export interface SearchConfig {
  maxDepth: number
  timeCapMs: number
  useQuiescence: boolean
}

interface SearchContext {
  game: Chess
  useQuiescence: boolean
  deadline: number
  nodeCount: number
}

interface ScoredRootMove {
  move: Move
  scoreCp: number
}

class SearchDeadlineError extends Error {}

export function searchPosition(fen: string, config: SearchConfig): SearchAnalysis {
  const startedAt = Date.now()
  const ctx: SearchContext = {
    game: new Chess(fen),
    useQuiescence: config.useQuiescence,
    deadline: startedAt + config.timeCapMs,
    nodeCount: 0,
  }

  const rootMoves = ctx.game.moves({ verbose: true })
  if (rootMoves.length === 0) {
    return { candidates: [], reachedDepth: 0, nodeCount: 0, durationMs: Date.now() - startedAt }
  }

  let completed: ScoredRootMove[] = rootMoves.map((move) => ({ move, scoreCp: 0 }))
  let completedDepth = 0
  let orderedRootMoves = rootMoves

  for (let depth = 1; depth <= config.maxDepth; depth++) {
    try {
      const scored = searchRoot(ctx, orderedRootMoves, depth)
      completed = scored
      completedDepth = depth
      // Đưa nước tốt nhất lên đầu để vòng sâu hơn cắt tỉa sớm hơn
      orderedRootMoves = scored.map((entry) => entry.move)
    } catch (error) {
      if (error instanceof SearchDeadlineError) break
      throw error
    }
  }

  return {
    candidates: completed.map(({ move, scoreCp }) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion ? toPieceType(move.promotion) : null,
      scoreCp,
    })),
    reachedDepth: completedDepth,
    nodeCount: ctx.nodeCount,
    durationMs: Date.now() - startedAt,
  }
}

function searchRoot(ctx: SearchContext, rootMoves: Move[], depth: number): ScoredRootMove[] {
  let alpha = -INFINITY
  const scored: ScoredRootMove[] = []

  for (const move of rootMoves) {
    ctx.game.move({ from: move.from, to: move.to, promotion: move.promotion })
    const score = -negamax(ctx, depth - 1, -INFINITY, -alpha, 1)
    ctx.game.undo()

    scored.push({ move, scoreCp: score })
    if (score > alpha) alpha = score
  }

  scored.sort((a, b) => b.scoreCp - a.scoreCp)
  return scored
}

function negamax(ctx: SearchContext, depth: number, alpha: number, beta: number, ply: number): number {
  ctx.nodeCount++
  checkDeadline(ctx)

  if (depth === 0) {
    return ctx.useQuiescence ? quiescence(ctx, alpha, beta, 0) : evaluateForSideToMove(ctx.game)
  }

  const moves = ctx.game.moves({ verbose: true })
  if (moves.length === 0) {
    // Bên tới lượt hết nước: bị chiếu hết thì thua (ưu tiên chiếu hết sớm), ngược lại là hòa
    return ctx.game.isCheck() ? -MATE_SCORE + ply : 0
  }

  for (const move of orderMoves(moves)) {
    ctx.game.move({ from: move.from, to: move.to, promotion: move.promotion })
    const score = -negamax(ctx, depth - 1, -beta, -alpha, ply + 1)
    ctx.game.undo()

    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

/** Mở rộng chỉ các nước ăn quân/phong cấp để tránh đánh giá sai ở đường chân trời */
function quiescence(ctx: SearchContext, alpha: number, beta: number, ply: number): number {
  ctx.nodeCount++
  checkDeadline(ctx)

  const standPat = evaluateForSideToMove(ctx.game)
  if (standPat >= beta) return beta
  if (standPat > alpha) alpha = standPat
  if (ply >= MAX_QUIESCENCE_PLY) return alpha

  const tacticalMoves = ctx.game
    .moves({ verbose: true })
    .filter((m) => m.captured !== undefined || m.promotion !== undefined)

  for (const move of orderMoves(tacticalMoves)) {
    ctx.game.move({ from: move.from, to: move.to, promotion: move.promotion })
    const score = -quiescence(ctx, -beta, -alpha, ply + 1)
    ctx.game.undo()

    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function evaluateForSideToMove(game: Chess): number {
  const score = evaluatePosition(game)
  return game.turn() === 'w' ? score : -score
}

function checkDeadline(ctx: SearchContext): void {
  if ((ctx.nodeCount & DEADLINE_CHECK_MASK) === 0 && Date.now() > ctx.deadline) {
    throw new SearchDeadlineError()
  }
}
