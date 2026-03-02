/**
 * Type Guards for Database Types
 *
 * Runtime type checking functions for Discriminated Unions
 * Enables type-safe narrowing in TypeScript
 */

import {
  TypedApiCallLog,
  TypedDataProcessingLog,
  ApiType,
  ProcessingType,
  UserRole,
  GeminiRequest,
  OpenAIRequest,
  KiprisRequest,
  RagRequest,
  GeminiResponse,
  OpenAIResponse,
  KiprisSearchResult,
  RagResponse,
} from './typed-tables'

// =============================================================================
// API Type Guards
// =============================================================================

/**
 * Checks if a string is a valid ApiType
 */
export function isValidApiType(type: string): type is ApiType {
  return ['gemini', 'openai', 'kipris', 'rag'].includes(type)
}

/**
 * Type guard for Gemini API call log
 */
export function isGeminiLog(
  log: TypedApiCallLog
): log is TypedApiCallLog & { api_type: 'gemini' } {
  return log.api_type === 'gemini'
}

/**
 * Type guard for OpenAI API call log
 */
export function isOpenAILog(
  log: TypedApiCallLog
): log is TypedApiCallLog & { api_type: 'openai' } {
  return log.api_type === 'openai'
}

/**
 * Type guard for KIPRIS API call log
 */
export function isKiprisLog(
  log: TypedApiCallLog
): log is TypedApiCallLog & { api_type: 'kipris' } {
  return log.api_type === 'kipris'
}

/**
 * Type guard for RAG API call log
 */
export function isRagLog(
  log: TypedApiCallLog
): log is TypedApiCallLog & { api_type: 'rag' } {
  return log.api_type === 'rag'
}

// =============================================================================
// API Request Type Guards
// =============================================================================

/**
 * Type guard for Gemini request
 */
export function isGeminiRequest(data: unknown): data is GeminiRequest {
  if (typeof data !== 'object' || data === null) return false
  const request = data as Record<string, unknown>
  return (
    typeof request.model === 'string' &&
    typeof request.prompt === 'string'
  )
}

/**
 * Type guard for OpenAI request
 */
export function isOpenAIRequest(data: unknown): data is OpenAIRequest {
  if (typeof data !== 'object' || data === null) return false
  const request = data as Record<string, unknown>
  return (
    typeof request.model === 'string' &&
    Array.isArray(request.messages)
  )
}

/**
 * Type guard for KIPRIS request
 */
export function isKiprisRequest(data: unknown): data is KiprisRequest {
  if (typeof data !== 'object' || data === null) return false
  const request = data as Record<string, unknown>
  return typeof request.trademarkName === 'string'
}

/**
 * Type guard for RAG request
 */
export function isRagRequest(data: unknown): data is RagRequest {
  if (typeof data !== 'object' || data === null) return false
  const request = data as Record<string, unknown>
  return typeof request.query === 'string'
}

// =============================================================================
// API Response Type Guards
// =============================================================================

/**
 * Type guard for Gemini response
 */
export function isGeminiResponse(data: unknown): data is GeminiResponse {
  if (typeof data !== 'object' || data === null) return false
  const response = data as Record<string, unknown>
  return (
    typeof response.text === 'string' &&
    typeof response.usage === 'object'
  )
}

/**
 * Type guard for OpenAI response
 */
export function isOpenAIResponse(data: unknown): data is OpenAIResponse {
  if (typeof data !== 'object' || data === null) return false
  const response = data as Record<string, unknown>
  return (
    typeof response.id === 'string' &&
    Array.isArray(response.choices)
  )
}

/**
 * Type guard for KIPRIS search result
 */
export function isKiprisSearchResult(data: unknown): data is KiprisSearchResult {
  if (typeof data !== 'object' || data === null) return false
  const response = data as Record<string, unknown>
  return (
    typeof response.total === 'number' &&
    Array.isArray(response.items)
  )
}

/**
 * Type guard for RAG response
 */
export function isRagResponse(data: unknown): data is RagResponse {
  if (typeof data !== 'object' || data === null) return false
  const response = data as Record<string, unknown>
  return (
    Array.isArray(response.results) &&
    typeof response.totalResults === 'number'
  )
}

// =============================================================================
// Processing Type Guards
// =============================================================================

/**
 * Checks if a string is a valid ProcessingType
 */
export function isValidProcessingType(type: string): type is ProcessingType {
  return [
    'classification',
    'similarity_search',
    'image_analysis',
    'text_extraction',
    'risk_assessment',
  ].includes(type)
}

/**
 * Type guard for classification processing log
 */
export function isClassificationLog(
  log: TypedDataProcessingLog
): log is TypedDataProcessingLog & { processing_type: 'classification' } {
  return log.processing_type === 'classification'
}

/**
 * Type guard for similarity search processing log
 */
export function isSimilaritySearchLog(
  log: TypedDataProcessingLog
): log is TypedDataProcessingLog & { processing_type: 'similarity_search' } {
  return log.processing_type === 'similarity_search'
}

/**
 * Type guard for image analysis processing log
 */
export function isImageAnalysisLog(
  log: TypedDataProcessingLog
): log is TypedDataProcessingLog & { processing_type: 'image_analysis' } {
  return log.processing_type === 'image_analysis'
}

// =============================================================================
// User Role Type Guards
// =============================================================================

/**
 * Checks if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return ['admin', 'manager', 'user', 'guest'].includes(role)
}

/**
 * Type guard for admin role
 */
export function isAdmin(role: string | null): role is 'admin' {
  return role === 'admin'
}

/**
 * Type guard for manager role
 */
export function isManager(role: string | null): role is 'manager' {
  return role === 'manager'
}

/**
 * Type guard for user role
 */
export function isUser(role: string | null): role is 'user' {
  return role === 'user'
}

/**
 * Type guard for guest role
 */
export function isGuest(role: string | null): role is 'guest' {
  return role === 'guest'
}

/**
 * Checks if role has admin or manager privileges
 */
export function hasAdminPrivileges(role: string | null): boolean {
  return isAdmin(role) || isManager(role)
}

// =============================================================================
// Generic Type Guards
// =============================================================================

/**
 * Type guard for checking if value is non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard for checking if value is non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard for checking if value is positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0
}

/**
 * Type guard for checking if array has elements
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}
