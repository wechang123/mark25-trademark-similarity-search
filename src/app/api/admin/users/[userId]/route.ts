import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminApiGuard, createApiResponse, createApiError } from '@/infrastructure/auth/middleware/admin-api-guard'
import { createServerSupabaseAdmin } from '@/infrastructure/database/server-admin'
import { UserRole } from '@/features/admin-dashboard/_types/admin.types'

// 사용자 수정 스키마
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'user']).optional(),
  phone: z.string().regex(/^[0-9-+() ]+$/).optional(),
  marketing_agreed: z.boolean().optional()
})

/**
 * GET /api/admin/users/[userId]
 * 특정 사용자 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // 보안 체크 (매니저 이상)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'manager',
    action: 'view_user_detail'
  })
  
  // guardResult가 에러 응답인 경우 반환
  if (guardResult && !guardResult.success) return guardResult
  
  // 인증된 사용자 정보 추출
  const { user: currentUser, profile } = guardResult || {}

  try {
    const supabase = await createServerSupabaseAdmin()
    const { userId } = await params
    
    // auth.admin API를 사용하여 사용자 정보 조회
    const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser) {
      if (authError?.message?.includes('not found')) {
        return createApiError('사용자를 찾을 수 없습니다.', 404)
      }
      console.error('[GET /api/admin/users/[userId]] Auth admin error:', authError)
      return createApiError('사용자 정보를 불러오는데 실패했습니다.', 500)
    }
    
    // 사용자 데이터 포맷팅
    const userData = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || '',
      phone: authUser.user_metadata?.phone || authUser.phone || '',
      role: (authUser.app_metadata?.role as UserRole) || 'user',
      avatar_url: authUser.user_metadata?.avatar_url || null,
      created_at: authUser.created_at || '',
      updated_at: authUser.updated_at || '',
      provider: authUser.app_metadata?.provider || 'email',
      marketing_agreed: authUser.user_metadata?.marketing_agreed || false,
      email_confirmed_at: authUser.email_confirmed_at,
      last_sign_in_at: authUser.last_sign_in_at,
      // 권한 정보는 현재 user_management 스키마 접근이 불가능하므로 제외
      permissions: [],
      recentActivities: []
    }
    
    return createApiResponse(userData)
    
  } catch (error) {
    console.error('[GET /api/admin/users/[userId]] Unexpected error:', error)
    return createApiError('서버 오류가 발생했습니다.', 500)
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * 사용자 정보 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // 보안 체크 (관리자만)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'admin',
    schema: updateUserSchema,
    action: 'update_user'
  })
  
  // guardResult가 에러 응답인 경우 반환
  if (guardResult && !guardResult.success) return guardResult
  
  // 인증된 사용자 정보와 검증된 데이터 추출
  const { user: currentUser, profile: currentProfile, validatedBody } = guardResult || {}

  try {
    const supabase = await createServerSupabaseAdmin()
    const { userId } = await params
    const body = validatedBody // 검증된 데이터 사용
    
    // auth.admin API를 사용하여 사용자 메타데이터 업데이트
    const updateData: any = {}
    
    // user_metadata 필드 업데이트
    const userMetadata: any = {}
    if (body.name !== undefined) userMetadata.name = body.name
    if (body.phone !== undefined) userMetadata.phone = body.phone
    if (body.avatar_url !== undefined) userMetadata.avatar_url = body.avatar_url
    if (body.marketing_agreed !== undefined) userMetadata.marketing_agreed = body.marketing_agreed
    
    if (Object.keys(userMetadata).length > 0) {
      updateData.user_metadata = userMetadata
    }
    
    // app_metadata 필드 업데이트 (role, provider)
    const appMetadata: any = {}
    if (body.role !== undefined) appMetadata.role = body.role
    if (body.provider !== undefined) appMetadata.provider = body.provider
    
    if (Object.keys(appMetadata).length > 0) {
      updateData.app_metadata = appMetadata
    }
    
    // email 필드 업데이트
    if (body.email !== undefined) {
      updateData.email = body.email
    }
    
    // 사용자 정보 업데이트
    const { data: { user: updatedUser }, error } = await supabase.auth.admin.updateUserById(
      userId,
      updateData
    )
    
    if (error || !updatedUser) {
      console.error('[PATCH /api/admin/users/[userId]] Update error:', error)
      return createApiError('사용자 정보 수정에 실패했습니다.', 500)
    }

    // 업데이트된 사용자 정보 반환
    return createApiResponse({
      id: updatedUser.id,
      email: updatedUser.email || '',
      name: updatedUser.user_metadata?.name || updatedUser.user_metadata?.full_name || '',
      phone: updatedUser.user_metadata?.phone || updatedUser.phone || '',
      role: (updatedUser.app_metadata?.role as UserRole) || 'user',
      avatar_url: updatedUser.user_metadata?.avatar_url || null,
      updated_at: updatedUser.updated_at || '',
      marketing_agreed: updatedUser.user_metadata?.marketing_agreed || false
    })
    
  } catch (error) {
    console.error('[PATCH /api/admin/users/[userId]] Unexpected error:', error)
    return createApiError('서버 오류가 발생했습니다.', 500)
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * 사용자 삭제 (소프트 삭제)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // 보안 체크 (관리자만)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'admin',
    action: 'delete_user'
  })
  
  // guardResult가 에러 응답인 경우 반환
  if (guardResult && !guardResult.success) return guardResult
  
  // 인증된 사용자 정보 추출
  const { user: currentUser, profile: currentProfile } = guardResult || {}

  try {
    const supabase = await createServerSupabaseAdmin()
    const { userId } = await params
    
    // 자기 자신은 삭제할 수 없음
    if (userId === currentUser.id) {
      return createApiError('자기 자신은 삭제할 수 없습니다.', 400)
    }
    
    // 삭제할 사용자 정보 조회
    const { data: { user: targetUser }, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError || !targetUser) {
      return createApiError('사용자를 찾을 수 없습니다.', 404)
    }
    
    // auth.admin API를 사용하여 사용자 삭제
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error('[DELETE /api/admin/users/[userId]] Delete error:', error)
      return createApiError('사용자 삭제에 실패했습니다.', 500)
    }
    
    return createApiResponse({
      success: true,
      message: '사용자가 삭제되었습니다.'
    })
    
  } catch (error) {
    console.error('[DELETE /api/admin/users/[userId]] Unexpected error:', error)
    return createApiError('서버 오류가 발생했습니다.', 500)
  }
}