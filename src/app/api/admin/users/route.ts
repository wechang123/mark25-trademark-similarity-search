import { NextRequest, NextResponse } from 'next/server'
import { adminApiGuard, createApiResponse, createApiError } from '@/infrastructure/auth/middleware/admin-api-guard'
import { createServerSupabaseAdmin } from '@/infrastructure/database/server-admin'
import { UserRole } from '@/features/admin-dashboard/_types/admin.types'

/**
 * GET /api/admin/users
 * 사용자 목록 조회
 */
export async function GET(request: NextRequest) {
  // 보안 체크 (매니저 이상)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'manager',
    action: 'view_users_list'
  })
  
  // guardResult가 에러 응답인 경우 반환
  if (guardResult && !guardResult.success) return guardResult
  
  // 인증된 사용자 정보 추출
  const { user: currentUser, profile } = guardResult || {}

  try {
    const supabase = await createServerSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // auth.admin API를 사용하여 사용자 목록 가져오기
    const { data, error: usersError } = await supabase.auth.admin.listUsers({
      page,
      perPage: limit
    })

    if (usersError) {
      console.error('[GET /api/admin/users] Auth admin error:', usersError)
      return createApiError('사용자 목록을 불러오는데 실패했습니다.', 500)
    }

    // Supabase pagination metadata 추출
    const users = data.users || []
    const totalUsersFromSupabase = (data as any).total || users.length

    // 사용자 배열 필터링 및 변환
    let filteredUsers = users
    
    // 검색 필터 (이메일 또는 이름)
    if (search) {
      filteredUsers = filteredUsers.filter(user => {
        const email = user.email?.toLowerCase() || ''
        const name = (user.user_metadata?.name || user.user_metadata?.full_name || '').toLowerCase()
        const searchLower = search.toLowerCase()
        return email.includes(searchLower) || name.includes(searchLower)
      })
    }
    
    // 역할 필터
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const userRole = user.app_metadata?.role || 'user'
        return userRole === roleFilter
      })
    }
    
    // 정렬
    filteredUsers.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'name':
          aValue = a.user_metadata?.name || a.user_metadata?.full_name || ''
          bValue = b.user_metadata?.name || b.user_metadata?.full_name || ''
          break
        case 'role':
          aValue = a.app_metadata?.role || 'user'
          bValue = b.app_metadata?.role || 'user'
          break
        case 'created_at':
        default:
          aValue = a.created_at || ''
          bValue = b.created_at || ''
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    // 응답 데이터 포맷팅
    // 참고: Supabase가 이미 pagination 처리를 했으므로 추가 slice 불필요
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || user.phone || '',
      role: (user.app_metadata?.role as UserRole) || 'user',
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at || '',
      updated_at: user.updated_at || '',
      provider: user.app_metadata?.provider || 'email',
      marketing_agreed: user.user_metadata?.marketing_agreed || false
    }))

    // Supabase metadata를 사용하여 올바른 total 반환
    return createApiResponse(formattedUsers, {
      page,
      limit,
      total: totalUsersFromSupabase,
      totalPages: Math.ceil(totalUsersFromSupabase / limit)
    })
    
  } catch (error) {
    console.error('[GET /api/admin/users] Unexpected error:', error)
    return createApiError('서버 오류가 발생했습니다.', 500)
  }
}