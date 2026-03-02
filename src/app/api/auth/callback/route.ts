import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/infrastructure/database/server'

// Supabase Auth 콜백 처리 (이메일 및 소셜 로그인 모두 처리)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // OAuth 에러 처리
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(new URL(`/signin?error=${error}`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/signin?error=missing_code', request.url))
    }

    const supabase = await createClient()

    // 인증 코드 교환
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Auth callback error:', sessionError)
      return NextResponse.redirect(new URL('/signin?error=auth_failed', request.url))
    }

    // 프로필 생성/업데이트 (이메일 및 소셜 로그인 모두 처리)
    if (sessionData?.user) {
      const serviceClient = createServiceClient()
      const resolvedServiceClient = await serviceClient
      const userData = sessionData.user.user_metadata
      const provider = sessionData.user.app_metadata?.provider || 'email'
      
      // Determine the actual provider (for users with multiple providers)
      const actualProvider = sessionData.user.app_metadata?.providers?.includes('kakao') ? 'kakao' : provider
      
      // 프로필 upsert (이미 있으면 업데이트, 없으면 생성)
      const { error: profileError } = await resolvedServiceClient
        .schema('user_management')
        .from('profiles')
        .upsert({
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: userData?.full_name || userData?.name || userData?.kakao_account?.profile?.nickname,
          phone: userData?.phone,
          avatar_url: userData?.avatar_url || userData?.kakao_account?.profile?.profile_image_url,
          marketing_agreed: userData?.marketing_agreed || false,
          provider: actualProvider,
          // role will be handled by database trigger
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile upsert error:', profileError)
      }

      // 소셜 로그인인 경우 social_accounts 테이블 업데이트
      if (provider !== 'email') {
        const { error: socialError } = await resolvedServiceClient
          .schema('user_management')
          .from('social_accounts')
          .upsert({
            user_id: sessionData.user.id,
            provider: provider,
            provider_account_id: userData?.sub || userData?.id || sessionData.user.id,
            provider_email: sessionData.user.email,
            provider_metadata: userData,
            created_at: new Date().toISOString()
          })

        if (socialError) {
          console.error('Social account upsert error:', socialError)
        }
      }
    }

    // 성공 시 리다이렉트
    return NextResponse.redirect(new URL(next, request.url))

  } catch (error) {
    console.error('Callback API error:', error)
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url))
  }
}

// Social 로그인 콜백도 처리 (Phase 2)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    // 소셜 로그인 콜백 처리
    if (provider === 'kakao') {
      return NextResponse.json({
        success: false,
        error: `${provider} 로그인은 서비스 준비 중입니다.`
      }, { status: 501 })
    }

    return NextResponse.json({
      success: false,
      error: '지원하지 않는 인증 제공자입니다.'
    }, { status: 400 })

  } catch (error) {
    console.error('Social callback error:', error)
    return NextResponse.json({
      success: false,
      error: '소셜 로그인 콜백 처리 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}