/**
 * Typed Database Tables
 *
 * Extends Supabase-generated types with concrete types for JSONB fields
 * Uses Discriminated Union pattern for type-safe narrowing
 */

import { Database } from '../supabase-generated'

// =============================================================================
// Base Table Types (from Supabase generated)
// =============================================================================

export type AnalysisSession = Database['trademark_analysis']['Tables']['analysis_sessions']['Row']
export type ApiCallLog = Database['trademark_analysis']['Tables']['api_call_logs']['Row']
export type DataProcessingLog = Database['trademark_analysis']['Tables']['data_processing_logs']['Row']
export type Profile = Database['user_management']['Tables']['profiles']['Row']
export type AdminActivityLog = Database['user_management']['Tables']['admin_activity_logs']['Row']
export type AdminPermission = Database['user_management']['Tables']['admin_permissions']['Row']

// =============================================================================
// API Types (CHECK constraint: gemini, openai, kipris, rag)
// =============================================================================

export type ApiType = 'gemini' | 'openai' | 'kipris' | 'rag'

// =============================================================================
// API Request Types (request_data JSONB field)
// =============================================================================

export interface GeminiRequest {
  model: string
  prompt: string
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  systemPrompt?: string
}

export interface OpenAIRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface KiprisRequest {
  trademarkName: string
  classCode?: string
  similarGroupCode?: string
  applicantName?: string
  applicationNumber?: string
  registrationNumber?: string
  searchType?: 'exact' | 'similar' | 'image'
}

export interface RagRequest {
  query: string
  context?: string
  maxResults?: number
  similarityThreshold?: number
  filters?: Record<string, unknown>
}

export type ApiRequestData =
  | GeminiRequest
  | OpenAIRequest
  | KiprisRequest
  | RagRequest

// =============================================================================
// API Response Types (response_data JSONB field)
// =============================================================================

export interface GeminiResponse {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  metadata?: Record<string, unknown>
}

export interface OpenAIResponse {
  id: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: 'stop' | 'length' | 'content_filter' | 'error'
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  created: number
}

export interface KiprisSearchResult {
  total: number
  items: Array<{
    applicationNumber: string
    trademarkName: string
    applicantName: string
    status: string
    classCode: string
    applicationDate: string
    registrationNumber?: string
    registrationDate?: string
    imageUrl?: string
  }>
  searchTime: number
}

export interface RagResponse {
  results: Array<{
    id: string
    content: string
    score: number
    metadata: Record<string, unknown>
  }>
  totalResults: number
  queryTime: number
}

export type ApiResponseData =
  | GeminiResponse
  | OpenAIResponse
  | KiprisSearchResult
  | RagResponse

// =============================================================================
// Typed API Call Log (with Discriminated Union)
// =============================================================================

type BaseApiCallLog = Omit<ApiCallLog, 'request_data' | 'response_data' | 'api_type'>

export type TypedApiCallLog =
  | (BaseApiCallLog & {
      api_type: 'gemini'
      request_data: GeminiRequest
      response_data: GeminiResponse | null
    })
  | (BaseApiCallLog & {
      api_type: 'openai'
      request_data: OpenAIRequest
      response_data: OpenAIResponse | null
    })
  | (BaseApiCallLog & {
      api_type: 'kipris'
      request_data: KiprisRequest
      response_data: KiprisSearchResult | null
    })
  | (BaseApiCallLog & {
      api_type: 'rag'
      request_data: RagRequest
      response_data: RagResponse | null
    })

// =============================================================================
// Data Processing Types
// =============================================================================

export type ProcessingType =
  | 'classification'
  | 'similarity_search'
  | 'image_analysis'
  | 'text_extraction'
  | 'risk_assessment'

export interface ClassificationInput {
  businessDescription: string
  keywords?: string[]
}

export interface ClassificationOutput {
  classCode: number
  className: string
  confidence: number
  suggestedProducts: string[]
}

export interface SimilaritySearchInput {
  trademarkName: string
  classCode: string
  similarGroupCode?: string
}

export interface SimilaritySearchOutput {
  results: Array<{
    applicationNumber: string
    similarity: number
    riskLevel: 'high' | 'medium' | 'low'
  }>
  totalFound: number
}

export interface ImageAnalysisInput {
  imageUrl: string
  analysisType: 'ocr' | 'visual_similarity' | 'logo_detection'
}

export interface ImageAnalysisOutput {
  extractedText?: string
  visualFeatures?: Record<string, unknown>
  logoInfo?: Record<string, unknown>
  confidence: number
}

export type ProcessingInputData =
  | ClassificationInput
  | SimilaritySearchInput
  | ImageAnalysisInput

export type ProcessingOutputData =
  | ClassificationOutput
  | SimilaritySearchOutput
  | ImageAnalysisOutput

// =============================================================================
// Typed Data Processing Log
// =============================================================================

type BaseDataProcessingLog = Omit<DataProcessingLog, 'input_data' | 'output_data' | 'processing_type'>

export type TypedDataProcessingLog =
  | (BaseDataProcessingLog & {
      processing_type: 'classification'
      input_data: ClassificationInput | null
      output_data: ClassificationOutput | null
    })
  | (BaseDataProcessingLog & {
      processing_type: 'similarity_search'
      input_data: SimilaritySearchInput | null
      output_data: SimilaritySearchOutput | null
    })
  | (BaseDataProcessingLog & {
      processing_type: 'image_analysis'
      input_data: ImageAnalysisInput | null
      output_data: ImageAnalysisOutput | null
    })

// =============================================================================
// Admin Activity Log Metadata
// =============================================================================

export interface AdminActivityMetadata {
  action: string
  targetType?: string
  targetId?: string
  changes?: Record<string, { old: unknown; new: unknown }>
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export type TypedAdminActivityLog = Omit<AdminActivityLog, 'metadata'> & {
  metadata: AdminActivityMetadata | null
}

// =============================================================================
// User Role Type (CHECK constraint: admin, manager, user, guest)
// =============================================================================

export type UserRole = 'admin' | 'manager' | 'user' | 'guest'

export type TypedProfile = Omit<Profile, 'role'> & {
  role: UserRole | null
}

// =============================================================================
// Insert & Update Types
// =============================================================================

export type AnalysisSessionInsert = Database['trademark_analysis']['Tables']['analysis_sessions']['Insert']
export type ApiCallLogInsert = Database['trademark_analysis']['Tables']['api_call_logs']['Insert']
export type DataProcessingLogInsert = Database['trademark_analysis']['Tables']['data_processing_logs']['Insert']
export type ProfileInsert = Database['user_management']['Tables']['profiles']['Insert']
export type AdminActivityLogInsert = Database['user_management']['Tables']['admin_activity_logs']['Insert']

export type AnalysisSessionUpdate = Database['trademark_analysis']['Tables']['analysis_sessions']['Update']
export type ApiCallLogUpdate = Database['trademark_analysis']['Tables']['api_call_logs']['Update']
export type DataProcessingLogUpdate = Database['trademark_analysis']['Tables']['data_processing_logs']['Update']
export type ProfileUpdate = Database['user_management']['Tables']['profiles']['Update']
export type AdminActivityLogUpdate = Database['user_management']['Tables']['admin_activity_logs']['Update']
