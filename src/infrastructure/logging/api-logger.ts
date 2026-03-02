import { workflowEventBus } from '@/infrastructure/events/workflow-event-bus'
import { createClient } from '@/infrastructure/database/server'

export class APILogger {
  private sessionId: string
  private isDebugMode: boolean
  
  constructor(sessionId: string, isDebugMode: boolean = false) {
    this.sessionId = sessionId
    this.isDebugMode = isDebugMode
  }
  
  async logAPICall(params: {
    apiType: 'gemini' | 'openai' | 'kipris' | 'rag'
    stage: string
    requestData: any  // Full data saved (no masking)
    responseData: any  // Full response saved (no masking)
    tokensUsed?: number
    executionTimeMs: number
    error?: string
  }) {
    try {
      const costEstimate = this.calculateCost(params.apiType, params.tokensUsed)
      
      // Calculate timestamps for generated column
      const requestTimestamp = new Date()
      const responseTimestamp = new Date(requestTimestamp.getTime() + params.executionTimeMs)
      
      // Save using regular client (RLS INSERT policy allows this)
      const logData = {
        session_id: this.sessionId,
        is_debug_mode: this.isDebugMode,
        stage: params.stage,
        api_type: params.apiType,
        request_data: params.requestData,
        response_data: params.responseData,
        tokens_used: params.tokensUsed || 0,
        cost_estimate: costEstimate,
        // execution_time_ms is a generated column - calculated from timestamps
        error_message: params.error,
        request_timestamp: requestTimestamp.toISOString(),
        response_timestamp: responseTimestamp.toISOString()
      }
      
      const supabase = await createClient()
      const { data: savedLog, error } = await supabase
        .schema('trademark_analysis')
        .from('api_call_logs')
        .insert(logData)
        .select()
        .single()
        
      if (error) {
        console.error('[APILogger] Failed to save:', error)
        console.error('[APILogger] Session ID:', this.sessionId)
        console.error('[APILogger] Log data:', logData)
      } else if (savedLog) {
        // EventEmitter로 API 호출 이벤트 발행
        workflowEventBus.emitWorkflowEvent({
          type: 'api_call',
          sessionId: this.sessionId,
          data: {
            stage: params.stage,
            api_type: params.apiType,
            execution_time_ms: params.executionTimeMs,
            tokens_used: params.tokensUsed || 0,
            cost_estimate: costEstimate,
            error_message: params.error,
            request_data: params.requestData,
            response_data: params.responseData
          }
        })
      }
    } catch (err) {
      console.error('[APILogger] Error:', err)
      // Don't let logging failures interrupt the main flow
    }
  }
  
  private calculateCost(apiType: string, tokens?: number): number {
    if (!tokens) return 0
    
    const rates: Record<string, number> = {
      gemini: 0.00025,  // $0.00025 per 1K tokens
      openai: 0.03,     // $0.03 per 1K tokens  
      rag: 0.0005,      // $0.0005 per 1K tokens
      kipris: 0         // Free
    }
    
    return (tokens / 1000) * (rates[apiType] || 0)
  }
}

// Global instance management
let globalLogger: APILogger | null = null

export function initializeAPILogger(sessionId: string, isDebugMode: boolean = false): APILogger {
  globalLogger = new APILogger(sessionId, isDebugMode)
  return globalLogger
}

export function getAPILogger(): APILogger | null {
  return globalLogger
}