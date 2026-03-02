import { TrademarkInfo } from '@/features/trademark-analysis/_types/trademark.types'

// Database response types
export interface WorkflowSession {
  id: string
  user_id: string | null
  trademark_name: string
  trademark_type: 'text' | 'image' | 'combined'
  business_description: string
  status: 'active' | 'processing' | 'briefing' | 'confirming' | 'completed' | 'failed'
  progress: number
  product_classification_codes?: string[]
  similar_group_codes?: string[]
  designated_products?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  stage2_started_at?: string
  stage2_completed_at?: string
  stage3_started_at?: string
  stage3_completed_at?: string
}

export interface APICallLog {
  id: string
  session_id: string
  stage: 'goods_classifier' | 'kipris_search' | 'final_analysis'
  api_type: 'gemini' | 'openai' | 'kipris' | 'rag'
  request_timestamp: string
  response_timestamp?: string
  request_data: any
  response_data?: any
  tokens_used?: number
  cost_estimate?: number
  error_message?: string
  execution_time_ms?: number
}

export interface DataProcessingLog {
  id: string
  session_id: string
  stage: string
  process_type: 'duplicate_removal' | 'similarity_filtering' | 'code_overlap_check' | 
                'similarity_score_calculation' | 'risk_level_classification' | 
                'data_transformation' | 'json_parsing' | 'array_processing'
  input_count: number
  output_count: number
  processing_details?: any
  timestamp: string
}

export interface WorkflowCheckpoint {
  id: string
  session_id: string
  current_step: string
  current_sub_step?: string
  current_question_type?: string
  state_data?: any
  progress: number
  execution_time_ms?: number
  retry_count: number
  created_at: string
}

export interface KiprisSearchResult {
  id: string
  session_id: string
  search_type: 'advanced' | 'free' | 'name'
  trademark_query: string
  classification_codes?: number[]
  total_results: number
  search_results?: any
  search_success: boolean
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'unknown'
  same_industry_count: number
  created_at: string
}

export interface FinalResult {
  id: string
  session_id: string
  registration_probability: number
  ai_confidence: number
  risk_level: 'low' | 'medium' | 'high' | 'unknown'
  key_findings?: string[]
  legal_risks?: string[]
  strategic_recommendations?: string[]
  report_data?: any
  expert_analysis_summary?: string
  created_at: string
}

// UI Display types
export interface WorkflowSubstep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime?: string
  endTime?: string
  data?: any
  apiCall?: {
    request: any
    response: any
    tokensUsed?: number
    executionTimeMs?: number
    cost?: number
  }
}

export interface WorkflowStage {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime?: string
  endTime?: string
  substeps?: WorkflowSubstep[]
  request?: any
  response?: any
  metadata?: {
    tokensUsed?: number
    executionTimeMs?: number
    cost?: number
    inputCount?: number
    outputCount?: number
    searchCount?: number
    filteredCount?: number
    confidence?: number
  }
  dataProcessing?: DataProcessingLog[]
  error?: string
}

export interface WorkflowData extends TrademarkInfo {
  sessionId: string
  stages: WorkflowStage[]
  currentProgress: number
  checkpoints?: WorkflowCheckpoint[]
  finalResult?: FinalResult
}

// API Response types
export interface WorkflowListItem {
  id: string
  trademark_name: string
  user_id?: string
  status: string
  created_at: string
  progress: number
}

export interface WorkflowDetailResponse {
  session: WorkflowSession
  apiCalls: APICallLog[]
  dataProcessing: DataProcessingLog[]
  checkpoints: WorkflowCheckpoint[]
  kiprisSearches?: KiprisSearchResult[]
  finalResult?: FinalResult
}

// Utility type for stage mapping
export const STAGE_NAMES: Record<string, string> = {
  'goods_classifier': '유사군 분석',
  'kipris_search': 'KIPRIS 검색',
  'final_analysis': 'AI 최종 분석',
  'stage1': '정보 수집',
  'stage2': 'KIPRIS 검색',
  'stage3': '최종 분석'
}

export const getStageStatus = (
  stage: string,
  session: WorkflowSession,
  apiCalls: APICallLog[]
): 'pending' | 'processing' | 'completed' | 'failed' => {
  const stageCalls = apiCalls.filter(call => call.stage === stage)
  
  if (stageCalls.length === 0) {
    return 'pending'
  }
  
  const lastCall = stageCalls[stageCalls.length - 1]
  
  if (lastCall.error_message) {
    return 'failed'
  }
  
  if (lastCall.response_timestamp) {
    return 'completed'
  }
  
  return 'processing'
}