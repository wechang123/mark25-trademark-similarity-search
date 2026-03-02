/**
 * 탭 동기화 매니저
 * BroadcastChannel API를 사용한 탭 간 실시간 동기화
 * 구형 브라우저를 위한 localStorage 이벤트 폴백 지원
 */

type AuthEventType = 
  | 'AUTH_STATE_CHANGE' 
  | 'TOKEN_REFRESH' 
  | 'SIGN_OUT' 
  | 'SIGN_IN'
  | 'SESSION_UPDATE'
  | 'STORAGE_UPDATE'
  | 'STORAGE_REMOVE'

interface TabSyncMessage {
  type: AuthEventType
  tabId: string
  timestamp: number
  payload?: any
}

interface StorageEventData {
  key: string
  value?: string | null
  oldValue?: string | null
}

export class TabSyncManager {
  private static instance: TabSyncManager | null = null
  private channel: BroadcastChannel | null = null
  private tabId: string
  private isUsingFallback = false
  private listeners: Map<AuthEventType, Set<(data: any) => void>> = new Map()
  private cleanupFunctions: (() => void)[] = []

  private constructor() {
    this.tabId = this.generateTabId()
    this.initializeChannel()
    console.log(`🔗 [TabSync] Initialized with ID: ${this.tabId}`)
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): TabSyncManager {
    if (!TabSyncManager.instance) {
      TabSyncManager.instance = new TabSyncManager()
    }
    return TabSyncManager.instance
  }

  /**
   * 채널 초기화
   */
  private initializeChannel(): void {
    if (typeof window === 'undefined') {
      return
    }

    // BroadcastChannel 지원 확인
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('auth_sync')
        this.setupBroadcastListeners()
        console.log('✅ [TabSync] Using BroadcastChannel API')
      } catch (error) {
        console.warn('[TabSync] BroadcastChannel failed, falling back to localStorage', error)
        this.setupLocalStorageFallback()
      }
    } else {
      console.log('📦 [TabSync] BroadcastChannel not supported, using localStorage fallback')
      this.setupLocalStorageFallback()
    }
  }

  /**
   * BroadcastChannel 리스너 설정
   */
  private setupBroadcastListeners(): void {
    if (!this.channel) return

    const handleMessage = (event: MessageEvent<TabSyncMessage>) => {
      // 자신이 보낸 메시지는 무시
      if (event.data.tabId === this.tabId) {
        return
      }

      console.log(`📨 [TabSync] Received ${event.data.type} from ${event.data.tabId}`)
      this.handleSyncMessage(event.data)
    }

    this.channel.addEventListener('message', handleMessage)
    this.cleanupFunctions.push(() => {
      this.channel?.removeEventListener('message', handleMessage)
    })
  }

  /**
   * localStorage 이벤트 폴백 설정 (구형 브라우저)
   */
  private setupLocalStorageFallback(): void {
    this.isUsingFallback = true

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== 'auth_sync_event') {
        return
      }

      if (!event.newValue) {
        return
      }

      try {
        const data: TabSyncMessage = JSON.parse(event.newValue)
        
        // 자신이 보낸 메시지는 무시
        if (data.tabId === this.tabId) {
          return
        }

        // 5초 이상 된 메시지는 무시
        if (Date.now() - data.timestamp > 5000) {
          return
        }

        console.log(`📨 [TabSync-Fallback] Received ${data.type} from ${data.tabId}`)
        this.handleSyncMessage(data)
      } catch (error) {
        console.error('[TabSync-Fallback] Error parsing storage event:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    this.cleanupFunctions.push(() => {
      window.removeEventListener('storage', handleStorageChange)
    })
  }

  /**
   * 동기화 메시지 처리
   */
  private handleSyncMessage(message: TabSyncMessage): void {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.payload)
        } catch (error) {
          console.error(`[TabSync] Error in listener for ${message.type}:`, error)
        }
      })
    }
  }

  /**
   * 이벤트 브로드캐스트
   */
  public broadcast(type: AuthEventType, payload?: any): void {
    const message: TabSyncMessage = {
      type,
      tabId: this.tabId,
      timestamp: Date.now(),
      payload
    }

    if (this.channel && !this.isUsingFallback) {
      try {
        this.channel.postMessage(message)
        console.log(`📤 [TabSync] Broadcasted ${type}`)
      } catch (error) {
        console.error('[TabSync] Broadcast error:', error)
      }
    } else {
      // localStorage 폴백
      try {
        localStorage.setItem('auth_sync_event', JSON.stringify(message))
        // 즉시 제거하여 storage 이벤트 트리거
        setTimeout(() => {
          localStorage.removeItem('auth_sync_event')
        }, 100)
        console.log(`📤 [TabSync-Fallback] Broadcasted ${type}`)
      } catch (error) {
        console.error('[TabSync-Fallback] Broadcast error:', error)
      }
    }
  }

  /**
   * 스토리지 업데이트 브로드캐스트
   */
  public broadcastStorageUpdate(key: string, value: string | null, oldValue: string | null): void {
    this.broadcast('STORAGE_UPDATE', { key, value, oldValue } as StorageEventData)
  }

  /**
   * 스토리지 삭제 브로드캐스트
   */
  public broadcastStorageRemove(key: string, oldValue: string | null): void {
    this.broadcast('STORAGE_REMOVE', { key, oldValue } as StorageEventData)
  }

  /**
   * 인증 상태 변경 브로드캐스트
   */
  public broadcastAuthStateChange(event: string, session: any): void {
    this.broadcast('AUTH_STATE_CHANGE', { event, session })
  }

  /**
   * 이벤트 리스너 등록
   */
  public on(type: AuthEventType, listener: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    this.listeners.get(type)!.add(listener)

    // 언서브스크라이브 함수 반환
    return () => {
      this.listeners.get(type)?.delete(listener)
    }
  }

  /**
   * 고유 탭 ID 생성
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 현재 탭 ID 반환
   */
  public getTabId(): string {
    return this.tabId
  }

  /**
   * 리소스 정리
   */
  public cleanup(): void {
    console.log('🧹 [TabSync] Cleaning up...')
    
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []
    
    if (this.channel) {
      this.channel.close()
      this.channel = null
    }
    
    this.listeners.clear()
    TabSyncManager.instance = null
  }

  /**
   * 동기화 상태 확인
   */
  public getStatus(): {
    tabId: string
    isActive: boolean
    mode: 'broadcast' | 'fallback' | 'none'
    listenersCount: number
  } {
    return {
      tabId: this.tabId,
      isActive: this.channel !== null || this.isUsingFallback,
      mode: this.channel ? 'broadcast' : (this.isUsingFallback ? 'fallback' : 'none'),
      listenersCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0)
    }
  }
}