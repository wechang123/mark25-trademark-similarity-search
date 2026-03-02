import { EventEmitter } from 'events'

/**
 * 워크플로우 이벤트 타입 정의
 */
export type WorkflowEventType = 
  | 'workflow_event'
  | 'api_call'
  | 'data_processing'
  | 'session_update'
  | 'kipris_search'
  | 'final_result'
  | 'error'

export interface WorkflowEventPayload {
  type: WorkflowEventType
  sessionId: string
  data: any
  timestamp?: string
}

// Next.js 환경에서 프로세스 간 인스턴스 공유를 위한 global 설정
declare global {
  var workflowEventBusInstance: WorkflowEventBus | undefined
}

/**
 * 워크플로우 이벤트 버스 (싱글톤)
 * 실시간 이벤트 전파를 위한 중앙 이벤트 버스
 */
class WorkflowEventBus extends EventEmitter {
  private activeListeners: Map<string, Set<(...args: any[]) => any>> = new Map()
  // 이벤트 버퍼 (세션별로 최근 50개 이벤트 저장)
  private eventBuffer: Map<string, WorkflowEventPayload[]> = new Map()
  private readonly BUFFER_SIZE = 50
  private readonly instanceId = Math.random().toString(36).substring(7) // 인스턴스 식별자
  
  private constructor() {
    super()
    // 최대 리스너 수 설정 (메모리 누수 방지)
    this.setMaxListeners(100)
    console.log(`🏗️ [EventBus] New instance created with ID: ${this.instanceId}`)
  }
  
  /**
   * 싱글톤 인스턴스 반환 (Next.js 환경 대응)
   */
  static getInstance(): WorkflowEventBus {
    // development 환경에서 global 사용하여 HMR 시에도 인스턴스 유지
    if (process.env.NODE_ENV === 'development') {
      if (!globalThis.workflowEventBusInstance) {
        globalThis.workflowEventBusInstance = new WorkflowEventBus()
        console.log('✅ [EventBus] Global singleton instance created')
      } else {
        console.log(`♻️ [EventBus] Reusing global instance: ${globalThis.workflowEventBusInstance.instanceId}`)
      }
      return globalThis.workflowEventBusInstance
    }
    
    // production 환경에서는 일반 static 인스턴스 사용
    if (!WorkflowEventBus.instance) {
      WorkflowEventBus.instance = new WorkflowEventBus()
      console.log('✅ [EventBus] Singleton instance created')
    }
    return WorkflowEventBus.instance
  }
  
  private static instance: WorkflowEventBus
  
  /**
   * 워크플로우 이벤트 발행
   */
  emitWorkflowEvent(payload: WorkflowEventPayload) {
    const eventName = `workflow:${payload.sessionId}`
    const enrichedPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString()
    }
    
    // 이벤트를 버퍼에 저장
    if (!this.eventBuffer.has(payload.sessionId)) {
      this.eventBuffer.set(payload.sessionId, [])
    }
    const buffer = this.eventBuffer.get(payload.sessionId)!
    buffer.push(enrichedPayload)
    // 버퍼 크기 제한
    if (buffer.length > this.BUFFER_SIZE) {
      buffer.shift() // 가장 오래된 이벤트 제거
    }
    
    // 리스너 수 확인
    const listenerCount = this.listenerCount(eventName)
    const globalListenerCount = this.listenerCount('workflow:all')
    
    console.log(`🚀 [EventBus-${this.instanceId}] Emitting ${payload.type} for session ${payload.sessionId}`, {
      eventName,
      sessionListeners: listenerCount,
      globalListeners: globalListenerCount,
      activeSessionsCount: this.activeListeners.size,
      bufferedEvents: buffer.length,
      bufferKeys: Array.from(this.eventBuffer.keys()),
      payloadData: payload.data,
      hasEventData: payload.type === 'workflow_event' && payload.data?.event_data,
      eventDataKeys: payload.type === 'workflow_event' && payload.data?.event_data ? Object.keys(payload.data.event_data) : []
    })
    
    // 세션별 이벤트 발행
    this.emit(eventName, enrichedPayload)
    
