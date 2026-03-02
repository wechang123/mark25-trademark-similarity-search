import { createClient as createBrowserSupabaseClient } from '@/infrastructure/database/client'
import type { AuthProvider, SignUpData, SignInData, AuthResult, AuthUser } from './index'

export class EmailAuthProvider implements AuthProvider {
  name = 'email'
  enabled = process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED !== 'false'

  // 브라우저 환경에서 Supabase 클라이언트 반환
  private getSupabaseClient() {
    return createBrowserSupabaseClient()
  }

  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // 입력값 검증
      const validation = this.validateSignUpData(data)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const supabase = this.getSupabaseClient()

      // 이메일 중복 확인
      const { data: existingUser } = await supabase
        .schema('user_management')
        .from('profiles')
        .select('email')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        return { success: false, error: '이미 사용 중인 이메일입니다.' }
      }

      // 현재 환경에 맞는 리다이렉트 URL 설정
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'
      const redirectTo = `${siteUrl}/api/auth/callback`

      // Supabase Auth로 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            name: data.name,
            phone: data.phone,
            marketing_agreed: data.marketingAgreed || false
          }
        }
      })

      if (authError) {
        return { success: false, error: this.getErrorMessage(authError.message) }
      }

      if (!authData.user) {
        return { success: false, error: '회원가입에 실패했습니다.' }
      }

      // 이메일 인증이 완료된 경우에만 프로필 데이터 저장
      if (authData.user.email_confirmed_at) {
        const serviceClient = createBrowserSupabaseClient()
        const { error: profileError } = await serviceClient
          .schema('user_management')
        .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            marketing_agreed: data.marketingAgreed || false,
            role: 'user'
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      // 인증 로그 기록
      await this.logAuthEvent(authData.user.id, 'signup', 'email')

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        name: data.name,
        phone: data.phone,
        role: 'user',
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: authData.user.created_at!
      }

      return { 
        success: true, 
        user,
        requiresVerification: !authData.user.email_confirmed_at 
      }

    } catch (error) {
      console.error('SignUp error:', error)
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
    }
  }

  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const supabase = this.getSupabaseClient()

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) {
        return { success: false, error: this.getErrorMessage(authError.message) }
      }

      if (!authData.user) {
        return { success: false, error: '로그인에 실패했습니다.' }
      }

      // 프로필 정보 조회
      const { data: profile } = await supabase
        .schema('user_management')
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // 인증 로그 기록
      await this.logAuthEvent(authData.user.id, 'signin', 'email')

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name,
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
        role: profile?.role || 'user',
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: authData.user.created_at!
      }

      return { success: true, user }

    } catch (error) {
      console.error('SignIn error:', error)
      return { success: false, error: '로그인 중 오류가 발생했습니다.' }
    }
  }

  async signOut(): Promise<void> {
    const supabase = createBrowserSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await this.logAuthEvent(user.id, 'signout', 'email')
    }

    await supabase.auth.signOut()
  }

  private validateSignUpData(data: SignUpData): { valid: boolean; error?: string } {
    if (!data.email || !data.password) {
      return { valid: false, error: '이메일과 비밀번호를 입력해주세요.' }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: '올바른 이메일 형식을 입력해주세요.' }
    }

    // 비밀번호 강도 검증
    if (data.password.length < 8) {
      return { valid: false, error: '비밀번호는 8자 이상이어야 합니다.' }
    }

    const hasUpper = /[A-Z]/.test(data.password)
    const hasLower = /[a-z]/.test(data.password)
    const hasNumber = /\d/.test(data.password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(data.password)

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return { 
        valid: false, 
        error: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.' 
      }
    }

    return { valid: true }
  }

  private async logAuthEvent(userId: string, eventType: string, provider: string) {
    try {
      const supabase = this.getSupabaseClient()
      await supabase
        .schema('user_management')
        .from('auth_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          provider,
          ip_address: null, // 클라이언트에서는 IP 추적 안함
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