import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export const updateSession = async (request: NextRequest) => {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 개발 환경에서 /admin/debug 경로는 Supabase 없이 바로 통과
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev && request.nextUrl.pathname.startsWith('/admin/debug')) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 세션 새로고침 (Supabase 접속 불가 시 통과)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase 접속 불가 시 인증 건너뜀
    return response
  }

  // 로그인된 사용자가 인증 페이지 접근 시 홈으로 리다이렉트
  if (user && (request.nextUrl.pathname === '/signin' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin 경로 접근 시 권한 체크
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/signin', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 개발 환경에서는 권한 체크 완화 (디버깅용)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // 사용자 역할 확인
    const { data: profile } = await supabase
      .from('user_management.profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 개발 환경이 아니거나 profile이 없을 때만 권한 체크
    if (!isDevelopment) {
      // 관리자 또는 매니저 권한이 없는 경우 대시보드로 리다이렉트
      if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } else {
      // 개발 환경에서는 로그 출력만
      console.log('[Dev Mode] Admin access:', {
        user: user.email,
        role: profile?.role || 'no profile',
        path: request.nextUrl.pathname
      })
    }
  }

  return response
}