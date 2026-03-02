/**
 * Session Types
 *
 * Type definitions for session management
 * Replaces 'any' types with structured, validated types
 */

import { z } from 'zod'
import type { AuthUser } from './auth-user.types'

// === Session Status ===
export const SessionStatusSchema = z.enum([
  'active',
  'expired',
  'invalid',
  'refreshing',
])

export type SessionStatus = z.infer<typeof SessionStatusSchema>

// === Session Data ===
export const SessionDataSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  token_type: z.string().default('bearer'),
  user_id: z.string().uuid(),
})

export type SessionData = z.infer<typeof SessionDataSchema>

// === Session Info ===
export interface SessionInfo {
  id: string
  user: AuthUser
  accessToken: string
  refreshToken: string
  expiresAt: number
  expiresIn: number
  tokenType: string
  status: SessionStatus
  createdAt: string
  lastActivity: string
}

// === Session Event ===
export const SessionEventTypeSchema = z.enum([
  'SESSION_CREATED',
  'SESSION_REFRESHED',
  'SESSION_EXPIRED',
  'SESSION_INVALID',
  'TOKEN_REFRESHED',
  'USER_SIGNED_OUT',
  'USER_SESSION_DELETED',
])

export type SessionEventType = z.infer<typeof SessionEventTypeSchema>

export interface SessionEvent {
  type: SessionEventType
  timestamp: string
  sessionId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

// === Session Storage ===
export interface SessionStorage {
  getSession(): Promise<SessionData | null>
  setSession(session: SessionData): Promise<void>
  removeSession(): Promise<void>
  updateSession(updates: Partial<SessionData>): Promise<void>
}

// === Session Config ===
export interface SessionConfig {
  refreshThreshold: number // seconds before expiry to trigger refresh
  maxRetries: number
  retryDelay: number
  enableAutoRefresh: boolean
  enableTabSync: boolean
  storageKey: string
}

export const defaultSessionConfig: SessionConfig = {
  refreshThreshold: 300, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
  enableAutoRefresh: true,
  enableTabSync: true,
  storageKey: 'ipdr_session',
}

// === Session Validation ===

/**
 * Checks if session is expired
 */
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt * 1000
}

/**
 * Checks if session needs refresh
 */
export function needsRefresh(expiresAt: number, threshold: number): boolean {
  const now = Date.now() / 1000
  return expiresAt - now < threshold
}

/**
 * Validates session data
 */
export function validateSessionData(data: unknown): SessionData {
  return SessionDataSchema.parse(data)
}

/**
 * Type guard for session data
 */
export function isSessionData(data: unknown): data is SessionData {
  return SessionDataSchema.safeParse(data).success
}

/**
 * Calculates remaining time in seconds
 */
export function getRemainingTime(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now() / 1000)
}

/**
 * Formats remaining time as human-readable string
 */
export function formatRemainingTime(expiresAt: number): string {
  const remaining = getRemainingTime(expiresAt)
  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)

  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`
  }
  return `${seconds}초`
}

// === Session Tab Sync ===

export const TabSyncEventTypeSchema = z.enum([
  'SESSION_UPDATE',
  'SESSION_DELETE',
  'TOKEN_REFRESH',
  'AUTH_STATE_CHANGE',
  'SIGN_OUT',
])

export type TabSyncEventType = z.infer<typeof TabSyncEventTypeSchema>

export interface TabSyncMessage {
  type: TabSyncEventType
  timestamp: string
  sessionId?: string
  userId?: string
  payload?: Record<string, unknown>
}

export const TabSyncMessageSchema = z.object({
  type: TabSyncEventTypeSchema,
  timestamp: z.string().datetime(),
  sessionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  payload: z.record(z.unknown()).optional(),
})

/**
 * Validates tab sync message
 */
export function validateTabSyncMessage(data: unknown): TabSyncMessage {
  return TabSyncMessageSchema.parse(data)
}

/**
 * Type guard for tab sync message
 */
export function isTabSyncMessage(data: unknown): data is TabSyncMessage {
  return TabSyncMessageSchema.safeParse(data).success
}

// === Session Error ===

export enum SessionErrorCode {
  EXPIRED = 'SESSION_EXPIRED',
  INVALID = 'SESSION_INVALID',
  REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export class SessionError extends Error {
  constructor(
    public code: SessionErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SessionError'
  }
}

/**
 * Creates a session error
 */
export function createSessionError(
  code: SessionErrorCode,
  message: string,
  details?: Record<string, unknown>
): SessionError {
  return new SessionError(code, message, details)
}

/**
 * Checks if error is a session error
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError
}
