/**
 * Stage 2 분석 결과 조회 API
 * 
 * Stage 2 ID를 통해 분석 결과를 조회하고 SimplifiedAnalysisResult 형태로 반환
 * Updated: comprehensive_analysis_results 테이블에서 직접 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/infrastructure/database/server';
import { fromStage2Data } from '@/features/trademark-analysis/_utils/analysis-data-mapper';
import { Stage1Data, Stage2Data } from '@/features/trademark-analysis/_types/simplified-types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId: stage2Id } = await context.params;
  
  console.log('🔍 [Stage2 Results API] Fetching analysis results:', stage2Id);

  try {
    // 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Stage 1 데이터 조회 - stage2Id는 실제로 stage1Id (sessionId)임
    const { data: stage1Data, error: stage1Error } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('*')
      .eq('id', stage2Id)
      .eq('user_id', user.id) // 보안: user_id 검증 추가
      .single();

    if (stage1Error || !stage1Data) {
      console.error('❌ [Stage2 Results API] Stage 1 data not found:', stage1Error);
      return NextResponse.json({
        success: false,
        error: 'Stage 1 데이터를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // trademark_final_analysis 테이블에서 분석 결과 조회
    console.log('🔍 [Stage2 Results API] Querying trademark_final_analysis with session_id:', stage2Id);
    
    const { data: finalAnalysisData, error: finalAnalysisError } = await supabase
      .schema('trademark_analysis')
      .from('trademark_final_analysis')
      .select('*')
      .eq('session_id', stage2Id)  // session_id로 조회
      .single();
    
    console.log('📊 [Stage2 Results API] Query result:', {
      hasData: !!finalAnalysisData,
      hasError: !!finalAnalysisError,
      errorCode: finalAnalysisError?.code
    });

    if (finalAnalysisError || !finalAnalysisData) {
      console.error('❌ [Stage2 Results API] Final analysis results not found:', {
        error: finalAnalysisError,
        stage2Id,
        query: `session_id = ${stage2Id}`,
        errorMessage: finalAnalysisError?.message,
        errorCode: finalAnalysisError?.code
      });
      return NextResponse.json({
        success: false,
        error: '종합 분석 결과를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 데이터 변환
    const stage1DataFormatted: Stage1Data = {
      id: stage1Data.id,
      trademarkName: stage1Data.trademark_name,
      trademarkType: stage1Data.trademark_type,
      trademarkImageUrl: stage1Data.image_url,
      businessDescription: stage1Data.business_description,
      productServices: stage1Data.product_services || [],
      targetMarket: '', // Not stored in new schema
      businessModel: '', // Not stored in new schema
      similarGroupCodes: stage1Data.similar_group_codes || [],
      selectedSimilarCode: stage1Data.selected_similar_code,
      userId: stage1Data.user_id,
      createdAt: stage1Data.created_at
    };

    // Query KIPRIS search results count
    let kiprisResultsCount = 0;
    let highRiskCount = 0;
    
    try {
      const { data: kiprisResults, error: kiprisError } = await supabase
        .schema('trademark_analysis')
        .from('kipris_search_results')
        .select('risk_level')
        .eq('session_id', stage2Id);
      
      if (kiprisResults && !kiprisError) {
        kiprisResultsCount = kiprisResults.length;
        highRiskCount = kiprisResults.filter(r => r.risk_level === 'high').length;
        console.log('📊 [Stage2 Results API] KIPRIS results found:', { 
          total: kiprisResultsCount, 
          highRisk: highRiskCount 
        });
      }
    } catch (error) {
      console.warn('⚠️ [Stage2 Results API] Failed to fetch KIPRIS results count:', error);
    }

    // trademark_final_analysis에서 Stage2Data 형식으로 변환
    // overallAssessment를 JSON 형식으로 변환
    const overallAssessment = {
      risks: finalAnalysisData.legal_risks || [],
      recommendations: finalAnalysisData.action_items || [],
      summary: finalAnalysisData.final_recommendation || '등록 가능성 분석 완료'
    };

    const stage2DataFormatted: Stage2Data = {
      id: finalAnalysisData.id,
      stage1Id: stage2Id,  // stage1_id
      registrationProbability: Number(finalAnalysisData.registration_possibility),
      aiConfidence: 85, // Default confidence as it's not stored in new table
      
      // All scores including new ones
      codeCompatibilityScore: Number(finalAnalysisData.designated_goods_compatibility_score),
      distinctivenessScore: Number(finalAnalysisData.distinctiveness_score),
      similarityScore: Number(finalAnalysisData.prior_trademark_similarity_score),
      nonRegistrableScore: Number(finalAnalysisData.non_registrable_score || 100),
      famousnessScore: Number(finalAnalysisData.famousness_score || 100),
      
      // Reasons and summaries
      codeCompatibilityReason: finalAnalysisData.designated_goods_compatibility_reason || '유사군 코드가 사업 영역과 적절하게 매칭됩니다.',
      distinctivenessReason: finalAnalysisData.distinctiveness_reason || '상표의 독창성이 양호하여 소비자 식별에 적합합니다.',
      similarityReason: finalAnalysisData.prior_trademark_similarity_reason || '일부 유사한 상표가 존재하여 주의가 필요합니다.',
      nonRegistrableSummary: finalAnalysisData.non_registrable_summary || '불등록 사유에 해당하지 않습니다.',
      famousnessSummary: finalAnalysisData.famousness_summary || '저명상표와의 충돌이 없습니다.',
      
      // JSONB fields - detailed legal analysis
      article33Violations: finalAnalysisData.article_33_violations || [],
      article34_1to6Violations: finalAnalysisData.article_34_1to6_violations || [],
      article34_9to14Violations: finalAnalysisData.article_34_9to14_violations || [],
      article34_1_7Violation: finalAnalysisData.article_34_1_7_violation || false,
      article35_1Violation: finalAnalysisData.article_35_1_violation || false,
      conflictingTrademarks: finalAnalysisData.conflicting_trademarks || [],
      internetSearchResults: finalAnalysisData.internet_search_results || {},
      legalRisks: finalAnalysisData.legal_risks || [],
      actionItems: finalAnalysisData.action_items || [],
      detailedAdvice: finalAnalysisData.detailed_advice || '',
      
      // Designated goods
      designatedGoods: finalAnalysisData.designated_goods || [],
      designatedGoodsSummary: finalAnalysisData.designated_goods_summary || '',
      designatedGoodsRecommended: finalAnalysisData.designated_goods_recommended || [],
      
      // Other metadata
      selectedSimilarCode: stage1Data.selected_similar_code || 'G0602',
      kiprisResultsCount, // Now using actual count from database
      highRiskCount, // Now using actual count from database
      processingTimeMs: finalAnalysisData.processing_time_ms || 0,
      createdAt: finalAnalysisData.created_at,
      finalRecommendation: finalAnalysisData.final_recommendation || '신중 검토 필요',
      // Pass the overallAssessment as JSON string
      overallAssessment: JSON.stringify(overallAssessment)
    };

    // SimplifiedAnalysisResult로 변환
    const analysisResult = fromStage2Data(stage1DataFormatted, stage2DataFormatted);

    console.log('✅ [Stage2 Results API] Results retrieved successfully:', {
      stage2Id,
      trademarkName: analysisResult.trademarkName,
      probability: analysisResult.registrationProbability
    });

    // Query KIPRIS search results for similar trademarks
    let similarTrademarks: Array<{
      id: string;
      trademarkName: string;
      imageUrl: string | null;
      applicationNumber: string;
      registrationNumber: string;
      applicantName: string;
      status: string;
      applicationDate: string;
      registrationDate: string;
      similarityScore: number;
      similarGroupCodes: string[];
      goodsClassificationCode: string | null;
    }> = [];
    try {
      const { data: kiprisDetailedResults, error: kiprisDetailedError } = await supabase
        .schema('trademark_analysis')
        .from('kipris_search_results')
        .select(`
          id,
          trademark_name,
          applicant_name,
          status,
          application_number,
          registration_number,
          application_date,
          registration_date,
          similarity_score,
          similar_group_codes,
          raw_data
        `)
        .eq('session_id', stage2Id)
        .order('similarity_score', { ascending: false })
        .limit(50);
      
      if (kiprisDetailedResults && !kiprisDetailedError) {
        // Extract thumbnailPath and goodsClassificationCode from raw_data and format the data
        similarTrademarks = kiprisDetailedResults.map(item => ({
          id: item.id,
          trademarkName: item.trademark_name,
          imageUrl: item.raw_data?.thumbnailPath || null,
          applicationNumber: item.application_number,
          registrationNumber: item.registration_number,
          applicantName: item.applicant_name,
          status: item.status,
          applicationDate: item.application_date,
          registrationDate: item.registration_date,
          similarityScore: item.similarity_score || 0,
          similarGroupCodes: item.similar_group_codes || [],
          goodsClassificationCode: item.raw_data?.goodsClassificationCode || null
        }));
        
        console.log('📊 [Stage2 Results API] Similar trademarks found:', similarTrademarks.length);
      }
    } catch (error) {
      console.warn('⚠️ [Stage2 Results API] Failed to fetch similar trademarks:', error);
    }

    // Add all detailed data for the EvaluationCriteria component
    const resultWithDetails = {
      ...analysisResult,
      // Individual scores
      codeCompatibilityScore: stage2DataFormatted.codeCompatibilityScore,
      distinctivenessScore: stage2DataFormatted.distinctivenessScore,
      similarityScore: stage2DataFormatted.similarityScore,
      nonRegistrableScore: stage2DataFormatted.nonRegistrableScore,
      famousnessScore: stage2DataFormatted.famousnessScore,
      
      // Detailed violation data
      article33Violations: stage2DataFormatted.article33Violations,
      article34_1to6Violations: stage2DataFormatted.article34_1to6Violations,
      article34_9to14Violations: stage2DataFormatted.article34_9to14Violations,
      article34_1_7Violation: stage2DataFormatted.article34_1_7Violation,
      article35_1Violation: stage2DataFormatted.article35_1Violation,
      conflictingTrademarks: stage2DataFormatted.conflictingTrademarks,
      internetSearchResults: stage2DataFormatted.internetSearchResults,
      
      // Designated goods data
      designatedGoods: stage2DataFormatted.designatedGoods,
      designatedGoodsRecommended: stage2DataFormatted.designatedGoodsRecommended,
      
      // Similar trademarks from KIPRIS
      similarTrademarks
    };

    return NextResponse.json({
      success: true,
      stage2Id,
      analysisResult: resultWithDetails,
      metadata: {
        sessionId: stage1Data.id,
        processingTimeMs: stage2DataFormatted.processingTimeMs,
        createdAt: stage2DataFormatted.createdAt,
        updatedAt: finalAnalysisData.updated_at
      }
    });

  } catch (error) {
    console.error('❌ [Stage2 Results API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Stage 2 분석 상태 조회
export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId: stage2Id } = await context.params;
  
  try {
    // Try to use service role client first, fall back to server client if needed
    let supabase;
    try {
      supabase = await createServiceRoleClient();
    } catch (error) {
      supabase = await createServerClient();
    }
    
    // Query comprehensive_analysis_results instead of trademark_stage2_analysis
    const { data, error } = await supabase
      .schema('trademark_analysis')
      .from('comprehensive_analysis_results')
      .select('id, created_at')
      .eq('session_id', stage2Id)  // Use session_id to match
      .single();

    if (error || !data) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Last-Modified': data.created_at,
        'Cache-Control': 'public, max-age=300' // 5분 캐시
      }
    });

  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}