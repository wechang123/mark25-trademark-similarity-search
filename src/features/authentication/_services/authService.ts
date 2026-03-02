import { createClient } from '@/infrastructure/database/client'
import { SessionManager } from '@/infrastructure/auth/session-manager'
import { TabSyncManager } from '@/infrastructure/auth/tab-sync'
import type { AuthUser, SignUpData, SignInData, AuthResult } from '../_types'
import type { SupabaseClient, Provider } from '@supabase/supabase-js'

class AuthService {
  private supabase: SupabaseClient
  private sessionManager: SessionManager | null = null
  private tabSync: TabSyncManager | null = null

  constructor() {
    // Create new client instance for each service instance
    this.supabase = createClient()

    // Get singleton managers
    if (typeof window !== 'undefined') {
      this.sessionManager = SessionManager.getInstance()
      this.tabSync = TabSyncManager.getInstance()
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return null
      }

      const { data: profile } = await this.supabase
        .schema('user_management')
        .from('profiles')
        .select('name, phone, avatar_url, role, marketing_agreed, provider')
        .eq('id', session.user.id)
        .single()

      console.log('[AuthService] Profile from user_management:', profile)
      console.log('[AuthService] Role:', profile?.role)

      return {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name,
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
        marketing_agreed: profile?.marketing_agreed,
        role: profile?.role || 'user',
        provider: profile?.provider || 'email',
        email_verified: session.user.email_confirmed_at !== null,
        created_at: session.user.created_at!
      }
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // 클라이언트 사이드 빠른 검증
      const validation = this.validateSignUpData(data)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Edge Function 호출
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        return { success: false, error: '서버 설정 오류가 발생했습니다.' }
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify(data)
        }
      )

      // API 에러 응답 처리 (400, 500 등)
      if (!response.ok) {
        const result = await response.json()
        // Edge Function에서 반환한 구체적인 에러 메시지 사용
        return { success: false, error: result.error || '회원가입 중 오류가 발생했습니다.' }
      }

      const result = await response.json()
      return {
        success: true,
        message: result.message,
        requiresVerification: result.requiresVerification
      }

    } catch (error) {
      console.error('SignUp error:', error)

      // 네트워크 에러 또는 CORS 에러 구분
      if (error instanceof TypeError) {
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
        }
      }

      return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
    }
  }

  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) {
        return { success: false, error: this.getErrorMessage(authError.message) }
      }

      if (!authData.user) {
        return { success: false, error: '로그인에 실패했습니다.' }
      }

      const { data: profile } = await this.supabase
        .schema('user_management')
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      await this.logAuthEvent(authData.user.id, 'signin', 'email')

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name,
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
        marketing_agreed: profile?.marketing_agreed,
        role: profile?.role || 'user',
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: authData.user.created_at!
      }

      return { 
        success: true, 
        user,
        message: '로그인되었습니다.'
      }

    } catch (error) {
      console.error('SignIn error:', error)
      return { success: false, error: '로그인 중 오류가 발생했습니다.' }
    }
  }

  async signOut(): Promise<void> {
    try {
      // getSession()으로 빠르게 사용자 ID 가져오기 (로컬 스토리지 읽기)
      const { data: { session } } = await this.supabase.auth.getSession()

      // 로그는 비동기로 실행, 완료 대기하지 않음 (로그 실패해도 로그아웃 진행)
      if (session?.user) {
        this.logAuthEvent(session.user.id, 'signout', 'email').catch(console.error)
      }

      // 즉시 로그아웃 실행
      await this.supabase.auth.signOut()
    } catch (error) {
      // 에러 발생해도 로그아웃 시도
      console.error('[AuthService] signOut error:', error)
      await this.supabase.auth.signOut()
    }
  }

  async signInWithOAuth(provider: Provider) {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/auth/callback`,
          scopes: provider === 'kakao' ? 'profile_nickname profile_image account_email' : undefined
        }
      })

      if (error) {
        console.error(`${provider} OAuth error:`, error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error)
      return { success: false, error: `${provider} 로그인 중 오류가 발생했습니다.` }
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change event:', event, '| Session:', !!session)

      // 모든 세션 관련 이벤트에서 사용자 정보 업데이트
      if (event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED') {
        if (session?.user) {
          // 소셜 로그인인 경우 로그 기록 (SIGNED_IN 이벤트에서만)
          if (event === 'SIGNED_IN') {
            const provider = session.user.app_metadata?.provider || 'email'
            if (provider !== 'email') {
              await this.logAuthEvent(session.user.id, 'signin', provider)
            }
          }

          const user = await this.getCurrentUser()
          callback(user)
        } else {
          callback(null)
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })
  }

  private validateSignUpData(data: SignUpData): { valid: boolean; error?: string } {
    if (!data.email || !data.password) {
      return { valid: false, error: '이메일과 비밀번호를 입력해주세요.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: '올바른 이메일 형식을 입력해주세요.' }
    }

    if (data.password.length < 8) {
      return { valid: false, error: '비밀번호는 8자 이상이어야 합니다.' }
    }

    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password)

    if (!hasSpecial) {
      return {
        valid: false,
        error: '비밀번호는 특수문자를 포함해야 합니다.'
      }
    }

    return { valid: true }
  }

  private async logAuthEvent(userId: string, eventType: string, provider: string) {
    try {
      await this.supabase
        .schema('user_management')
        .from('auth_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          provider,
          ip_address: null,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
          metadata: {}
        })
    } catch (error) {
      console.error('Failed to log auth event:', error)
    }
  }

  private getErrorMessage(error: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'User already registered': '이미 가입된 이메일입니다.',
      'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
      'Email not confirmed': '이메일 인증이 필요합니다.',
      'Too many requests': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
    }

    return errorMap[error] || '인증 중 오류가 발생했습니다.'
  }
}

// Export a singleton instance for backward compatibility
// Each component can create its own instance if needed
export const authService = new AuthService()