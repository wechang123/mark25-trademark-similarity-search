import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'
import { createValidatedApiRoute } from '@/infrastructure/swagger/middleware/validation-middleware'
import { z } from 'zod'
import {
  DashboardQuerySchema,
  DashboardResponseSchema,
  DashboardErrorSchema
} from '@/infrastructure/swagger/schemas/dashboard.schema'

export async function GET(request: NextRequest) {
  // Direct authentication check for dashboard access
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // 1. trademark_final_analysis에서 직접 조회 (user_id 사용) - 페이지네이션 적용
    const { data: finalAnalyses, count: totalFinalAnalysesCount, error: finalError } = await supabase
      .schema('trademark_analysis')
      .from('trademark_final_analysis')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (finalError) {
      console.error('[Dashboard API] Error fetching final analyses:', finalError);
    }

    // 2. analysis_sessions 데이터 조회 (통계 및 추가 정보용)
    const { data: stage1Data, error: stage1Error } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (stage1Error) {
      console.error('[Dashboard API] Error fetching analysis sessions:', stage1Error);
    }

    // 3. trademark_application 테이블에서 출원 현황 조회
    const { data: applications, error: appError } = await supabase
      .schema('public')
      .from('trademark_application')
      .select('id, status, created_at, trademark_type, analysis_session_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (appError) {
      console.error('[Dashboard API] Error fetching applications:', appError);
    }

    // 데이터 안전하게 처리
    const finalAnalysisData = Array.isArray(finalAnalyses) ? finalAnalyses : [];
    const sessionData = Array.isArray(stage1Data) ? stage1Data : [];
    const applicationData = Array.isArray(applications) ? applications : [];

    // stage1 데이터를 Map으로 변환 (빠른 조회를 위해)
    const stage1Map = new Map(sessionData.map((s: any) => [s.id, s]));

    // 세션 데이터 병합
    const sessions = finalAnalysisData.map((analysis: any) => {
      const stage1 = stage1Map.get(analysis.session_id) || {};
      
      // risk_level 계산
      let riskLevel: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
      if (analysis.registration_possibility) {
        const score = analysis.registration_possibility;
        if (score >= 70) riskLevel = 'low';
        else if (score >= 40) riskLevel = 'medium';
        else riskLevel = 'high';
      }

      return {
        id: analysis.session_id,
        trademark_name: stage1.trademark_name || '',
        trademark_type: stage1.trademark_type || 'text',
        business_description: stage1.business_description || '',
        product_classification_codes: stage1.product_classification_codes || [],
        similar_group_codes: stage1.similar_group_codes || [],
        designated_products: analysis.designated_goods || stage1.designated_products || [],
        status: 'completed',
        progress: 100,
        created_at: stage1.created_at || analysis.created_at,
        completed_at: stage1.completed_at || analysis.created_at,
        final_results: {
          id: analysis.id,
          registration_possibility: analysis.registration_possibility,
          risk_level: riskLevel,
          designated_goods_compatibility_score: analysis.designated_goods_compatibility_score,
          designated_goods_compatibility_reason: analysis.designated_goods_compatibility_reason,
          distinctiveness_score: analysis.distinctiveness_score,
          distinctiveness_reason: analysis.distinctiveness_reason,
          prior_trademark_similarity_score: analysis.prior_trademark_similarity_score,
          prior_trademark_similarity_reason: analysis.prior_trademark_similarity_reason,
          final_recommendation: analysis.final_recommendation
        }
      };
    });

    // 통계 계산
    const now = new Date();
    
    // 출원 관련 통계
    const applicationStats = {
      total: applicationData.length,
      inProgress: applicationData.filter((app: any) => 
        app.status === 'pending' || app.status === 'processing'
      ).length,
      completed: applicationData.filter((app: any) => 
        app.status === 'completed' || app.status === 'registered'
      ).length
    };

    const stats = {
      total: sessionData.length,
      completed: totalFinalAnalysesCount || 0,
      inProgress: sessionData.filter((s: any) => 
        s.status === 'processing' || s.status === 'briefing' || s.status === 'confirming'
      ).length,
      thisMonth: sessionData.filter((s: any) => {
        const sessionDate = new Date(s.created_at);
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
      }).length,
      applications: applicationStats.inProgress,
      registrations: applicationStats.completed
    };

    console.log('📊 [Dashboard API] Dashboard data fetched:', {
      userId: user.id,
      page,
      limit,
      totalSessions: sessions.length,
      totalFinalAnalyses: totalFinalAnalysesCount || 0,
      completedAnalyses: stats.completed,
      applications: applicationStats.total
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats,
        applications: applicationData,
        pagination: {
          page,
          limit,
          total: totalFinalAnalysesCount || 0,
          totalPages: Math.ceil((totalFinalAnalysesCount || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
};