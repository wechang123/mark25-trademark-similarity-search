import { NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/database/middleware'

export async function middleware(request: NextRequest) {
  // Supabase 세션 업데이트
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청 경로에서 실행:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}