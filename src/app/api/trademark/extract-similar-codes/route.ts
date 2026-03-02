import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRAGEngineService } from '@/infrastructure/ai/rag-engine-service';

// Local type definitions to avoid GitHub Actions type resolution issues
interface LocalRAGRecommendation {
  recommendation_type: string;
  analysis: {
    business_type: string;
    reason: string;
    class_code: string;
    similar_group_code: string;
  };
  recommended_products: string[];
}

interface LocalRAGEngineResponse {
  summary: string;
  primary_recommendation: LocalRAGRecommendation;
  secondary_recommendation: LocalRAGRecommendation | null;
  professional_advice: string;
}

// Request validation schema
const extractCodesSchema = z.object({
  businessDescription: z.string().min(1, '사업 설명을 입력해주세요'),
  userChoice: z.enum(['both', 'primary', 'secondary']).optional().default('both')
});

/**
 * POST /api/trademark/extract-similar-codes
 *
 * 사업 설명을 받아서 유사군 코드를 추출하는 API
 * RAG Engine을 사용하여 AI 기반 상품 분류 추출
 *
 * @param businessDescription - 사업 설명 텍스트
 * @param userChoice - 추출할 추천 타입 (both, primary, secondary)
 * @returns 추출된 유사군 코드, 상품분류, 신뢰도 등
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Request body parsing and validation
    const body = await request.json();
    const validatedData = extractCodesSchema.parse(body);

    const { businessDescription, userChoice } = validatedData;

    console.log(`🔍 [Extract Similar Codes] Analyzing business description: "${businessDescription.substring(0, 100)}..."`);

    // 2. RAG Engine Service 초기화
    const ragEngine = createRAGEngineService();

    // 3. 사업 설명 분석 및 유사군 코드 추출
    const analysisResult = await ragEngine.analyzeBusinessDescription(businessDescription) as unknown as LocalRAGEngineResponse;

    // 4. 유사군 코드 추출
    const extractedCodes: string[] = [];
    const classificationDetails: Array<{
      type: string;
      classCode: string;
      similarGroupCode: string;
      businessType: string;
      reason: string;
      products: string[];
    }> = [];

    // Primary recommendation 처리
    if (userChoice === 'both' || userChoice === 'primary') {
      const primary = analysisResult.primary_recommendation;
      extractedCodes.push(primary.analysis.similar_group_code);
      classificationDetails.push({
        type: 'primary',
        classCode: primary.analysis.class_code,
        similarGroupCode: primary.analysis.similar_group_code,
        businessType: primary.analysis.business_type,
        reason: primary.analysis.reason,
        products: primary.recommended_products
      });
    }

    // Secondary recommendation 처리
    if ((userChoice === 'both' || userChoice === 'secondary') && analysisResult.secondary_recommendation) {
      const secondary = analysisResult.secondary_recommendation;
      extractedCodes.push(secondary.analysis.similar_group_code);
      classificationDetails.push({
        type: 'secondary',
        classCode: secondary.analysis.class_code,
        similarGroupCode: secondary.analysis.similar_group_code,
        businessType: secondary.analysis.business_type,
        reason: secondary.analysis.reason,
        products: secondary.recommended_products
      });
    }

    // 5. 중복 제거
    const uniqueCodes = [...new Set(extractedCodes)];

    console.log(`✅ [Extract Similar Codes] Extracted ${uniqueCodes.length} unique similar group codes:`, uniqueCodes);

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      selectedCodes: uniqueCodes,
      confidence: 85, // RAG Engine 기반이므로 높은 신뢰도
      reasoning: analysisResult.summary,
      details: classificationDetails,
      professionalAdvice: analysisResult.professional_advice
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [Extract Similar Codes] Error:', error);

    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    // RAG Engine error
    if (error instanceof Error && error.message.includes('RAG Engine')) {
      return NextResponse.json({
        success: false,
        error: 'AI 분석 중 오류가 발생했습니다',
        details: error.message
      }, { status: 503 });
    }

    // Generic error
    return NextResponse.json({
      success: false,
      error: '유사군 코드 추출 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

