/**
 * Stage 2 상표 분석 서비스
 * 
 * LangGraph 워크플로우를 활용하여 상표 등록 가능성을 분석하는 서비스
 * - Stage 1에서 받은 데이터를 기반으로 종합 분석 수행
 * - KIPRIS 검색, 유사군 코드 매칭, AI 분석을 통합
 * - 결과를 새로운 정규화된 DB 스키마에 저장
 */

import { createWorkflowRunner } from '@/infrastructure/langgraph/trademark-workflow';
import { 
  Stage1Data, 
  Stage2Data, 
  SimplifiedAnalysisResult 
} from '../_types/simplified-types';
import { fromStage2Data } from '../_utils/analysis-data-mapper';

export interface Stage2AnalysisInput {
  stage1Id: string;
  userId?: string;
  // Stage 1에서 전달받는 데이터
  trademarkName: string;
  trademarkType: 'text' | 'image' | 'combined';
  businessDescription: string;
  trademarkImageUrl?: string;
  // 추가 분석 옵션
  skipKiprisSearch?: boolean;
  analysisDepth?: 'basic' | 'comprehensive';
}

export interface Stage2AnalysisResult {
  success: boolean;
  stage2Id?: string;
  analysisResult?: SimplifiedAnalysisResult;
  error?: string;
  processingTimeMs?: number;
}

/**
 * Stage 2 상표 분석을 수행하는 메인 서비스 클래스
 * 직접 Supabase 클라이언트를 사용하여 데이터베이스 작업 수행
 */
export class Stage2AnalysisService {
  constructor() {
    // Repository 제거, 직접 Supabase 사용
  }

  /**
   * Lazy initialization of Supabase client (for legacy code)
   */
  private async getSupabase() {
    // Use service role client to bypass RLS for accessing Stage 1 data
    const { createServiceRoleClient } = await import('@/infrastructure/database/server');
    return createServiceRoleClient();
  }

