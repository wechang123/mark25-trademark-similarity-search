/**
 * Stage 3 사용자 액션 처리 API
 * 
 * 분석 완료 후 사용자 액션 처리:
 * - 출원하기 (apply)
 * - 전문가 상담 (consult)
 * - 결과 저장 (save)
 * - 재분석 (retry)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/infrastructure/security/rate-limit';
import { createValidatedApiRoute } from '@/infrastructure/swagger/middleware/validation-middleware';
import { stage3ActionsService, Stage3ActionInput } from '@/features/trademark-analysis/_services/stage3-actions-service';

// 출원자 정보 스키마
const ApplicantInfoSchema = z.object({
  name: z.string().min(1, '출원자명을 입력해야 합니다'),
  address: z.string().min(10, '주소를 최소 10자 이상 입력해야 합니다'),
  phone: z.string().regex(/^[0-9-+().\s]+$/, '올바른 전화번호 형식이 아닙니다'),
  email: z.string().email('올바른 이메일 주소를 입력해야 합니다')
});

// 상담 선호사항 스키마
const ConsultationPreferencesSchema = z.object({
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  contactMethod: z.enum(['phone', 'email', 'video']).default('phone'),
  urgency: z.enum(['low', 'medium', 'high']).default('medium')
});

// 요청 스키마
const Stage3ActionRequestSchema = z.object({
  stage2Id: z.string().uuid('유효한 Stage 2 ID를 제공해야 합니다'),
  userId: z.string().optional(),
  action: z.enum(['apply', 'consult', 'save', 'retry'], {
    errorMap: () => ({ message: '유효하지 않은 액션입니다. apply, consult, save, retry 중 하나여야 합니다' })
  }),
  actionData: z.object({
    applicantInfo: ApplicantInfoSchema.optional(),
    consultationPreferences: ConsultationPreferencesSchema.optional()
  }).optional()
});

// 응답 스키마
const Stage3ActionResponseSchema = z.object({
  success: z.boolean(),
  stage3Id: z.string().optional(),
  actionResult: z.object({
    applicationId: z.string().optional(),
    consultationBookingId: z.string().optional(),
    pdfUrl: z.string().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    submittedAt: z.string().optional(),
    bookedAt: z.string().optional(),
    savedAt: z.string().optional(),
    estimatedProcessingTime: z.string().optional(),
    estimatedResponse: z.string().optional()
  }).optional(),
  error: z.string().optional()
});

export type Stage3ActionRequest = z.infer<typeof Stage3ActionRequestSchema>;
export type Stage3ActionResponse = z.infer<typeof Stage3ActionResponseSchema>;

/**
 * Stage 3 사용자 액션 처리 API
 */
async function handleStage3Action(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
): Promise<NextResponse<Stage3ActionResponse>> {
  console.log('🎯 [Stage3 API] Processing user action request');
  
  try {
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

    // 요청 본문 파싱
    const body = await request.json();
    console.log('📝 [Stage3 API] Request body:', {
      stage2Id: body.stage2Id,
      action: body.action,
      hasActionData: !!body.actionData
    });

    // 요청 데이터 검증
    const validatedData = Stage3ActionRequestSchema.parse(body);

    // Stage 3 액션 입력 데이터 구성
    const actionInput: Stage3ActionInput = {
      stage2Id: validatedData.stage2Id,
      userId: validatedData.userId,
      action: validatedData.action,
      actionData: validatedData.actionData ? {
        ...validatedData.actionData,
        consultationPreferences: validatedData.actionData.consultationPreferences ? {
          ...validatedData.actionData.consultationPreferences,
          preferredDate: validatedData.actionData.consultationPreferences.preferredDate || '',
          preferredTime: validatedData.actionData.consultationPreferences.preferredTime || ''
        } : undefined
      } : undefined
    };

    console.log('⚡ [Stage3 API] Starting action processing...');
    
    // Stage 3 액션 처리 서비스 실행
    const result = await stage3ActionsService.processAction(actionInput);

    // 성공 응답
    if (result.success) {
      console.log('✅ [Stage3 API] Action processed successfully:', {
        stage3Id: result.stage3Id,
        action: validatedData.action,
        hasActionResult: !!result.actionResult
      });

      return NextResponse.json({
        success: true,
        stage3Id: result.stage3Id,
        actionResult: result.actionResult
      });
    }

    // 실패 응답
    console.error('❌ [Stage3 API] Action processing failed:', result.error);
    return NextResponse.json({
      success: false,
      error: result.error || 'Action processing failed'
    }, { status: 500 });

  } catch (error) {
    console.error('❌ [Stage3 API] Unexpected error:', error);
    
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
export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
): Promise<NextResponse<Stage3ActionResponse>> {
  return handleStage3Action(request, context);
}

// GET 요청 - API 정보 조회
export async function GET() {
  return NextResponse.json({
    message: 'Stage 3 User Actions API',
    version: '1.0.0',
    description: '분석 완료 후 사용자 액션 처리 엔드포인트',
    supportedActions: {
      apply: {
        description: '출원 신청 처리',
        requiredData: ['applicantInfo']
      },
      consult: {
        description: '전문가 상담 예약',
        requiredData: ['consultationPreferences (optional)']
      },
      save: {
        description: '결과 저장',
        requiredData: []
      },
      retry: {
        description: '재분석 요청',
        requiredData: []
      }
    },
    endpoints: {
      POST: {
        description: '사용자 액션 처리',
        requiredFields: ['stage2Id', 'action']
      }
    }
  });
}