/**
 * 세션 매니저
 * 탭 간 세션 동기화 및 중복 요청 방지를 위한 락 메커니즘 구현
 */

import { TabSyncManager } from './tab-sync'

interface SessionLock {
  tabId: string
  operation: string
  timestamp: number
}

interface SessionData {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
  user?: any
}

export class SessionManager {
  private static instance: SessionManager | null = null
  private tabSync: TabSyncManager
  private readonly LOCK_KEY = 'sb-auth-lock'
  private readonly SESSION_KEY = 'sb-auth-session'
  private readonly LOCK_TIMEOUT = 5000 // 5초
  private readonly REFRESH_BUFFER = 60000 // 1분 (토큰 만료 전 갱신)

  private constructor() {
    this.tabSync = TabSyncManager.getInstance()
    this.setupEventListeners()
    console.log('🔐 [SessionManager] Initialized')
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 다른 탭의 세션 업데이트 수신
    this.tabSync.on('SESSION_UPDATE', (data) => {
      console.log('📨 [SessionManager] Received session update from another tab')
      this.handleRemoteSessionUpdate(data)
    })

    // 다른 탭의 토큰 갱신 완료 수신
    this.tabSync.on('TOKEN_REFRESH', (data) => {
      console.log('📨 [SessionManager] Received token refresh from another tab')
      this.handleRemoteTokenRefresh(data)
    })
  }

  /**
   * 작업 락 획득
   * 동시에 여러 탭에서 같은 작업을 수행하지 않도록 방지
   */
  public async acquireLock(operation: string): Promise<boolean> {
    const tabId = this.tabSync.getTabId()
    const now = Date.now()
    
    try {
      const existingLock = this.getLock()
      
      if (existingLock) {
        // 만료된 락인지 확인
        if (now - existingLock.timestamp < this.LOCK_TIMEOUT) {
          console.log(`🔒 [SessionManager] Lock held by ${existingLock.tabId} for ${operation}`)
          return false
        }
        
        console.log(`🔓 [SessionManager] Expired lock removed for ${operation}`)
      }

      // 새 락 생성
      const newLock: SessionLock = {
        tabId,
        operation,
        timestamp: now
      }
      
      localStorage.setItem(this.LOCK_KEY, JSON.stringify(newLock))
      
      // 락 획득 직후 다시 확인 (race condition 방지)
      await this.delay(10)
      const currentLock = this.getLock()
      
      if (currentLock?.tabId !== tabId) {
        console.log(`⚠️ [SessionManager] Lost lock race for ${operation}`)
        return false
      }
      
      console.log(`✅ [SessionManager] Acquired lock for ${operation}`)
      return true
    } catch (error) {
      console.error('[SessionManager] Error acquiring lock:', error)
      return false
    }
  }

  /**
   * 작업 락 해제
   */
  public releaseLock(operation: string): void {
    const tabId = this.tabSync.getTabId()
    const currentLock = this.getLock()
    
    if (currentLock?.tabId === tabId && currentLock.operation === operation) {
      localStorage.removeItem(this.LOCK_KEY)
      console.log(`🔓 [SessionManager] Released lock for ${operation}`)
    }
  }

  /**
   * 현재 락 조회
   */
  private getLock(): SessionLock | null {
    try {
      const lockData = localStorage.getItem(this.LOCK_KEY)
      return lockData ? JSON.parse(lockData) : null
    } catch {
      return null
    }
  }

