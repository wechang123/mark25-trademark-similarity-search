import { createClient } from '@/infrastructure/database/server'
import { workflowEventBus } from '@/infrastructure/events/workflow-event-bus'

export type WorkflowStage = 'goods_classification' | 'kipris_search' | 'final_analysis'
export type WorkflowStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface WorkflowEventData {
  [key: string]: any
}

/**
 * 워크플로우 이벤트를 기록합니다.
 */
export async function recordWorkflowEvent(
  sessionId: string,
  stage: WorkflowStage,
  substep: string,
  status: WorkflowStatus,
  eventData?: WorkflowEventData,
  errorMessage?: string,
  isDebugMode?: boolean
) {
  const supabase = await createClient()
  
  const eventRecord = {
    session_id: sessionId,
    stage,
    substep,
    status,
    started_at: status === 'processing' ? new Date().toISOString() : null,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    event_data: eventData || {},
    error_message: errorMessage,
    is_debug_mode: isDebugMode || false
  }
  
  const { data, error } = await supabase
    .schema('trademark_analysis')
    .from('workflow_events')
    .insert(eventRecord)
    .select()
    .single()
  
  if (error) {
    console.error('❌ [recordWorkflowEvent] Failed to record workflow event:', {
      error,
      sessionId,
      stage,
      substep,
      status,
      errorDetails: error.message || 'Unknown error'
    })
    // Even if DB fails, try to emit the event for real-time updates
    workflowEventBus.emitWorkflowEvent({
      type: 'workflow_event',
      sessionId,
      data: {
        stage,
        substep,
        status,
        started_at: eventRecord.started_at,
        completed_at: eventRecord.completed_at,
        event_data: eventData || {},
        error_message: errorMessage || 'DB save failed'
      }
    })
    return null
  }
  
  // EventEmitter로 실시간 이벤트 발행
  workflowEventBus.emitWorkflowEvent({
    type: 'workflow_event',
    sessionId,
    data: {
      stage,
      substep,
      status,
      started_at: eventRecord.started_at,
      completed_at: eventRecord.completed_at,
      event_data: eventData || {},
      error_message: errorMessage
    }
  })
  
  return data
}

/**
 * 유사군 코드 추출 이벤트 기록
 */
export async function recordGoodsClassificationEvent(
  sessionId: string,
  substep: 'extract_query' | 'rag_search' | 'select_products',
  status: WorkflowStatus,
  eventData?: {
    query?: string
    rag_results?: any[]
    selected_products?: string[]
    primary_similar_group_code?: string | null
    primary_products?: string[]
    similar_codes?: string[]
    classification_codes?: number[]
  },
  isDebugMode?: boolean
) {
  return recordWorkflowEvent(sessionId, 'goods_classification', substep, status, eventData, undefined, isDebugMode)
}

/**
 * KIPRIS 검색 이벤트 기록
 */
export async function recordKiprisSearchEvent(
  sessionId: string,
  substep: 'kipris_request' | 'kipris_response' | 'data_processing',
  status: WorkflowStatus,
  eventData?: {
    query?: string
    request_timestamp?: string
    total_results?: number
    response_time_ms?: number
    filtered_count?: number
    high_risk_count?: number
    search_results?: any[]
  },
  isDebugMode?: boolean
) {
  return recordWorkflowEvent(sessionId, 'kipris_search', substep, status, eventData, undefined, isDebugMode)
}

/**
 * 종합 분석 이벤트 기록
 */
export async function recordFinalAnalysisEvent(
  sessionId: string,
  substep: 'analysis_request' | 'analysis_response' | 'prepare_report',
  status: WorkflowStatus,
  eventData?: {
    model_used?: string
    request_timestamp?: string
    scores?: {
      designated_goods?: number
      distinctiveness?: number
      prior_similarity?: number
    }
    response_time_ms?: number
    registration_probability?: number
    risk_level?: string
    recommendations?: string[]
  },
  isDebugMode?: boolean
) {
  return recordWorkflowEvent(sessionId, 'final_analysis', substep, status, eventData, undefined, isDebugMode)
}

/**
 * 세션의 현재 진행 상태 업데이트
 */
export async function updateSessionProgress(
  sessionId: string,
  updates: {
    current_stage?: WorkflowStage
    current_substep?: string
    progress?: number
    status?: string
    workflow_metadata?: any
  }
) {
  const supabase = await createClient()
  
  const { data: updatedSession, error } = await supabase
    .schema('trademark_analysis')
    .from('analysis_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to update session progress:', error)
    return false
  }
  
  // EventEmitter로 세션 업데이트 이벤트 발행
  if (updatedSession) {
    workflowEventBus.emitWorkflowEvent({
      type: 'session_update',
      sessionId,
      data: updatedSession
    })
  }
  
  return true
}