/**
 * Stage 2 상표 분석 API 엔드포인트
 * 
 * Stage 1 데이터를 받아서 LangGraph 워크플로우를 통한 종합 분석 수행
 * - KIPRIS 검색
 * - 유사군 코드 매칭  
 * - AI 기반 등록 가능성 분석
 * - 3가지 평가 기준 점수화
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/infrastructure/security/rate-limit';
import { createValidatedApiRoute } from '@/infrastructure/swagger/middleware/validation-middleware';
import { stage2AnalysisService, Stage2AnalysisInput } from '@/features/trademark-analysis/_services/stage2-analysis-service';
import { requireAuth } from '@/infrastructure/auth/middleware/role-guard';

// 요청 스키마 정의
const Stage2AnalysisRequestSchema = z.object({
  stage1Id: z.string().uuid('유효한 Stage 1 ID를 제공해야 합니다'),
  // 🎯 Stage 1에서 데이터를 자동으로 불러오므로 다른 필드들은 optional로 변경
  userId: z.string().optional(),
  trademarkName: z.string().optional(),
  trademarkType: z.enum(['text', 'image', 'combined']).optional(),
  businessDescription: z.string().optional(),
  trademarkImageUrl: z.string().url().optional(),
  // 분석 옵션
  skipKiprisSearch: z.boolean().default(false),
  analysisDepth: z.enum(['basic', 'comprehensive']).default('comprehensive')
});

// 응답 스키마 정의
const Stage2AnalysisResponseSchema = z.object({
  success: z.boolean(),
  stage2Id: z.string().optional(),
  analysisResult: z.object({
    trademarkName: z.string(),
    trademarkType: z.enum(['text', 'image', 'combined']),
    registrationProbability: z.number(),
    aiConfidence: z.number(),
    analysis: z.object({
      codeCompatibility: z.object({
        score: z.number(),
        description: z.string(),
        status: z.enum(['excellent', 'good', 'warning', 'danger']),
        icon: z.enum(['✓', '⚠', '✗', '?']),
        details: z.string().optional()
      }),
      distinctiveness: z.object({
        score: z.number(),
        description: z.string(),
        status: z.enum(['excellent', 'good', 'warning', 'danger']),
        icon: z.enum(['✓', '⚠', '✗', '?']),
        details: z.string().optional()
      }),
      priorSimilarity: z.object({
        score: z.number(),
        description: z.string(),
        status: z.enum(['excellent', 'good', 'warning', 'danger']),
        icon: z.enum(['✓', '⚠', '✗', '?']),
        details: z.string().optional()
      })
    }),
    analysisDate: z.string(),
    processingTime: z.number().optional()
  }).optional(),
  error: z.string().optional(),
  processingTimeMs: z.number().optional()
});

export type Stage2AnalysisRequest = z.infer<typeof Stage2AnalysisRequestSchema>;
export type Stage2AnalysisResponse = z.infer<typeof Stage2AnalysisResponseSchema>;

/**
 * Stage 2 분석 시작 API
 */
async function handleStage2Analysis(
  request: NextRequest,
  context: { validatedBody?: Stage2AnalysisRequest }
): Promise<NextResponse<Stage2AnalysisResponse>> {
  console.log('🚀 [Stage2 API] Starting Stage 2 analysis request');

  try {
    // Authentication check
    const authError = await requireAuth();
    if (authError) {
      console.error('❌ [Stage2 API] Authentication failed:', authError.status);
      return authError as NextResponse<Stage2AnalysisResponse>;
    }

    // Rate limiting 체크
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.'
        },
        {
          status: 429
        }
      );
    }

    // 🔧 검증된 데이터 사용 (request.json() 대신 validatedBody 사용)
    const validatedData = context.validatedBody!;
    console.log('📝 [Stage2 API] Request body:', {
      stage1Id: validatedData.stage1Id,
      trademarkName: validatedData.trademarkName,
      trademarkType: validatedData.trademarkType
    });

    // Stage 2 분석 입력 데이터 구성
    const analysisInput: Stage2AnalysisInput = {
      stage1Id: validatedData.stage1Id,
      userId: validatedData.userId,
      trademarkName: validatedData.trademarkName || '',
      trademarkType: validatedData.trademarkType || 'text',
      businessDescription: validatedData.businessDescription || '',
      trademarkImageUrl: validatedData.trademarkImageUrl,
      skipKiprisSearch: validatedData.skipKiprisSearch,
      analysisDepth: validatedData.analysisDepth
    };

    console.log('⚡ [Stage2 API] Starting analysis service...');
    
    // Stage 2 분석 서비스 실행
    const result = await stage2AnalysisService.startAnalysis(analysisInput);

    // 성공 응답
    if (result.success && result.analysisResult) {
      console.log('✅ [Stage2 API] Analysis completed successfully:', {
        stage2Id: result.stage2Id,
        probability: result.analysisResult.registrationProbability,
        processingTime: result.processingTimeMs
      });

      return NextResponse.json({
        success: true,
        stage2Id: result.stage2Id,
        analysisResult: result.analysisResult,
        processingTimeMs: result.processingTimeMs
      });
    }

    // 실패 응답
    console.error('❌ [Stage2 API] Analysis failed:', result.error);
    return NextResponse.json({
      success: false,
      error: result.error || 'Analysis failed',
      processingTimeMs: result.processingTimeMs
    }, { status: 500 });

  } catch (error) {
    console.error('❌ [Stage2 API] Unexpected error:', error);
    
    // 스키마 검증 오류
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }, { status: 400 });
    }

    // 기타 오류
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// POST 요청 처리
export const POST = createValidatedApiRoute({
  method: 'POST',
  summary: 'Stage 2 상표 분석 실행',
  description: 'LangGraph 워크플로우를 통해 종합적인 상표 등록 가능성 분석을 수행합니다. KIPRIS 검색, 유사군 코드 분석, AI 기반 평가를 포함합니다.',
  tags: ['Trademark Analysis', 'Stage 2'],
  body: Stage2AnalysisRequestSchema as any,
  path: '/api/analysis/trademark-analysis',
  response: Stage2AnalysisResponseSchema,
  errorResponses: {
    400: '잘못된 요청 데이터',
    429: '요청 한도 초과',
    500: '서버 오류'
  },
  requiresAuth: true
}, handleStage2Analysis);

// GET 요청 - API 정보 조회
export async function GET() {
  return NextResponse.json({
    message: 'Stage 2 Trademark Analysis API',
    version: '3.0.0',
    description: 'LangGraph 기반 종합 상표 분석 엔드포인트',
    endpoints: {
      POST: {
        description: '새로운 Stage 2 분석 시작',
        requiredFields: ['stage1Id', 'trademarkName', 'trademarkType', 'businessDescription']
      }
    },
    features: [
      'KIPRIS 다중 검색',
      'AI 기반 유사군 코드 매칭',
      'Gemini 2.5 Pro 종합 분석',
      '3가지 평가 기준 점수화',
      '실시간 진행률 추적'
    ]
  });
}