export interface AuthUser {
  readonly id: string
  readonly email: string
  readonly name?: string
  readonly phone?: string
  readonly avatar_url?: string
  readonly marketing_agreed?: boolean
  readonly role: string
  readonly provider?: 'email' | 'kakao'
  readonly email_verified: boolean
  readonly created_at: string
}

export interface SecureAuthState {
  readonly user: AuthUser | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly isInitialized: boolean
}

export interface SignUpData {
  email: string
  password: string
  name?: string
  phone?: string
  marketingAgreed?: boolean
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
  requiresVerification?: boolean
  message?: string
}

export interface AuthHookResult {
  readonly state: SecureAuthState
  readonly actions: {
    readonly signOut: () => Promise<void>
    readonly refreshUser: () => Promise<void>
  }
}

export interface SignupHookResult {
  readonly signup: (data: SignUpData) => Promise<AuthResult>
  readonly isLoading: boolean
  readonly error: string | null
  readonly clearError: () => void
}

export interface SigninHookResult {
  readonly signin: (data: SignInData) => Promise<AuthResult>
  readonly isLoading: boolean
  readonly error: string | null
  readonly clearError: () => void
}