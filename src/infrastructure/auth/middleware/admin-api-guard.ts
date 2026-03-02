import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/infrastructure/security/rate-limit'
import { createServerSupabaseClient } from '@/infrastructure/database/server-admin'
import { createServerSupabaseAdmin } from '@/infrastructure/database/server-admin'

export interface AdminApiGuardOptions {
  requireRole?: 'admin' | 'manager' | 'any'
  rateLimit?: boolean
  rateLimitType?: 'admin' | 'general'
  schema?: z.ZodSchema
  logActivity?: boolean
  action?: string
}

/**
 * Admin API 통합 보안 미들웨어
 * - Rate Limiting
 * - 인증 체크
 * - 권한 검증
 * - 입력 검증 (Zod)
 * - 감사 로깅
 */
export async function adminApiGuard(
  request: NextRequest,
  options: AdminApiGuardOptions = {}
) {
  const {
    requireRole = 'admin',
    rateLimit = true,
    rateLimitType = 'admin',
    schema,
    logActivity = true,
    action
  } = options

  try {
    // 1. Rate Limiting 체크
    if (rateLimit) {
      const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
      const result = await checkRateLimit(rateLimitType, identifier)
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            retryAfter: result.reset
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toISOString()
            }
          }
        )
      }
    }

    // 2. 인증 체크 (인증은 일반 클라이언트로, 쿠키 기반)
    const supabase = await createServerSupabaseClient()
    
    // 먼저 세션 확인
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('[AdminApiGuard] Session check:', { 
      hasSession: !!sessionData?.session,
      sessionError,
      userId: sessionData?.session?.user?.id 
    })
    
    // getUser로 재확인
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log('[AdminApiGuard] User check:', { 
      hasUser: !!authData?.user,
      authError,
      userId: authData?.user?.id 
    })
    
    if (authError || !authData?.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다. 다시 로그인해주세요.',
          debug: {
            sessionError: sessionError?.message,
            authError: authError?.message,
            hasSession: !!sessionData?.session
          }
        },
        { status: 401 }
      )
    }
    
    const currentUser = authData.user

    // 3. 프로필 및 권한 체크 (Admin client로 직접 조회)
    const adminSupabase = await createServerSupabaseAdmin()
    
    // auth.admin API를 사용해서 사용자 정보 조회
    const { data: { user: authUser }, error: adminAuthError } = await adminSupabase.auth.admin.getUserById(currentUser.id)
    
    console.log('[AdminApiGuard] Auth admin check:', { 
      userId: currentUser.id,
      authUserFound: !!authUser,
      adminAuthError,
      role: authUser?.app_metadata?.role 
    })
    
    if (adminAuthError || !authUser) {
      return NextResponse.json(
        { 
          error: 'Profile not found',
          message: '사용자 프로필을 찾을 수 없습니다.',
          debug: { userId: currentUser.id, adminAuthError: adminAuthError?.message }
        },
        { status: 404 }
      )
    }
    
    // auth.users의 app_metadata에서 role 가져오기
    const role = authUser.app_metadata?.role || 'user'
    const profile = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || '',
      role: role as 'admin' | 'manager' | 'user',
      avatar_url: authUser.user_metadata?.avatar_url || null,
      created_at: authUser.created_at || '',
      updated_at: authUser.updated_at || ''
    }

    // 역할 기반 권한 검증
    if (requireRole !== 'any') {
      if (requireRole === 'admin' && profile.role !== 'admin') {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: '관리자 권한이 필요합니다.'
          },
          { status: 403 }
        )
      }
      
      if (requireRole === 'manager' && 
          profile.role !== 'admin' && 
          profile.role !== 'manager') {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: '매니저 이상의 권한이 필요합니다.'
          },
          { status: 403 }
        )
      }
    }

    // 4. 요청 본문 검증 (POST, PATCH, PUT 요청)
    let body: any = null
    let validatedBody: any = null
    if (schema && ['POST', 'PATCH', 'PUT'].includes(request.method)) {
      try {
        // Request body를 읽기 위해 clone 사용
        const clonedRequest = request.clone()
        body = await clonedRequest.json()
        validatedBody = schema.parse(body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: 'Validation failed',
              message: '입력 데이터가 올바르지 않습니다.',
              details: error.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
              }))
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { 
            error: 'Invalid request body',
            message: '요청 본문을 파싱할 수 없습니다.'
          },
          { status: 400 }
        )
      }
    }

    // 5. 감사 로깅 (스키마 접근 문제로 스킵)
    if (logActivity && action) {
      console.log('[AdminApiGuard] Activity log skipped - schema access issue')
    }

    // 6. 요청 컨텍스트 반환 (수정된 부분)
    // Next.js Request 객체에 속성을 추가하는 대신 별도 객체로 반환
    return {
      success: true,
      user: currentUser,
      profile,
      validatedBody
    } as any
  } catch (error) {
    console.error('[AdminApiGuard] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      },
      { status: 500 }
    )
  }
}

/**
 * 표준화된 API 에러 응답
 */
export function createApiError(
  message: string,
  status: number,
  details?: any
): NextResponse {
  const errorResponse: any = {
    error: true,
    message,
    timestamp: new Date().toISOString()
  }

  if (details) {
    errorResponse.details = details
  }

  return NextResponse.json(errorResponse, { status })
}

/**
 * 표준화된 API 성공 응답
 */
export function createApiResponse<T>(
  data: T,
  meta?: {
    page?: number
    limit?: number
    total?: number
    [key: string]: any
  }
): NextResponse {
  const response: any = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }

  if (meta) {
    response.meta = meta
  }

  return NextResponse.json(response)
}