    // 전역 이벤트 발행 (모니터링용)
    this.emit('workflow:all', enrichedPayload)
  }
  
  /**
   * 특정 세션의 이벤트 구독
   */
  subscribeToSession(
    sessionId: string,
    listener: (payload: WorkflowEventPayload) => void,
    replayBuffer: boolean = true
  ): () => void {
    const eventName = `workflow:${sessionId}`
    
    console.log(`📡 [EventBus-${this.instanceId}] New subscription for session ${sessionId}`, {
      eventName,
      currentListeners: this.listenerCount(eventName),
      hasBuffer: this.eventBuffer.has(sessionId),
      bufferSize: this.eventBuffer.get(sessionId)?.length || 0,
      allBufferKeys: Array.from(this.eventBuffer.keys())
    })
    
    // 리스너 추가
    this.on(eventName, listener)
    
    // 활성 리스너 추적 (메모리 관리)
    if (!this.activeListeners.has(sessionId)) {
      this.activeListeners.set(sessionId, new Set())
    }
    this.activeListeners.get(sessionId)!.add(listener)
    
    // 버퍼된 이벤트 재생 (옵션)
    if (replayBuffer && this.eventBuffer.has(sessionId)) {
      const bufferedEvents = this.eventBuffer.get(sessionId)!
      console.log(`🔄 [EventBus] Replaying ${bufferedEvents.length} buffered events for session ${sessionId}`)
      
      // 비동기로 버퍼된 이벤트 재생 (이벤트 루프 블로킹 방지)
      setTimeout(() => {
        bufferedEvents.forEach(event => {
          listener(event)
        })
      }, 0)
    }
    
    console.log(`✅ [EventBus] Subscription active for ${sessionId}, total listeners: ${this.listenerCount(eventName)}`)
    
    // 언마운트 함수 반환
    return () => {
      console.log(`🔌 [EventBus] Unsubscribing from session ${sessionId}`)
      this.removeListener(eventName, listener)
      const listeners = this.activeListeners.get(sessionId)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.activeListeners.delete(sessionId)
        }
      }
    }
  }
  
  /**
   * 모든 워크플로우 이벤트 구독 (관리자 모니터링용)
   */
  subscribeToAll(
    listener: (payload: WorkflowEventPayload) => void
  ): () => void {
    this.on('workflow:all', listener)
    
    return () => {
      this.removeListener('workflow:all', listener)
    }
  }
  
  /**
   * 특정 세션의 모든 리스너 제거
   */
  cleanupSession(sessionId: string) {
    const eventName = `workflow:${sessionId}`
    this.removeAllListeners(eventName)
    this.activeListeners.delete(sessionId)
    // 버퍼도 정리 (선택적 - 메모리 절약)
    // this.eventBuffer.delete(sessionId)
    
    console.log(`🧹 [EventBus] Cleaned up listeners for session ${sessionId}`)
  }
  
  /**
   * 세션의 버퍼된 이벤트 가져오기
   */
  getBufferedEvents(sessionId: string): WorkflowEventPayload[] {
    const events = this.eventBuffer.get(sessionId) || []
    console.log(`📦 [EventBus-${this.instanceId}] Getting buffered events for ${sessionId}:`, {
      found: events.length,
      allKeys: Array.from(this.eventBuffer.keys()),
      requestedKey: sessionId
    })
    return events
  }
  
  /**
   * 활성 리스너 수 확인 (디버깅용)
   */
  getActiveListenerCount(): number {
    let total = 0
    this.activeListeners.forEach(listeners => {
      total += listeners.size
    })
    return total
  }
  
  /**
   * 세션별 활성 리스너 정보 (디버깅용)
   */
  getActiveSessionInfo(): { sessionId: string; listenerCount: number }[] {
    const info: { sessionId: string; listenerCount: number }[] = []
    this.activeListeners.forEach((listeners, sessionId) => {
      info.push({ sessionId, listenerCount: listeners.size })
    })
    return info
  }
}

// 싱글톤 인스턴스 export
export const workflowEventBus = WorkflowEventBus.getInstance()

// 타입 export
export type { WorkflowEventBus }