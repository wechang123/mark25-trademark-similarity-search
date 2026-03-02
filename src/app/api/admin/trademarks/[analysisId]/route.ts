import { NextRequest } from 'next/server'
import { adminApiGuard, createApiResponse, createApiError } from '@/infrastructure/auth/middleware/admin-api-guard'
import { createServerSupabaseAdmin } from '@/infrastructure/database/server-admin'

/**
 * GET /api/admin/trademarks/[analysisId]
 * 특정 상표 분석 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  // 보안 체크 (매니저 이상)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'manager',
    action: 'view_trademark_detail'
  })

  // guardResult가 에러 응답인 경우 반환
  if (guardResult && !guardResult.success) return guardResult

  // 인증된 사용자 정보 추출
  const { user: currentUser, profile } = guardResult || {}

  try {
    const supabase = await createServerSupabaseAdmin()
    const { analysisId } = await params
    
    // 분석 세션 정보 조회
    const { data: session, error: sessionError } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select(`
        *,
        user:user_id (
          id,
          email,
          name,
          phone
        )
      `)
      .eq('id', analysisId)
      .single()
    
    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return createApiError('분석 정보를 찾을 수 없습니다.', 404)
      }
      console.error('[GET /api/admin/trademarks/[analysisId]] Session error:', sessionError)
      return createApiError('분석 정보를 불러오는데 실패했습니다.', 500)
    }
    
    // 관련 테이블 데이터 조회
    const [
      { data: finalAnalysis },
      { data: classificationAnalysis },
      { data: similarTrademarks },
      { data: apiCallLogs },
      { data: workflowEvents }
    ] = await Promise.all([
      // 최종 분석 결과
      supabase
        .schema('trademark_analysis')
        .from('trademark_final_analysis')
        .select('*')
        .eq('session_id', analysisId)
        .single(),
      
      // 분류 분석 결과
      supabase
        .schema('trademark_analysis')
        .from('trademark_classification_analysis')
        .select('*')
        .eq('session_id', analysisId)
        .order('created_at', { ascending: false }),
      
      // 유사 상표 검색 결과
      supabase
        .schema('trademark_analysis')
        .from('similar_trademarks')
        .select('*')
        .eq('session_id', analysisId)
        .order('similarity_score', { ascending: false })
        .limit(10),
      
      // API 호출 로그 (최근 20개)
      supabase
        .schema('trademark_analysis')
        .from('api_call_logs')
        .select('*')
        .eq('session_id', analysisId)
        .order('request_timestamp', { ascending: false })
        .limit(20),
      
      // 워크플로우 이벤트 (최근 50개)
      supabase
        .schema('trademark_analysis')
        .from('workflow_events')
        .select('*')
        .eq('session_id', analysisId)
        .order('timestamp', { ascending: false })
        .limit(50)
    ])
    
    // KIPRIS 검색 결과 조회
    const { data: kiprisResults } = await supabase
      .schema('trademark_analysis')
      .from('kipris_search_results')
      .select('*')
      .eq('session_id', analysisId)
      .order('created_at', { ascending: false })
    
    // AI 분석 결과 조회
    const { data: aiAnalysisResults } = await supabase
      .schema('trademark_analysis')
      .from('ai_analysis_results')
      .select('*')
      .eq('session_id', analysisId)
      .order('created_at', { ascending: false })
    
    // 대화 기록 조회
    const { data: conversations } = await supabase
      .schema('trademark_analysis')
      .from('analysis_conversations')
      .select('*')
      .eq('session_id', analysisId)
      .order('sequence', { ascending: true })
    
    // 통계 계산
    const totalApiCalls = apiCallLogs?.length || 0
    const totalTokensUsed = apiCallLogs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0
    const totalCostEstimate = apiCallLogs?.reduce((sum, log) => sum + (log.cost_estimate || 0), 0) || 0
    
    // 응답 데이터 구성
    const analysisDetail = {
      // 기본 정보
      id: session.id,
      user: {
        id: (session as any).user?.id,
        email: (session as any).user?.email,
        name: (session as any).user?.name,
        phone: (session as any).user?.phone
      },
      
      // 상표 정보
      trademark: {
        name: session.trademark_name,
        type: session.trademark_type,
        businessDescription: session.business_description,
        imageUrl: session.trademark_image_url,
        classifications: session.product_classification_codes || [],
        similarGroupCodes: session.similar_group_codes || [],
        designatedProducts: session.designated_products || []
      },
      
      // 진행 상태
      status: {
        current: session.status,
        progress: session.progress || 0,
        stage: session.current_stage,
        substep: session.current_substep,
        isDebugMode: session.is_debug_mode || false,
        debugNotes: session.debug_notes
      },
      
      // 타임스탬프
      timestamps: {
        created: session.created_at,
        updated: session.updated_at,
        completed: session.completed_at
      },
      
      // 분석 결과
      analysis: {
        final: finalAnalysis ? {
          riskLevel: finalAnalysis.risk_level,
          registrationProbability: finalAnalysis.registration_probability,
          totalCostEstimate: finalAnalysis.total_cost_estimate,
          summary: finalAnalysis.summary,
          recommendations: finalAnalysis.recommendations,
          legalConsiderations: finalAnalysis.legal_considerations
        } : null,
        classifications: classificationAnalysis || [],
        similarTrademarks: similarTrademarks || [],
        kiprisSearches: kiprisResults || [],
        aiAnalysis: aiAnalysisResults || []
      },
      
      // 대화 및 상호작용
      interactions: {
        conversations: conversations || [],
        workflowEvents: workflowEvents || []
      },
      
      // 메타데이터 및 통계
      metadata: {
        sessionData: session.session_data,
        informationChecklist: session.information_checklist,
        pendingConfirmations: session.pending_confirmations,
        workflowMetadata: session.workflow_metadata,
        finalResult: session.final_result
      },
      
      // API 사용 통계
      statistics: {
        totalApiCalls,
        totalTokensUsed,
        totalCostEstimate,
        apiCallLogs: apiCallLogs || []
      }
    }
    
    return createApiResponse(analysisDetail)
    
  } catch (error) {
    console.error('[GET /api/admin/trademarks/[analysisId]] Unexpected error:', error)
    return createApiError('서버 오류가 발생했습니다.', 500)
  }
}