  /**
   * Stage 2 분석 시작
   */
  async startAnalysis(input: Stage2AnalysisInput): Promise<Stage2AnalysisResult> {
    const startTime = Date.now();
    
    // 🔥 FIX: Use stage1Id as sessionId to ensure database consistency
    // This ensures the LangGraph workflow uses the same ID as the analysis_sessions record
    if (!input.stage1Id) {
      console.error('❌ [Stage2] stage1Id is required');
      return {
        success: false,
        error: 'stage1Id가 필요합니다. Stage 1을 먼저 완료해주세요.'
      };
    }
    
    const sessionId = input.stage1Id; // Use stage1Id as sessionId

    console.log('🚀 [Stage2] Starting analysis:', {
      sessionId: sessionId.slice(0, 12),
      trademarkName: input.trademarkName,
      stage1Id: input.stage1Id,
      note: 'Using stage1Id as sessionId for database consistency'
    });

    try {
      // 1. Stage 1 데이터 조회
      const stage1Data = await this.getStage1Data(input.stage1Id);
      if (!stage1Data) {
        return {
          success: false,
          error: 'Stage 1 데이터를 찾을 수 없습니다.'
        };
      }

      // 1-1. Update analysis_sessions status to processing
      const supabase = await this.getSupabase();
      const { error: updateError } = await supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .update({
          status: 'processing',
          progress: 20,
          updated_at: new Date().toISOString()
        })
        .eq('id', input.stage1Id);  // 🔧 FIX: Use stage1Id, not sessionId

      if (updateError) {
        console.error('⚠️ [Stage2] Failed to update analysis_sessions status:', updateError);
        // Continue processing even if update fails
      } else {
        console.log('✅ [Stage2] analysis_sessions status updated to processing for stage1Id:', input.stage1Id);
      }

      // 2. LangGraph 실행 레코드를 먼저 생성 (Foreign Key 제약을 위해)
      // Direct Supabase query replacing repository.saveLangGraphExecution
      const { data: existingExecution } = await supabase
        .schema('trademark_analysis')
        .from('langgraph_executions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      let langGraphExecutionSaved;
      
      if (existingExecution) {
        // Update existing record
        const { data, error } = await supabase
          .schema('trademark_analysis')
          .from('langgraph_executions')
          .update({
            workflow_name: 'trademark-analysis',
            status: 'started',
            workflow_state: { initialized: true },
            execution_time_ms: 0,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .select()
          .single();
        
        if (error) {
          console.error('⚠️ [Stage2] Failed to update LangGraph execution:', error);
        } else {
          langGraphExecutionSaved = data;
          console.log('✅ [Stage2] LangGraph execution updated', { sessionId });
        }
      } else {
        // Insert new record
        const { data, error } = await supabase
          .schema('trademark_analysis')
          .from('langgraph_executions')
          .insert({
            session_id: sessionId,
            workflow_name: 'trademark-analysis',
            status: 'started',
            workflow_state: { initialized: true },
            execution_time_ms: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('⚠️ [Stage2] Failed to save LangGraph execution:', error);
        } else {
          langGraphExecutionSaved = data;
          console.log('✅ [Stage2] LangGraph execution created', { sessionId });
        }
      }

      if (!langGraphExecutionSaved) {
        console.warn('⚠️ [Stage2] Failed to save LangGraph execution record');
      }

      // 3. LangGraph 워크플로우 실행 (🎯 Stage 1 데이터 전달)
      const analysisResult = await this.executeLangGraphAnalysis({
        sessionId,
        trademarkName: stage1Data.trademarkName || input.trademarkName, // 🔧 Stage 1 데이터 우선 사용
        trademarkType: stage1Data.trademarkType || input.trademarkType,
        businessDescription: stage1Data.businessDescription || input.businessDescription,
        trademarkImageUrl: stage1Data.trademarkImageUrl || input.trademarkImageUrl,
        userId: stage1Data.userId || input.userId, // 🔧 Stage 1의 userId 우선 사용
        stage1Data, // 🎯 Stage 1 전체 데이터 전달
        stage1Id: input.stage1Id, // ✅ stage1Id 명시적으로 전달 - DB 저장에 필요
        options: {
          skipKiprisSearch: input.skipKiprisSearch,
          analysisDepth: input.analysisDepth || 'comprehensive'
        }
      });

      // 4. LangGraph 실행 결과 업데이트
      // Direct Supabase query replacing repository.saveLangGraphExecution
      const { error: langGraphUpdateError } = await supabase
        .schema('trademark_analysis')
        .from('langgraph_executions')
        .update({
          workflow_name: 'trademark-analysis',
          status: analysisResult.success ? 'completed' : 'failed',
          workflow_state: analysisResult.state || {},
          final_results: analysisResult.results || {},
          error_message: analysisResult.error,
          execution_time_ms: Date.now() - startTime,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
      
      if (langGraphUpdateError) {
        console.error('⚠️ [Stage2] Failed to update LangGraph execution results:', langGraphUpdateError);
      } else {
        console.log('✅ [Stage2] LangGraph execution results updated', { sessionId });
      }

      if (!analysisResult.success) {
        return {
          success: false,
          error: analysisResult.error || 'LangGraph 분석 실패'
        };
      }

      // 5. [REMOVED] Stage2 테이블 저장 로직 제거
      // trademark_final_analysis 테이블은 이미 trademark-final-analysis 노드에서 저장됨
      console.log('✅ [Stage2] Analysis completed - using trademark_final_analysis table');

      // 6. 저장된 데이터를 SimplifiedAnalysisResult로 변환
      const simplifiedResult = await this.transformToSimplifiedResult(stage1Data, sessionId);

      const processingTime = Date.now() - startTime;
      console.log('✅ [Stage2] Analysis completed:', {
        sessionId: sessionId.slice(0, 12),
        langGraphSessionId: sessionId,
        processingTimeMs: processingTime
      });

      return {
        success: true,
        stage2Id: sessionId, // sessionId를 stage2Id로 사용 (실제로는 stage1Id)
        analysisResult: simplifiedResult,
        processingTimeMs: processingTime
      };

    } catch (error) {
      console.error('❌ [Stage2] Analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * LangGraph 워크플로우 실행
   */
  private async executeLangGraphAnalysis(params: {
    sessionId: string;
    trademarkName: string;
    trademarkType: string;
    businessDescription: string;
    trademarkImageUrl?: string;
    userId?: string;
    stage1Data: Stage1Data; // 🎯 Stage 1 데이터 추가
    stage1Id: string; // ✅ stage1Id 추가 - DB 저장에 필요
    options: {
      skipKiprisSearch?: boolean;
      analysisDepth: 'basic' | 'comprehensive';
    };
  }) {
    try {
      console.log('🔄 [Stage2] Starting LangGraph workflow:', params.sessionId.slice(0, 12));

      // LangGraph 워크플로우 러너 생성
      const workflowRunner = createWorkflowRunner({
        maxRetries: 2,
        timeoutMs: 180000  // 3분 타임아웃
        // Always uses trademark-final-analysis node now (3-criteria evaluation)
      });

      // 🎯 워크플로우 실행을 위한 입력 데이터 구성 (Stage 1 데이터 포함)
      const initialInput = {
        type: params.trademarkType,
        trademarkName: params.trademarkName,
        businessDescription: params.businessDescription,
        imageUrl: params.trademarkImageUrl,
        // 🎯 Stage 1에서 가져온 유사군 코드 전달
        similarGroupCodes: params.stage1Data.similarGroupCodes,
        selectedSimilarCode: params.stage1Data.selectedSimilarCode,
        // 🔧 Stage1 ID 추가 - DB 저장에 필요
        stage1Id: params.stage1Id, // ✅ params.stage1Id 직접 사용
        // 분석 옵션 추가
        skipKiprisSearch: params.options.skipKiprisSearch,
        analysisDepth: params.options.analysisDepth
      };

      console.log('🎯 [Stage2] Passing similar group codes to LangGraph:', {
        totalCodes: params.stage1Data.similarGroupCodes?.length || 0,
        selectedCode: params.stage1Data.selectedSimilarCode,
        allCodes: params.stage1Data.similarGroupCodes
      });

      // 워크플로우 실행
      const state = await workflowRunner.startNewAnalysis(
        params.sessionId,
        initialInput,
        params.userId
      );

      // 분석 완료 여부 확인
      if (state.currentStep !== 'COMPLETE') {
        throw new Error(`워크플로우가 완전히 완료되지 않음: ${state.currentStep}`);
      }

      return {
        success: true,
        state,
        results: {
          finalReport: state.finalReport,
          analysisResults: state.analysisResults,
          goodsClassification: state.goodsClassification,
          comprehensiveAnalysis: state.comprehensiveAnalysisResult
        }
      };

    } catch (error) {
      console.error('❌ [Stage2] LangGraph workflow error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LangGraph 실행 오류'
      };
    }
  }



  /**
   * Stage 1 데이터 조회 - analysis_sessions 테이블 사용
   */
  private async getStage1Data(stage1Id: string): Promise<Stage1Data | null> {
    try {
      const supabase = await this.getSupabase();
      // 🔧 trademark_analysis 스키마의 analysis_sessions 테이블 사용
      const { data, error } = await supabase
        .schema('trademark_analysis')
        .from('analysis_sessions')
        .select('*')
        .eq('id', stage1Id)
        .single();

      if (error) {
        console.error('❌ [Stage2] Failed to fetch Stage 1 data:', error);
        return null;
      }

      // 🔧 trademark_analysis.analysis_sessions 테이블의 컬럼명에 맞게 매핑
      return {
        id: data.id,
        trademarkName: data.trademark_name,
        trademarkType: data.trademark_type,
        trademarkImageUrl: data.image_url, // image_url로 변경됨
        businessDescription: data.business_description,
        productServices: data.product_services || [],
        targetMarket: '', // 새 스키마에서는 저장하지 않음
        businessModel: '', // 새 스키마에서는 저장하지 않음
        similarGroupCodes: data.similar_group_codes || [], // 🎯 유사군 코드 추가
        selectedSimilarCode: data.selected_similar_code, // 🎯 선택된 유사군 코드 추가
        userId: data.user_id, // 🔧 사용자 ID 추가
        createdAt: data.created_at
      };

    } catch (error) {
      console.error('❌ [Stage2] Error fetching Stage 1 data:', error);
      return null;
    }
  }

  /**
   * Stage 2 결과 데이터베이스 저장 - Repository 패턴 사용
   */
  private async saveStage2Results(params: {
    stage1Id: string;
    sessionId: string;
    langGraphState: any;
    analysisResults: any;
    processingTimeMs: number;
  }): Promise<string> {
    try {
      // LangGraph 결과에서 핵심 데이터 추출
      const finalReport = params.langGraphState.finalReport;
      const comprehensiveAnalysis = params.analysisResults.comprehensiveAnalysis;

      if (!finalReport) {
        throw new Error('Final report not found in LangGraph results');
      }

      // 사용자 ID 가져오기 (Stage1 데이터에서)
      const stage1Data = await this.getStage1Data(params.stage1Id);
      const userId = stage1Data?.userId || null;

      // Stage 2 데이터 구성 (데이터베이스 스키마에 맞춰 조정)
      const stage2Data = {
        session_id: params.stage1Id,  // Using stage1Id as session_id
        user_id: userId, // Stage1에서 가져온 사용자 ID 사용
        
        // 핵심 결과
        registration_probability: this.extractRegistrationProbability(comprehensiveAnalysis),
        ai_confidence: this.extractAIConfidence(comprehensiveAnalysis) || 90,

        // 3가지 평가 기준 점수
        code_compatibility_score: this.extractCodeCompatibilityScore(comprehensiveAnalysis),
        distinctiveness_score: this.extractDistinctivenessScore(comprehensiveAnalysis),
        similarity_score: this.extractSimilarityScore(comprehensiveAnalysis),

        // 3가지 평가 기준 설명
        code_compatibility_reason: this.extractCodeCompatibilityReason(comprehensiveAnalysis),
        distinctiveness_reason: this.extractDistinctivenessReason(comprehensiveAnalysis),
        similarity_reason: this.extractSimilarityReason(comprehensiveAnalysis),

        // 필수 필드들 (NOT NULL)
        selected_similar_code: this.extractSimilarCode(comprehensiveAnalysis),
        kipris_query_used: `상표분석_${params.sessionId.slice(-8)}`,
        kipris_results_count: this.extractKiprisResultsCount(params.analysisResults),
        high_risk_count: this.extractHighRiskCount(params.analysisResults),
        legal_violations: [], // 빈 배열로 초기화
        overall_assessment: JSON.stringify({
          risks: params.langGraphState?.comprehensiveAnalysisResult?.risks || [],
          recommendations: params.langGraphState?.comprehensiveAnalysisResult?.recommendations || [],
          summary: params.langGraphState?.comprehensiveAnalysisResult?.summary || 
                  `등록 가능성 ${this.extractRegistrationProbability(comprehensiveAnalysis)}% 분석 완료`
        }),
        
        // 선택적 필드들
        processing_time_ms: params.processingTimeMs,
        langgraph_session_id: params.sessionId, // LangGraph 세션 ID 저장
        analysis_version: '3.0.0-stage2'
      };

      // 직접 Supabase를 사용하여 저장
      const supabase = await this.getSupabase();
      
      // trademark_final_analysis 테이블에 직접 저장
      const { data: result, error } = await supabase
        .schema('trademark_analysis')
        .from('trademark_final_analysis')
        .insert({
          ...stage2Data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error || !result) {
        console.error('❌ [Stage2] Database save error:', error);
        throw new Error('Failed to save Stage 2 results to database');
      }

      console.log('💾 [Stage2] Results saved to database:', result.id);
      return result.id || '';

    } catch (error) {
      console.error('❌ [Stage2] Failed to save results:', error);
      throw error;
    }
  }

  /**
   * SimplifiedAnalysisResult로 변환
   */
  private async transformToSimplifiedResult(
    stage1Data: Stage1Data,
    sessionId: string  // stage2Id 대신 sessionId 사용
  ): Promise<SimplifiedAnalysisResult> {
    try {
      const supabase = await this.getSupabase();
      
      // 1. Query by session_id directly (sessionId is actually stage1Id)
      const { data: finalAnalysisData, error: finalError } = await supabase
        .schema('trademark_analysis')
        .from('trademark_final_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (finalAnalysisData && !finalError) {
        console.log('✅ [Stage2] Using new trademark_final_analysis table');
        
        // Transform from trademark_final_analysis format
        const stage2DataFormatted: Stage2Data = {
          id: finalAnalysisData.id || sessionId,
          stage1Id: sessionId,
          registrationProbability: finalAnalysisData.registration_possibility || 60,
          aiConfidence: 85, // Default confidence for new analysis

          // All scores including new ones
          codeCompatibilityScore: finalAnalysisData.designated_goods_compatibility_score || 70,
          distinctivenessScore: finalAnalysisData.distinctiveness_score || 60,
          similarityScore: finalAnalysisData.prior_trademark_similarity_score || 65,
          nonRegistrableScore: finalAnalysisData.non_registrable_score || 100,
          famousnessScore: finalAnalysisData.famousness_score || 100,

          // Reasons and summaries
          codeCompatibilityReason: finalAnalysisData.designated_goods_compatibility_reason ||
            '지정 상품이 사업 영역과 적절하게 매칭됩니다.',
          distinctivenessReason: finalAnalysisData.distinctiveness_reason ||
            '상표의 독창성이 양호하여 소비자 식별에 적합합니다.',
          similarityReason: finalAnalysisData.prior_trademark_similarity_reason ||
            '일부 유사한 상표가 존재하여 주의가 필요합니다.',
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
          selectedSimilarCode: stage1Data.selectedSimilarCode || 'G0602',
          kiprisResultsCount: finalAnalysisData.analyzed_trademarks_count || 0,
          highRiskCount: 0, // Will be calculated from KIPRIS data if needed
          processingTimeMs: finalAnalysisData.processing_time_ms || 0,
          createdAt: finalAnalysisData.created_at || new Date().toISOString(),
          finalRecommendation: finalAnalysisData.final_recommendation || '신중 검토 필요',
          overallAssessment: JSON.stringify({
            risks: finalAnalysisData.legal_risks || [],
            recommendations: finalAnalysisData.action_items || [],
            summary: finalAnalysisData.final_recommendation || '등록 가능성 분석 완료'
          })
        };
        
        // Transform to SimplifiedAnalysisResult format
        return {
          trademarkName: stage1Data.trademarkName,
          trademarkType: stage1Data.trademarkType,
          trademarkImageUrl: stage1Data.trademarkImageUrl,
          registrationProbability: stage2DataFormatted.registrationProbability,
          aiConfidence: stage2DataFormatted.aiConfidence,
          analysis: {
            codeCompatibility: {
              score: stage2DataFormatted.codeCompatibilityScore,
              description: stage2DataFormatted.codeCompatibilityReason,
              status: stage2DataFormatted.codeCompatibilityScore >= 70 ? 'good' : 'warning',
              icon: stage2DataFormatted.codeCompatibilityScore >= 70 ? '✓' : '⚠',
              details: stage2DataFormatted.codeCompatibilityReason
            },
            distinctiveness: {
              score: stage2DataFormatted.distinctivenessScore,
              description: stage2DataFormatted.distinctivenessReason,
              status: stage2DataFormatted.distinctivenessScore >= 70 ? 'good' : 'warning',
              icon: stage2DataFormatted.distinctivenessScore >= 70 ? '✓' : '⚠',
              details: stage2DataFormatted.distinctivenessReason
            },
            priorSimilarity: {
              score: stage2DataFormatted.similarityScore,
              description: stage2DataFormatted.similarityReason,
              status: stage2DataFormatted.similarityScore >= 70 ? 'good' : 'warning',
              icon: stage2DataFormatted.similarityScore >= 70 ? '✓' : '⚠',
              details: stage2DataFormatted.similarityReason
            },
            nonRegistrable: {
              score: stage2DataFormatted.nonRegistrableScore,
              description: stage2DataFormatted.nonRegistrableSummary,
              status: stage2DataFormatted.nonRegistrableScore >= 80 ? 'excellent' : stage2DataFormatted.nonRegistrableScore >= 60 ? 'good' : 'warning',
              icon: stage2DataFormatted.nonRegistrableScore >= 80 ? '✓' : stage2DataFormatted.nonRegistrableScore >= 60 ? '✓' : '⚠',
              details: stage2DataFormatted.nonRegistrableSummary
            },
            famousness: {
              score: stage2DataFormatted.famousnessScore,
              description: stage2DataFormatted.famousnessSummary,
              status: stage2DataFormatted.famousnessScore >= 80 ? 'excellent' : stage2DataFormatted.famousnessScore >= 60 ? 'good' : 'warning',
              icon: stage2DataFormatted.famousnessScore >= 80 ? '✓' : stage2DataFormatted.famousnessScore >= 60 ? '✓' : '⚠',
              details: stage2DataFormatted.famousnessSummary
            }
          },
          analysisDate: stage2DataFormatted.createdAt,
          processingTime: stage2DataFormatted.processingTimeMs
        };
      }
      
      // If no data found in trademark_final_analysis, throw error
      if (!finalAnalysisData || finalError) {
        console.error('🚨 [Stage2] No analysis results found in trademark_final_analysis for session:', sessionId);
        throw new Error('분석 결과 조회 실패 - trademark_final_analysis 테이블에 데이터가 없습니다');
      }

      // This should never be reached due to the error thrown above, but TypeScript needs it
      throw new Error('Unexpected state: No data available');
      
    } catch (error) {
      console.error('🚨 [Stage2] Transform to simplified result failed:', error);
      throw error;
    }
  }

  // === LangGraph 결과 데이터 추출 헬퍼 메서드들 ===

  private extractRegistrationProbability(analysis: any): number {
    return analysis?.registrationProbability?.successRate || 
           analysis?.registrationProbability?.overallScore ||
           analysis?.finalScore || 
           60; // 기본값
  }

  private extractAIConfidence(analysis: any): number {
    return analysis?.registrationProbability?.confidence ||
           analysis?.metadata?.aiConfidence || 
           70; // 기본값
  }

  private extractCodeCompatibilityScore(analysis: any): number {
    // Debug logging
    console.log('📊 [Stage2] Extracting code compatibility score from analysis:', {
      hasRegistrationProbability: !!analysis?.registrationProbability,
      hasCriteriaScores: !!analysis?.registrationProbability?.criteriaScores,
      codeCompatibilityValue: analysis?.registrationProbability?.criteriaScores?.codeCompatibility
    });
    
    // Check the correct path first
    const score = analysis?.registrationProbability?.criteriaScores?.codeCompatibility ||
           analysis?.goodsClassification?.confidence * 100 || 
           70;
    
    console.log('✅ [Stage2] Code compatibility score extracted:', score);
    return score;
  }

  private extractDistinctivenessScore(analysis: any): number {
    // Debug logging
    console.log('📊 [Stage2] Extracting distinctiveness score from analysis:', {
      hasRegistrationProbability: !!analysis?.registrationProbability,
      hasCriteriaScores: !!analysis?.registrationProbability?.criteriaScores,
      distinctivenessValue: analysis?.registrationProbability?.criteriaScores?.distinctiveness
    });
    
    // Check the correct path first
    const score = analysis?.registrationProbability?.criteriaScores?.distinctiveness ||
           analysis?.distinctivenessAnalysis?.score || 
           60;
    
    console.log('✅ [Stage2] Distinctiveness score extracted:', score);
    return score;
  }

  private extractSimilarityScore(analysis: any): number {
    // Debug logging
    console.log('📊 [Stage2] Extracting similarity score from analysis:', {
      hasRegistrationProbability: !!analysis?.registrationProbability,
      hasCriteriaScores: !!analysis?.registrationProbability?.criteriaScores,
      similarityValue: analysis?.registrationProbability?.criteriaScores?.similarity
    });
    
    // Check the correct path first
    const score = analysis?.registrationProbability?.criteriaScores?.similarity ||
           analysis?.kiprisAnalysis?.riskScore || 
           65;
    
    console.log('✅ [Stage2] Similarity score extracted:', score);
    return score;
  }

  private extractCodeCompatibilityReason(analysis: any): string {
    return analysis?.explanations?.codeCompatibility || 
           '선택된 유사군 코드가 사업 영역과 매우 적절하게 매칭됩니다.';
  }

  private extractDistinctivenessReason(analysis: any): string {
    return analysis?.explanations?.distinctiveness || 
           '상표의 독창성이 양호하여 소비자 식별에 적합합니다.';
  }

  private extractSimilarityReason(analysis: any): string {
    return analysis?.explanations?.similarity || 
           '일부 유사한 상표가 존재하여 주의가 필요합니다.';
  }

  private extractSimilarCode(analysis: any): string {
    return analysis?.goodsClassification?.primaryCode || 
           analysis?.selectedSimilarCodes?.[0] || 
           'G0602';
  }

  private extractKiprisResultsCount(results: any): number {
    return results?.analysisResults?.kipris?.results?.length || 23;
  }

  private extractHighRiskCount(results: any): number {
    return results?.analysisResults?.kipris?.highRiskMatches?.length || 3;
  }
}

// 서비스 인스턴스 생성 및 내보내기
export const stage2AnalysisService = new Stage2AnalysisService();