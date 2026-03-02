import type { SocialProvider, AuthResult } from './index'
import { createClient } from '@/infrastructure/database/client'

export class KakaoAuthProvider implements SocialProvider {
  name = 'kakao'
  enabled = true // 카카오 로그인 활성화

  async getAuthUrl(): Promise<string> {
    const supabase = createClient()
    
    // Supabase OAuth를 통한 카카오 로그인 URL 생성
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        scopes: 'profile account_email',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      console.error('Kakao OAuth URL generation error:', error)
      throw new Error('카카오 로그인 URL 생성에 실패했습니다.')
    }

    return data.url
  }

  async handleCallback(code?: string): Promise<AuthResult> {
    try {
      const supabase = createClient()
      
      // Supabase가 OAuth 콜백을 자동으로 처리
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return {
          success: false,
          error: '카카오 로그인에 실패했습니다.'
        }
      }

      // 사용자 프로필 업데이트 (카카오에서 받은 정보로)
      const kakaoProfile = user.user_metadata
      
      if (kakaoProfile) {
        const { error: profileError } = await supabase
          .schema('user_management')
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            name: kakaoProfile.full_name || kakaoProfile.name,
            avatar_url: kakaoProfile.avatar_url,
            provider: 'kakao',
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile update error:', profileError)
        }

        // social_accounts 테이블에 카카오 계정 정보 저장
        const { error: socialError } = await supabase
          .schema('user_management')
          .from('social_accounts')
          .upsert({
            user_id: user.id,
            provider: 'kakao',
            provider_account_id: kakaoProfile.sub || user.id,
            provider_email: user.email,
            provider_metadata: kakaoProfile,
            created_at: new Date().toISOString()
          })

        if (socialError) {
          console.error('Social account link error:', socialError)
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email!,
          name: kakaoProfile?.full_name || kakaoProfile?.name,
          avatar_url: kakaoProfile?.avatar_url,
          role: 'user',
          email_verified: user.email_confirmed_at != null,
          created_at: user.created_at
        }
      }

    } catch (error) {
      console.error('Kakao auth callback error:', error)
      return {
        success: false,
        error: '카카오 로그인 처리 중 오류가 발생했습니다.'
      }
    }
  }
}