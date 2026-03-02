import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'
import { createValidatedApiRoute } from '@/infrastructure/swagger/middleware/validation-middleware'
import {
  DashboardAnalysisParamsSchema,
  DashboardAnalysisResponseSchema
} from '@/infrastructure/swagger/schemas/dashboard-analysis.schema'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const { sessionId } = params;

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. 분석 세션 정보 조회
    const { data: session, error: sessionError } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select(`
        id,
        trademark_name,
        trademark_type,
        business_description,
        product_classification_codes,
        similar_group_codes,
        designated_products,
        image_url
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id) // 보안: user_id 검증 필수
      .in('status', ['completed', 'active'])
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Analysis session not found' },
        { status: 404 }
      )
    }

    // 2. 포괄적 분석 결과 조회 (comprehensive_analysis_results 테이블)
    const { data: comprehensiveData, error: comprehensiveError } = await supabase
      .schema('trademark_analysis')
      .from('comprehensive_analysis_results')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (comprehensiveError) {
      console.warn('⚠️ [Session API] Comprehensive analysis not found:', comprehensiveError.message);
    }

    // Use comprehensive analysis data
    const hasComprehensiveData = !!comprehensiveData;
    const analysisResult = comprehensiveData?.analysis_result || {};
    
    const registrationProbability = analysisResult.registrationProbability || 50;
    const aiConfidence = analysisResult.confidence || 85;
    const actualRiskLevel = analysisResult.riskLevel || 'medium';
    const actualKeyFindings = analysisResult.keyFindings || [];
    
    console.log('📊 [Session API] Analysis data sources:', {
      hasSession: !!session,
      hasComprehensiveData,
      comprehensiveError: comprehensiveError?.message,
      analysisVersion: comprehensiveData?.analysis_version
    });
    
    console.log('📊 [Session API] Retrieved analysis data:', {
      registrationProbability,
      aiConfidence,
      codeCompatibilityScore: analysisResult.codeCompatibility?.score,
      distinctivenessScore: analysisResult.distinctiveness?.score,
      similarityScore: analysisResult.priorSimilarity?.score,
      riskLevel: actualRiskLevel,
      hasKeyFindings: !!actualKeyFindings?.length
    });

    // 출원하기에 필요한 데이터 구성
    const applicationData = {
      sessionId: session.id,
      trademark: {
        name: session.trademark_name,
        type: session.trademark_type,
        imageUrl: session.image_url,
      },
      business: {
        description: session.business_description,
        productClassificationCodes: session.product_classification_codes || [],
        similarGroupCodes: session.similar_group_codes || [],
        designatedProducts: session.designated_products || [],
      },
      analysis: {
        registrationProbability,
        aiConfidence,
        riskLevel: actualRiskLevel,
        keyFindings: actualKeyFindings,
        reportId: comprehensiveData?.id,
        // 새로운 평가 기반 결과 데이터
        hasDetailedScores: hasComprehensiveData,
        criteriaScores: hasComprehensiveData ? {
          codeCompatibility: analysisResult.codeCompatibility?.score,
          distinctiveness: analysisResult.distinctiveness?.score,
          similarity: analysisResult.priorSimilarity?.score
        } : undefined,
        detailedAnalysis: hasComprehensiveData ? {
          codeCompatibilityAnalysis: analysisResult.codeCompatibility?.analysis,
          distinctivenessAnalysis: analysisResult.distinctiveness?.analysis,
          similarityAnalysis: analysisResult.priorSimilarity?.analysis
        } : undefined,
        conflictingTrademarks: analysisResult.conflictingTrademarks || [],
        classificationData: analysisResult.classificationData || null,
        similarityBreakdown: analysisResult.similarityBreakdown || null,
        analysisVersion: comprehensiveData?.analysis_version || null,
        processingTimeMs: comprehensiveData?.processing_time_ms || null
      }
    }

    return NextResponse.json({
      success: true,
      data: applicationData
    })

  } catch (error) {
    console.error('Analysis session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
};