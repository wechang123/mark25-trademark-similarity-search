import { NextRequest } from 'next/server'
import { adminApiGuard, createApiResponse, createApiError } from '@/infrastructure/auth/middleware/admin-api-guard'
import { createServerSupabaseAdmin } from '@/infrastructure/database/server-admin'

/**
 * GET /api/admin/stats
 * 대시보드 통계 데이터 조회
 */
export async function GET(request: NextRequest) {
  // 보안 체크 (매니저 이상)
  const guardResult = await adminApiGuard(request, {
    requireRole: 'manager',
    action: 'view_dashboard_stats',
    rateLimit: true,
    rateLimitType: 'general' // 통계는 자주 조회되므로 general 타입 사용
  })
  
  // guardResult가 에러 응답인 경우 반환
  if (guardResult && !guardResult.success) return guardResult
  
  // 인증된 사용자 정보 추출
  const { user: currentUser, profile } = guardResult || {}

  try {
    const supabase = await createServerSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 (날짜 범위 등)
    const days = parseInt(searchParams.get('days') || '7') // 기본 7일
    const includeDetails = searchParams.get('includeDetails') === 'true'
    
    // 날짜 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    
    // 1. 총 사용자 수
    const { count: totalUsers } = await supabase
      .schema('user_management')
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // 2. 오늘 분석 수
    const { count: todayAnalysis } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
    
    // 3. 진행 중인 요청 수
    const { count: pendingRequests } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'processing'])
    
    // 4. 완료율 계산
    const [{ count: totalSessions }, { count: completedSessions }] = await Promise.all([
      supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .select('*', { count: 'exact', head: true }),
      supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
    ])
    
    const completionRate = totalSessions 
      ? Math.round((completedSessions || 0) / totalSessions * 100)
      : 0
    
    // 5. 사용자 증가 추이 (지정된 기간)
    const userGrowth = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const { count } = await supabase
        .schema('user_management')
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())
      
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        count: count || 0
      })
    }
    
    // 6. 분석 차트 데이터 (상태별 일일 통계)
    const analysisChart = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const { data: sessions } = await supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .select('status')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())
      
      const completed = sessions?.filter(s => s.status === 'completed').length || 0
      const pending = sessions?.filter(s => ['active', 'processing'].includes(s.status || '')).length || 0
      const failed = sessions?.filter(s => s.status === 'failed').length || 0
      
      analysisChart.push({
        date: date.toISOString().split('T')[0],
        completed,
        pending,
        failed,
        total: completed + pending + failed
      })
    }
    
    // 7. 추가 통계 (선택적)
    let additionalStats = {}
    if (includeDetails) {
      // 역할별 사용자 수
      const { data: roleStats } = await supabase
        .schema('user_management')
        .from('profiles')
        .select('role')
      
      const roleCount = roleStats?.reduce((acc: any, user) => {
        acc[user.role || 'user'] = (acc[user.role || 'user'] || 0) + 1
        return acc
      }, {}) || {}
      
      // 상표 유형별 분석 수
      const { data: typeStats } = await supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .select('trademark_type')
        .gte('created_at', startDate.toISOString())
      
      const typeCount = typeStats?.reduce((acc: any, session) => {
        acc[session.trademark_type || 'text'] = (acc[session.trademark_type || 'text'] || 0) + 1
        return acc
      }, {}) || {}
      
      // 평균 처리 시간 (완료된 세션만)
      const { data: completedSessionsData } = await supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('created_at', startDate.toISOString())
      
      let avgProcessingTime = 0
      if (completedSessionsData && completedSessionsData.length > 0) {
        const totalTime = completedSessionsData.reduce((sum, session) => {
          const start = new Date(session.created_at).getTime()
          const end = new Date(session.completed_at!).getTime()
          return sum + (end - start)
        }, 0)
        avgProcessingTime = Math.round(totalTime / completedSessionsData.length / 1000 / 60) // 분 단위
      }
      
      // API 사용량 통계
      const { data: apiStats } = await supabase
        .schema('trademark_analysis')
        .from('api_call_logs')
        .select('api_type, tokens_used, cost_estimate')
        .gte('request_timestamp', startDate.toISOString())
      
      const apiUsage = apiStats?.reduce((acc: any, log) => {
        if (!acc[log.api_type]) {
          acc[log.api_type] = {
            calls: 0,
            tokens: 0,
            cost: 0
          }
        }
        acc[log.api_type].calls++
        acc[log.api_type].tokens += log.tokens_used || 0
        acc[log.api_type].cost += log.cost_estimate || 0
        return acc
      }, {}) || {}
      
      additionalStats = {
        usersByRole: roleCount,
        analysisByType: typeCount,
        avgProcessingTimeMinutes: avgProcessingTime,
        apiUsage,
        totalApiCost: Object.values(apiUsage).reduce((sum: number, api: any) => sum + api.cost, 0)
      }
    }
    
    // 8. 최근 활동 로그 (옵션)
    const recentActivities = []
    if (includeDetails) {
      const { data: activities } = await supabase
        .schema('user_management')
        .from('admin_activity_logs')
        .select(`
          *,
          user:user_id (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (activities) {
        recentActivities.push(...activities.map(activity => ({
          id: activity.id,
          userId: activity.user_id,
          userEmail: (activity as any).user?.email,
          userName: (activity as any).user?.name,
          action: activity.action,
          targetTable: activity.target_table,
          targetId: activity.target_id,
          metadata: activity.metadata,
          createdAt: activity.created_at
        })))
      }
    }
    
    // 응답 구성
    const statsResponse = {
      // 주요 지표
      overview: {
        totalUsers: totalUsers || 0,
        todayAnalysis: todayAnalysis || 0,
        pendingRequests: pendingRequests || 0,
        completionRate
      },
      
      // 차트 데이터
      charts: {
        userGrowth,
        analysisChart
      },
      
      // 기간 정보
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      
      // 추가 통계 (선택적)
      ...(includeDetails && {
        details: additionalStats,
        recentActivities
      })
    }
    
    return createApiResponse(statsResponse)
    
  } catch (error) {
    console.error('[GET /api/admin/stats] Unexpected error:', error)
    return createApiError('통계 데이터를 불러오는데 실패했습니다.', 500)
  }
}