export interface AuthProvider {
  name: string
  enabled: boolean
  signUp(data: SignUpData): Promise<AuthResult>
  signIn(data: SignInData): Promise<AuthResult>
  signOut(): Promise<void>
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
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  phone?: string
  avatar_url?: string
  role: string
  email_verified: boolean
  created_at: string
}

export interface SocialProvider {
  name: string
  enabled: boolean
  getAuthUrl(): Promise<string>
  handleCallback(code?: string): Promise<AuthResult>
}

export class AuthProviderManager {
  private providers: Map<string, AuthProvider> = new Map()
  private socialProviders: Map<string, SocialProvider> = new Map()

  registerProvider(provider: AuthProvider) {
    this.providers.set(provider.name, provider)
  }

  registerSocialProvider(provider: SocialProvider) {
    this.socialProviders.set(provider.name, provider)
  }

  getProvider(name: string): AuthProvider | undefined {
    return this.providers.get(name)
  }

  getSocialProvider(name: string): SocialProvider | undefined {
    return this.socialProviders.get(name)
  }

  getEnabledProviders(): AuthProvider[] {
    return Array.from(this.providers.values()).filter(p => p.enabled)
  }

  getEnabledSocialProviders(): SocialProvider[] {
    return Array.from(this.socialProviders.values()).filter(p => p.enabled)
  }
}