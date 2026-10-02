import { computeBestMove } from './chessAI'
import type { AIWorkerRequest, AIWorkerResponse } from './chessAI'

/**
 * Entry point của Web Worker: nhận {fen, difficulty}, tính nước đi AI
 * trong thread riêng để bàn cờ và animation không bị khựng.
 */

/** Kiểu cấu trúc tối giản của scope worker (tránh thêm lib WebWorker vào tsconfig) */
interface WorkerScope {
  onmessage: ((event: MessageEvent<AIWorkerRequest>) => void) | null
  postMessage: (message: AIWorkerResponse) => void
}

const workerScope = self as unknown as WorkerScope

workerScope.onmessage = (event) => {
  const { id, fen, difficulty } = event.data

  let response: AIWorkerResponse
  try {
    response = { id, move: computeBestMove(fen, difficulty) }
  } catch (error) {
    response = { id, error: error instanceof Error ? error.message : String(error) }
  }
  workerScope.postMessage(response)
}
