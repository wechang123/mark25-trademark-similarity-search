export interface APILogEntry {
  session_id: string
  stage: string
  api_type: 'gemini' | 'openai' | 'kipris' | 'rag'
  request_data: any
  response_data: any
  tokens_used: number
  cost_estimate: number
  execution_time_ms: number
  error_message?: string
  request_timestamp: string
}

export interface APILogParams {
  apiType: 'gemini' | 'openai' | 'kipris' | 'rag'
  stage: string
  requestData: any
  responseData: any
  tokensUsed?: number
  executionTimeMs: number
  error?: string
}

export interface DebugSession {
  sessionId: string
  isDebugMode: boolean
}