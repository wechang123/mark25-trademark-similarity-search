/**
 * Auth User Types
 *
 * Comprehensive type definitions for authentication user data
 * Replaces 'any' types with structured, validated types
 */

import { z } from 'zod'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// === User Role ===
export const UserRoleSchema = z.enum(['admin', 'manager', 'user', 'guest'])
export type UserRole = z.infer<typeof UserRoleSchema>

// === Social Provider ===
export const SocialProviderSchema = z.enum(['kakao', 'naver', 'google', 'email'])
export type SocialProvider = z.infer<typeof SocialProviderSchema>

// === User Metadata ===
export const UserMetadataSchema = z.object({
  full_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  provider: SocialProviderSchema.optional(),
  provider_id: z.string().optional(),
  email_verified: z.boolean().optional(),
  phone_verified: z.boolean().optional(),
})

export type UserMetadata = z.infer<typeof UserMetadataSchema>

// === App Metadata (Admin-level metadata) ===
export const AppMetadataSchema = z.object({
  role: UserRoleSchema.optional(),
  permissions: z.array(z.string()).optional(),
  organization_id: z.string().uuid().optional(),
  last_sign_in_at: z.string().datetime().optional(),
  sign_in_count: z.number().int().optional(),
})

export type AppMetadata = z.infer<typeof AppMetadataSchema>

// === Auth User (Application-level user) ===
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  provider: SocialProviderSchema.optional(),
  provider_id: z.string().optional(),
  email_verified: z.boolean(),
  phone_verified: z.boolean().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_sign_in_at: z.string().datetime().optional(),
})

export type AuthUser = z.infer<typeof AuthUserSchema>

// === User Profile (Database profile) ===
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  role: UserRoleSchema,
  email_verified: z.boolean(),
  phone_verified: z.boolean().optional(),
  provider: SocialProviderSchema.optional(),
  provider_id: z.string().optional(),
  last_sign_in_at: z.string().datetime().optional(),
  sign_in_count: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// === Secure Auth State (for AuthContext) ===
export interface SecureAuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

// === Auth Session ===
export const AuthSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  token_type: z.string(),
  user: AuthUserSchema,
})

export type AuthSession = z.infer<typeof AuthSessionSchema>

// === Sign In Credentials ===
export const SignInCredentialsSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

export type SignInCredentials = z.infer<typeof SignInCredentialsSchema>

// === Sign Up Data ===
export const SignUpDataSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호는 대문자를 포함해야 합니다')
    .regex(/[a-z]/, '비밀번호는 소문자를 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').optional(),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 전화번호를 입력해주세요').optional(),
  metadata: UserMetadataSchema.optional(),
})

export type SignUpData = z.infer<typeof SignUpDataSchema>

// === Social Auth Data ===
export const SocialAuthDataSchema = z.object({
  provider: SocialProviderSchema,
  provider_id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  access_token: z.string(),
  refresh_token: z.string().optional(),
})

export type SocialAuthData = z.infer<typeof SocialAuthDataSchema>

// === Password Reset Request ===
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>

// === Password Update ===
export const PasswordUpdateSchema = z.object({
  new_password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호는 대문자를 포함해야 합니다')
    .regex(/[a-z]/, '비밀번호는 소문자를 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다'),
})

export type PasswordUpdate = z.infer<typeof PasswordUpdateSchema>

// === Validation Helpers ===

/**
 * Validates sign in credentials
 */
export function validateSignInCredentials(data: unknown): SignInCredentials {
  return SignInCredentialsSchema.parse(data)
}

/**
 * Validates sign up data
 */
export function validateSignUpData(data: unknown): SignUpData {
  return SignUpDataSchema.parse(data)
}

/**
 * Safely validates sign up data
 */
export function safeValidateSignUpData(data: unknown): {
  success: boolean
  data?: SignUpData
  error?: z.ZodError
} {
  const result = SignUpDataSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Type guard for AuthUser
 */
export function isAuthUser(data: unknown): data is AuthUser {
  return AuthUserSchema.safeParse(data).success
}

/**
 * Type guard for UserProfile
 */
export function isUserProfile(data: unknown): data is UserProfile {
  return UserProfileSchema.safeParse(data).success
}

/**
 * Converts Supabase User to AuthUser
 */
export function supabaseUserToAuthUser(supabaseUser: SupabaseUser, profile?: UserProfile): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    role: profile?.role || (supabaseUser.user_metadata?.role as UserRole) || 'user',
    name: profile?.name || supabaseUser.user_metadata?.full_name,
    phone: profile?.phone || supabaseUser.user_metadata?.phone,
    avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
    provider: profile?.provider || (supabaseUser.app_metadata?.provider as SocialProvider),
    provider_id: profile?.provider_id || supabaseUser.app_metadata?.provider_id,
    email_verified: supabaseUser.email_confirmed_at ? true : false,
    phone_verified: profile?.phone_verified || false,
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at || supabaseUser.created_at,
    last_sign_in_at: supabaseUser.last_sign_in_at || undefined,
  }
}

// === Helper Functions ===

/**
 * Checks if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Checks if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin')
}

/**
 * Checks if user is manager
 */
export function isManager(user: AuthUser | null): boolean {
  return hasRole(user, 'manager')
}

/**
 * Checks if user is regular user
 */
export function isRegularUser(user: AuthUser | null): boolean {
  return hasRole(user, 'user')
}

/**
 * Sanitizes user data (removes sensitive information)
 */
export function sanitizeUserData(user: AuthUser): Omit<AuthUser, 'provider_id'> {
  const { provider_id, ...sanitized } = user
  return sanitized
}
