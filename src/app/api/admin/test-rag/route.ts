import { NextRequest, NextResponse } from 'next/server';
import { goodsClassifierNode, GoodsClassificationResult } from '@/infrastructure/langgraph/nodes/goods-classifier';
import { TrademarkAnalysisState } from '@/infrastructure/langgraph/types/state';
import { z } from 'zod';

// 요청 스키마 정의
const testRequestSchema = z.object({
  businessDescription: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 검증
    const body = await request.json();
    const validatedData = testRequestSchema.parse(body);

    const startTime = Date.now();

    console.log(`🛍️ [Goods Classifier Test] Starting analysis for: ${validatedData.businessDescription}`);

    try {
      // goodsClassifierNode 호출 (새로운 점수 시스템 포함)
      const mockState: TrademarkAnalysisState = {
        sessionId: `test-${Date.now()}`,
        initialInput: {
          type: 'text',
          businessDescription: validatedData.businessDescription,
          trademarkName: 'test-trademark'
        },
        conversationHistory: [],
        informationChecklist: {
          basicInfoCollected: true,
          analysisReady: true
        },
        currentStep: 'ANALYZING',
        progress: 0,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const classifierResult = await goodsClassifierNode(mockState);
      const executionTime = Date.now() - startTime;

      console.log(`✅ [Goods Classifier Test] Analysis completed in ${executionTime}ms`);

      // goodsClassificationResult에서 데이터 추출
      const goodsClassification = classifierResult.goodsClassification as GoodsClassificationResult;

      if (!goodsClassification) {
        throw new Error('Classification result not found');
      }

      return NextResponse.json({
        success: true,
        query: validatedData.businessDescription,
        // === 기본 RAG 응답 형식 (호환성 유지) ===
        summary: `${goodsClassification.primaryClassification.className} 분류로 분석되었습니다.`,
        primary_recommendation: {
          recommendation_type: "주요 추천",
          analysis: {
            business_type: goodsClassification.primaryClassification.description,
            reason: `신뢰도 ${(goodsClassification.primaryClassification.confidence * 100).toFixed(1)}%로 분석됨`,
            class_code: goodsClassification.primaryClassification.classCode,
            similar_group_code: goodsClassification.similarGroupCodes[0]?.code || 'N/A'
          },
          recommended_products: goodsClassification.relatedProducts
            .filter(p => p.classCode === goodsClassification.primaryClassification.classCode)
            .map(p => p.productName)
        },
        secondary_recommendation: goodsClassification.alternativeClassifications.length > 0 ? {
          recommendation_type: "차선책 추천",
          analysis: {
            business_type: goodsClassification.alternativeClassifications[0].description,
            reason: goodsClassification.alternativeClassifications[0].reason,
            class_code: goodsClassification.alternativeClassifications[0].classCode,
            similar_group_code: goodsClassification.similarGroupCodes[1]?.code || 'N/A'
          },
          recommended_products: goodsClassification.relatedProducts
            .filter(p => p.classCode === goodsClassification.alternativeClassifications[0].classCode)
            .map(p => p.productName)
        } : null,
        professional_advice: `${goodsClassification.recommendations.strategy}. 위험도: ${goodsClassification.recommendations.riskAssessment}`,
        executionTime,

        // === 🚀 ENHANCED: 완전한 goods-classifier 결과 분석 ===
        goods_classifier_analysis: {
          // 주요 분류 정보
          primary_classification: goodsClassification.primaryClassification,
          // 대안 분류들 (전체)
          alternative_classifications: goodsClassification.alternativeClassifications,
          // 유사군 코드 상세 정보
          similar_group_codes: goodsClassification.similarGroupCodes,
          // 관련 상품 전체 (유사도 점수 포함)
          related_products: goodsClassification.relatedProducts,
          // 출원 전략 및 추천사항
          recommendations: goodsClassification.recommendations,
          // 분석 메타데이터
          analysis_metadata: goodsClassification.analysisMetadata
        },

        // === 📊 ENHANCED: 성능 및 품질 분석 ===
        performance_analysis: {
          execution_time_ms: executionTime,
          execution_time_breakdown: {
            goods_classifier_node: goodsClassification.analysisMetadata.executionTime,
            api_overhead: executionTime - goodsClassification.analysisMetadata.executionTime
          },
          data_quality_metrics: {
            total_products_found: goodsClassification.relatedProducts.length,
            unique_similar_groups: goodsClassification.similarGroupCodes.length,
            primary_confidence: goodsClassification.primaryClassification.confidence,
            average_similarity_score: goodsClassification.relatedProducts.length > 0
              ? goodsClassification.relatedProducts.reduce((sum, p) => sum + p.similarityScore, 0) / goodsClassification.relatedProducts.length
              : 0,
            has_alternative_classification: goodsClassification.alternativeClassifications.length > 0
          },
          rag_engine_metrics: {
            data_source: goodsClassification.analysisMetadata.dataSource,
            search_queries_executed: goodsClassification.analysisMetadata.searchQueries,
            total_rag_results: goodsClassification.analysisMetadata.totalResults,
            rag_confidence: goodsClassification.analysisMetadata.confidence
          }
        },

        // === 점수 시스템 정보 ===
        scoring_system: {
          primary_confidence: goodsClassification.primaryClassification.confidence,
          primary_relevance: goodsClassification.similarGroupCodes[0]?.relevance || 0,
          secondary_confidence: goodsClassification.alternativeClassifications[0]?.confidence || 0,
          similarity_scores: goodsClassification.relatedProducts.slice(0, 10).map(p => p.similarityScore),
          data_source: goodsClassification.analysisMetadata.dataSource
        },

        // === 메타데이터 ===
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: classifierResult.sessionId || `test-${Date.now()}`,
          node_version: 'goods-classifier-v2.0',
          rag_engine_version: 'gemini-2.5-pro-rag',
          total_conversation_messages: classifierResult.conversationHistory?.length || 0,
          has_errors: (classifierResult.errors?.length || 0) > 0,
          workflow_status: 'completed'
        }
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ [Goods Classifier Test] Analysis failed:', error);

      return NextResponse.json({
        success: false,
        query: validatedData.businessDescription,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime,
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: `test-${Date.now()}`,
          node_version: 'goods-classifier-v2.0',
          workflow_status: 'failed'
        }
      }, { status: 500 });
    }

  } catch (validationError) {
    console.error('❌ [Goods Classifier Test] Validation error:', validationError);
    return NextResponse.json({
      success: false,
      error: 'Invalid request data',
      details: validationError instanceof Error ? validationError.message : String(validationError)
    }, { status: 400 });
  }
}

// GET 요청 처리 (헬스 체크)
export async function GET() {
  try {
    return NextResponse.json({
      status: 'available',
      message: 'RAG Engine Test API is running',
      timestamp: new Date().toISOString(),
      config: {
        ragCorpusId: process.env.GCP_RAG_CORPUS_ID || 'not-configured',
        location: process.env.GCP_LOCATION || 'us-east4',
        projectId: process.env.GCP_PROJECT_ID || 'not-configured'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}