// Authentication feature public API exports

// Context Provider (Root Layer)
export { AuthProvider, useAuthContext } from './_contexts/AuthContext'

// Components (UI Layer)
export { AuthFormContainer } from './_components'
export { SignupForm } from './_components'
export { SigninForm } from './_components'
export { AuthButton } from './_components'
export { UnifiedAuthForm } from './_components'
export { SocialButtons } from './_components'

// Hooks (State Management Layer)
export { useAuth } from './_hooks'
export { useSignup } from './_hooks'
export { useSignin } from './_hooks'

// Types (Type Definitions)
export type {
  AuthUser,
  SecureAuthState,
  SignUpData,
  SignInData,
  AuthResult,
  AuthHookResult,
  SignupHookResult,
  SigninHookResult
} from './_types'

// Services (Business Logic Layer) - re-exported from service layer
export type {
  AuthProvider as AuthProviderType,
  SocialProvider
} from './_services/providers'