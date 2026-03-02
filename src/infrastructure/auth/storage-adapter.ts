/**
 * 커스텀 스토리지 어댑터
 * localStorage 기반 + BroadcastChannel을 통한 탭 간 동기화
 */

import { TabSyncManager } from './tab-sync'

interface StorageAdapter {
  getItem: (key: string) => string | Promise<string | null> | null
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}

class CustomStorageAdapter implements StorageAdapter {
  private tabSync: TabSyncManager

  constructor() {
    // TabSyncManager는 싱글톤으로 관리
    this.tabSync = TabSyncManager.getInstance()
  }

  getItem(key: string): string | null {
    try {
      const fullKey = this.getFullKey(key)
      const value = localStorage.getItem(fullKey)
      
      if (value) {
        console.log(`📖 [Storage] Reading ${fullKey}`)
      }
      
      return value
    } catch (error) {
      console.error('[Storage] Error reading item:', error)
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      const fullKey = this.getFullKey(key)
      const oldValue = localStorage.getItem(fullKey)
      
      localStorage.setItem(fullKey, value)
      console.log(`💾 [Storage] Saved ${fullKey}`)
      
      // 값이 변경된 경우에만 다른 탭에 알림
      if (oldValue !== value) {
        this.tabSync.broadcastStorageUpdate(fullKey, value, oldValue)
      }
    } catch (error) {
      console.error('[Storage] Error saving item:', error)
    }
  }

  removeItem(key: string): void {
    try {
      const fullKey = this.getFullKey(key)
      const oldValue = localStorage.getItem(fullKey)
      
      localStorage.removeItem(fullKey)
      console.log(`🗑️ [Storage] Removed ${fullKey}`)
      
      // 다른 탭에 삭제 알림
      if (oldValue !== null) {
        this.tabSync.broadcastStorageRemove(fullKey, oldValue)
      }
    } catch (error) {
      console.error('[Storage] Error removing item:', error)
    }
  }

  private getFullKey(key: string): string {
    // Supabase의 기본 키 형식을 그대로 사용
    return key
  }
}

/**
 * 스토리지 어댑터 생성 팩토리 함수
 * Supabase 클라이언트 초기화 시 사용
 */
export function createStorageAdapter(): StorageAdapter {
  // SSR 환경에서는 기본 메모리 스토리지 사용
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  }

  return new CustomStorageAdapter()
}

/**
 * 스토리지 키 헬퍼 함수들
 */
export const StorageKeys = {
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  SESSION: 'session',
  USER: 'user',
} as const

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys]