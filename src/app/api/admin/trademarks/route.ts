import { NextRequest } from 'next/server'
import { adminApiGuard, createApiResponse, createApiError } from '@/infrastructure/auth/middleware/admin-api-guard'
import { createServerSupabaseAdmin } from '@/infrastructure/database/server-admin'

/**
 * GET /api/admin/trademarks
 * 상표 분석 목록 조회
 */
export async function GET(request: NextRequest) {
  // 보안 체크 (매니저 이상)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'manager',
    action: 'view_trademarks_list'
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
    const status = searchParams.get('status') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // 기본 쿼리 - analysis_sessions 테이블 사용
    let query = supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('*', { count: 'exact' })
    
    // 검색 필터 (상표명, 비즈니스 설명)
    if (search) {
      query = query.or(`trademark_name.ilike.%${search}%,business_description.ilike.%${search}%`)
    }
    
    // 상태 필터
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    // 날짜 필터
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      // endDate의 23:59:59까지 포함
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endDateTime.toISOString())
    }
    
    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('[GET /api/admin/trademarks] Database error:', error)
      return createApiError('분석 목록을 불러오는데 실패했습니다.', 500)
    }
    
    // 응답 데이터 포맷팅
    const trademarks = await Promise.all((data || []).map(async (session) => {
      // 사용자 정보 조회
      let userInfo = { email: 'Unknown', name: null }
      if (session.user_id) {
        const { data: userData } = await supabase
          .schema('user_management')
          .from('profiles')
          .select('email, name')
          .eq('id', session.user_id)
          .single()
        
        if (userData) {
          userInfo = userData
        }
      }
      
      // final_result가 있는 경우 추가 정보 조회
      let finalAnalysis = null
      if (session.final_result) {
        // trademark_final_analysis 테이블에서 추가 정보 조회 시도
        const { data: finalData } = await supabase
          .schema('trademark_analysis')
          .from('trademark_final_analysis')
          .select('risk_level, registration_probability, total_cost_estimate')
          .eq('session_id', session.id)
          .single()
        
        finalAnalysis = finalData
      }
      
      return {
        id: session.id,
        user_id: session.user_id,
        user_email: userInfo.email,
        user_name: userInfo.name,
        trademark_name: session.trademark_name,
        trademark_type: session.trademark_type,
        business_description: session.business_description,
        status: session.status,
        progress: session.progress || 0,
        current_stage: session.current_stage,
        is_debug_mode: session.is_debug_mode || false,
        created_at: session.created_at,
        updated_at: session.updated_at,
        completed_at: session.completed_at,
        // 추가 분석 정보
        risk_level: finalAnalysis?.risk_level || session.final_result?.riskLevel,
        registration_probability: finalAnalysis?.registration_probability || session.final_result?.registrationProbability,
        total_cost_estimate: finalAnalysis?.total_cost_estimate || session.final_result?.totalCostEstimate,
        // 분류 정보
        product_classifications: session.product_classification_codes || [],
        similar_group_codes: session.similar_group_codes || [],
        designated_products: session.designated_products || []
      }
    }))
    
    return createApiResponse(trademarks, {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    })
    
  } catch (error) {
    console.error('[GET /api/admin/trademarks] Unexpected error:', error)
    return createApiError('서버 오류가 발생했습니다.', 500)
  }
}