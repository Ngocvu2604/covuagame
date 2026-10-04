import { Account, Client, Databases } from 'appwrite'

/**
 * Khởi tạo Appwrite SDK (lazy singleton) và phiên Anonymous.
 *
 * Biến môi trường (đặt trong client/.env hoặc Vercel Environment Variables):
 *   VITE_APPWRITE_ENDPOINT          — ví dụ https://sgp.cloud.appwrite.io/v1
 *   VITE_APPWRITE_PROJECT_ID        — id project trong Appwrite Console
 *   VITE_APPWRITE_DATABASE_ID       — id database chứa các collection dưới đây
 *   VITE_APPWRITE_ROOMS_COLLECTION_ID     (mặc định 'rooms')
 *   VITE_APPWRITE_MOVES_COLLECTION_ID     (mặc định 'moves')
 *   VITE_APPWRITE_MESSAGES_COLLECTION_ID  (mặc định 'messages')
 *
 * Không có secret nào ở đây — toàn bộ là cấu hình public của web app.
 */

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID as string | undefined

export const DATABASE_ID = databaseId ?? 'chess-arena'

export const ROOMS_COLLECTION_ID =
  (import.meta.env.VITE_APPWRITE_ROOMS_COLLECTION_ID as string | undefined) ?? 'rooms'
export const MOVES_COLLECTION_ID =
  (import.meta.env.VITE_APPWRITE_MOVES_COLLECTION_ID as string | undefined) ?? 'moves'
export const MESSAGES_COLLECTION_ID =
  (import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined) ?? 'messages'

/** Appwrite đã được cấu hình chưa — quyết định provider online (appwrite hay socket) */
export function isAppwriteConfigured(): boolean {
  return Boolean(endpoint && projectId && databaseId)
}

interface AppwriteKit {
  client: Client
  account: Account
  databases: Databases
}

let kit: AppwriteKit | null = null

export function getAppwrite(): AppwriteKit {
  if (!isAppwriteConfigured()) {
    throw new Error('Appwrite chưa được cấu hình (thiếu VITE_APPWRITE_* env)')
  }
  if (!kit) {
    const client = new Client().setEndpoint(endpoint as string).setProject(projectId as string)
    kit = { client, account: new Account(client), databases: new Databases(client) }
  }
  return kit
}

let cachedUserId: string | null = null
let sessionPromise: Promise<string> | null = null

/**
 * Đảm bảo có một Anonymous Session và trả về anonymousUserId.
 *
 * QUAN TRỌNG cho reconnect (mục 12): luôn thử `account.get()` TRƯỚC —
 * session được Appwrite giữ qua cookie/localStorage nên sau reload vẫn là
 * CÙNG một user. Chỉ khi CHƯA có session mới gọi createAnonymousSession;
 * gọi create khi đã có session sẽ xoay vòng identity và mất ghế đang ngồi.
 */
export function ensureAnonymousSession(): Promise<string> {
  if (cachedUserId) return Promise.resolve(cachedUserId)
  if (sessionPromise) return sessionPromise

  sessionPromise = (async () => {
    const { account } = getAppwrite()

    // 1) Đã có session hợp lệ → dùng lại, KHÔNG tạo session mới
    try {
      const user = await account.get()
      cachedUserId = user.$id
      return cachedUserId
    } catch {
      // chưa có session (lần đầu / bị xoá) → tạo mới bên dưới
    }

    // 2) Tạo anonymous session mới
    try {
      await account.createAnonymousSession()
    } catch {
      // đã có session song song hoặc không khả dụng → thử get lại
    }
    const user = await account.get()
    cachedUserId = user.$id
    return cachedUserId
  })()

  sessionPromise.catch(() => {
    sessionPromise = null
  })
  return sessionPromise
}

export function getSessionUserId(): string | null {
  return cachedUserId
}
