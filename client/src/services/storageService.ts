import type { StateStorage } from 'zustand/middleware'
import { readJsonValue, readRawString, removeRawString, writeJsonValue, writeRawString } from '../utils/localStorage'

/**
 * Cổng lưu trữ duy nhất của app lên localStorage:
 * - key có tiền tố chung
 * - adapter cho zustand persist
 * - load/save JSON cho các giá trị rời rạc
 */

const KEY_PREFIX = 'chess-arena:'

export const storageKeys = {
  settings: 'settings',
  player: 'player',
} as const

function prefixed(key: string): string {
  return `${KEY_PREFIX}${key}`
}

/** Adapter dùng cho zustand persist (đọc/ghi chuỗi thô) */
export function createPersistentStorage(): StateStorage {
  return {
    getItem: (name) => readRawString(prefixed(name)),
    setItem: (name, value) => writeRawString(prefixed(name), value),
    removeItem: (name) => removeRawString(prefixed(name)),
  }
}

export function loadStoredValue<T>(key: string): T | undefined {
  return readJsonValue<T>(prefixed(key))
}

export function saveStoredValue(key: string, value: unknown): void {
  writeJsonValue(prefixed(key), value)
}
