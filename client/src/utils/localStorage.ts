/**
 * Nguyên thủy truy cập localStorage an toàn (không ném lỗi khi bị chặn/đầy).
 * storageService xây trên các hàm này.
 */

export function readRawString(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeRawString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // localStorage không khả dụng (chế độ riêng tư / đầy) — bỏ qua
  }
}

export function removeRawString(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // bỏ qua
  }
}

export function readJsonValue<T>(key: string): T | undefined {
  const raw = readRawString(key)
  if (raw === null) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function writeJsonValue(key: string, value: unknown): void {
  writeRawString(key, JSON.stringify(value))
}