  /**
   * 세션 저장
   * @param session - 저장할 세션 데이터
   * @param shouldBroadcast - 다른 탭에 브로드캐스트할지 여부 (기본값: true)
   */
  public saveSession(session: SessionData, shouldBroadcast: boolean = true): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))

      if (shouldBroadcast) {
        // 다른 탭에 세션 업데이트 알림
        this.tabSync.broadcast('SESSION_UPDATE', session)
        console.log('💾 [SessionManager] Session saved and broadcasted')
      } else {
        console.log('💾 [SessionManager] Session saved (no broadcast)')
      }
    } catch (error) {
      console.error('[SessionManager] Error saving session:', error)
    }
  }

  /**
   * 세션 조회
   */
  public getSession(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      return sessionData ? JSON.parse(sessionData) : null
    } catch {
      return null
    }
  }

  /**
   * 세션 삭제
   */
  public clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.LOCK_KEY)
    console.log('🗑️ [SessionManager] Session cleared')
  }

  /**
   * 토큰 갱신 필요 여부 확인
   */
  public shouldRefreshToken(): boolean {
    const session = this.getSession()
    
    if (!session || !session.expires_at) {
      return false
    }
    
    const now = Date.now() / 1000
    const expiresAt = session.expires_at
    
    // 만료 1분 전에 갱신
    return expiresAt - now < this.REFRESH_BUFFER / 1000
  }

  /**
   * 토큰 갱신 조율
   * 하나의 탭만 실제 갱신 수행, 나머지는 결과 대기
   */
  public async coordinateTokenRefresh(
    refreshCallback: () => Promise<SessionData | null>
  ): Promise<SessionData | null> {
    const hasLock = await this.acquireLock('token_refresh')
    
    if (hasLock) {
      // 이 탭이 토큰 갱신 수행
      try {
        console.log('🔄 [SessionManager] Performing token refresh')
        const newSession = await refreshCallback()
        
        if (newSession) {
          this.saveSession(newSession)
          this.tabSync.broadcast('TOKEN_REFRESH', { 
            success: true, 
            session: newSession 
          })
        }
        
        return newSession
      } finally {
        this.releaseLock('token_refresh')
      }
    } else {
      // 다른 탭이 갱신 중, 결과 대기
      console.log('⏳ [SessionManager] Waiting for token refresh from another tab')
      return await this.waitForTokenRefresh()
    }
  }

  /**
   * 토큰 갱신 완료 대기
   */
  private async waitForTokenRefresh(): Promise<SessionData | null> {
    const maxWaitTime = 10000 // 10초
    const checkInterval = 100 // 100ms마다 확인
    const startTime = Date.now()
    
    return new Promise((resolve) => {
      const checkLock = setInterval(() => {
        const lock = this.getLock()
        
        // 락이 해제되었거나 타임아웃
        if (!lock || lock.operation !== 'token_refresh' || 
            Date.now() - startTime > maxWaitTime) {
          clearInterval(checkLock)
          const session = this.getSession()
          resolve(session)
        }
      }, checkInterval)
    })
  }

  /**
   * 원격 세션 업데이트 처리
   */
  private handleRemoteSessionUpdate(data: any): void {
    // 로컬 스토리지는 이미 업데이트됨 (다른 탭에서)
    // 필요시 추가 처리
    console.log('🔄 [SessionManager] Session updated from remote tab')
  }

  /**
   * 원격 토큰 갱신 처리
   */
  private handleRemoteTokenRefresh(data: any): void {
    if (data.success) {
      console.log('✅ [SessionManager] Token refreshed by another tab')
    } else {
      console.log('❌ [SessionManager] Token refresh failed in another tab')
    }
  }

  /**
   * 유틸리티: 지연
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 세션 매니저 상태 조회
   */
  public getStatus(): {
    hasSession: boolean
    hasLock: boolean
    currentLock: SessionLock | null
    needsRefresh: boolean
  } {
    return {
      hasSession: this.getSession() !== null,
      hasLock: this.getLock()?.tabId === this.tabSync.getTabId(),
      currentLock: this.getLock(),
      needsRefresh: this.shouldRefreshToken()
    }
  }

  /**
   * 리소스 정리
   */
  public cleanup(): void {
    console.log('🧹 [SessionManager] Cleaning up...')
    SessionManager.instance = null
  }
}