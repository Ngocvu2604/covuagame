import type { DifficultyId } from '../constants/difficulty'
import type { PieceType, SquareName } from '../types/chess'
import { AI_CONFIGS } from './difficulty'
import { searchPosition } from './minimax'

/** Nước đi AI trả về cho tầng game */
export interface AIMove {
  from: SquareName
  to: SquareName
  promotion?: PieceType
}

/** Giao thức trao đổi với Web Worker */
export interface AIWorkerRequest {
  id: number
  fen: string
  difficulty: DifficultyId
}

export interface AIWorkerResponse {
  id: number
  move?: AIMove | null
  error?: string
}

/** Thời gian tối đa chờ worker trước khi rẽ nhánh tính trực tiếp */
const WORKER_TIMEOUT_MS = 15_000

/** Biên "sai lầm" của mức Tân Binh: chỉ chọn ngẫu nhiên trong nước không thua nặng */
const BLUNDER_FALLBACK_CP = 350

/**
 * Tính nước đi tốt nhất (đồng bộ — chạy trong worker hoặc fallback).
 * Theo độ khó: dễ thì thêm margin ngẫu nhiên + tỉ lệ sai lầm chủ ý,
 * khó thì luôn chọn nước tốt nhất.
 */
export function computeBestMove(fen: string, difficulty: DifficultyId): AIMove | null {
  const config = AI_CONFIGS[difficulty]
  const analysis = searchPosition(fen, config)
  const candidates = analysis.candidates
  if (candidates.length === 0) return null

  const bestScore = candidates[0].scoreCp

  let pool: typeof candidates
  if (config.blunderChance > 0 && Math.random() < config.blunderChance) {
    pool = candidates.filter((c) => c.scoreCp >= bestScore - BLUNDER_FALLBACK_CP)
  } else {
    pool = candidates.filter((c) => c.scoreCp >= bestScore - config.marginCp)
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? candidates[0]
  return { from: chosen.from, to: chosen.to, promotion: chosen.promotion ?? undefined }
}

let worker: Worker | null = null
let requestId = 0
const pendingRequests = new Map<number, {
  resolve: (move: AIMove | null) => void
  reject: () => void
  timer: number
}>()

function ensureWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (worker) return worker

  try {
    worker = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' })

    worker.onmessage = (event: MessageEvent<AIWorkerResponse>) => {
      const entry = pendingRequests.get(event.data.id)
      if (!entry) return
      pendingRequests.delete(event.data.id)
      clearTimeout(entry.timer)
      if (event.data.error) {
        entry.reject()
      } else {
        entry.resolve(event.data.move ?? null)
      }
    }

    worker.onerror = () => {
      // Worker gặp sự cố: từ chối mọi yêu cầu đang chờ để fallback tính trực tiếp
      for (const entry of pendingRequests.values()) {
        clearTimeout(entry.timer)
        entry.reject()
      }
      pendingRequests.clear()
    }

    return worker
  } catch {
    worker = null
    return null
  }
}

/**
 * API chính cho UI: tính nước đi AI (bất đồng bộ).
 * Ưu tiên Web Worker để không chặn UI; nếu worker không khả dụng
 * hoặc lỗi thì tính đồng bộ ngay trên main thread.
 */
export async function findBestMove(fen: string, difficulty: DifficultyId): Promise<AIMove | null> {
  const instance = ensureWorker()
  if (instance) {
    try {
      return await new Promise<AIMove | null>((resolve, reject) => {
        const id = ++requestId
        const timer = window.setTimeout(() => {
          if (pendingRequests.delete(id)) reject()
        }, WORKER_TIMEOUT_MS)
        pendingRequests.set(id, { resolve, reject, timer })
        const message: AIWorkerRequest = { id, fen, difficulty }
        instance.postMessage(message)
      })
    } catch {
      // rơi xuống tính trực tiếp
    }
  }
  return computeBestMove(fen, difficulty)
}
