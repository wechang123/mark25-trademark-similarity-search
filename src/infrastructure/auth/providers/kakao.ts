import type { SocialProvider, AuthResult } from './index'

export class KakaoAuthProvider implements SocialProvider {
  name = 'kakao'
  enabled = process.env.NEXT_PUBLIC_AUTH_KAKAO_ENABLED === 'true'

  private clientId = process.env.KAKAO_CLIENT_ID
  private clientSecret = process.env.KAKAO_CLIENT_SECRET
  private redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kakao/callback`

  getAuthUrl(): string {
    if (!this.enabled || !this.clientId) {
      throw new Error('카카오 로그인이 활성화되지 않았습니다.')
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email'
    })

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
  }

  async handleCallback(): Promise<AuthResult> {
    try {
      if (!this.enabled) {
        return { 
          success: false, 
          error: '카카오 로그인은 현재 준비 중입니다. (사업자 등록 후 활성화 예정)' 
        }
      }

      // Phase 2에서 실제 구현 예정
      // 현재는 UI만 제공하고 실제 기능은 비활성화
      return {
        success: false,
        error: '카카오 로그인은 서비스 준비 중입니다.'
      }

      // TODO: Phase 2 구현 예정
      // 1. Access Token 획득
      // 2. 사용자 정보 조회
      // 3. 계정 연동 또는 생성
      // 4. JWT 토큰 발급

    } catch (error) {
      console.error('Kakao auth error:', error)
      return {
        success: false,
        error: '카카오 로그인 중 오류가 발생했습니다.'
      }
    }
  }

  // Phase 2에서 구현 예정
  private async getAccessToken(code: string): Promise<string> {
    // 카카오 토큰 API 호출
    throw new Error('Not implemented yet')
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    // 카카오 사용자 정보 API 호출
    throw new Error('Not implemented yet')
  }
}