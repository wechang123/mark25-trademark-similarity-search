import { z } from 'zod';

/**
 * Pre-booking API Schemas
 * For service launch notification pre-booking system
 */

/**
 * Pre-booking Request Schema
 */
export const PreBookingRequestSchema = z.object({
  source: z.string().min(1, '출처는 필수입니다.').describe('신청 출처 (예: homepage, blog, ads)'),
  email: z.string()
    .email('올바른 이메일 형식을 입력해주세요.')
    .min(1, '이메일은 필수입니다.')
    .describe('사용자 이메일 주소')
});

/**
 * Pre-booking Success Response Schema
 */
export const PreBookingSuccessResponseSchema = z.object({
  success: z.literal(true),
  booking: z.object({
    id: z.string().describe('예약 ID'),
    created_at: z.string().describe('생성 시간')
  }).describe('예약 정보'),
  email_sent: z.boolean().describe('이메일 발송 성공 여부'),
  email_error: z.string().nullable().optional().describe('이메일 발송 오류 메시지')
});

/**
 * Pre-booking Conflict Response Schema (Duplicate Email)
 */
export const PreBookingConflictResponseSchema = z.object({
  success: z.literal(false),
  existing: z.literal(true),
  error: z.string().describe('오류 메시지'),
  message: z.string().describe('사용자 메시지')
});

/**
 * Pre-booking Service Unavailable Response Schema
 */
export const PreBookingServiceUnavailableResponseSchema = z.object({
  error: z.string().describe('오류 메시지'),
  setup_required: z.literal(true),
  message: z.string().describe('서비스 준비 메시지')
});

/**
 * Pre-booking Error Response Schema
 */
export const PreBookingErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지'),
  setup_required: z.boolean().optional().describe('서비스 설정 필요 여부'),
  details: z.string().optional().describe('오류 상세 정보'),
  debug_info: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
    hint: z.string().optional()
  }).optional().describe('개발 환경 디버그 정보')
});

/**
 * Union Response Schema for all possible responses
 */
export const PreBookingResponseSchema = z.union([
  PreBookingSuccessResponseSchema,
  PreBookingConflictResponseSchema,
  PreBookingServiceUnavailableResponseSchema,
  PreBookingErrorResponseSchema
]);

// Type exports
export type PreBookingRequest = z.infer<typeof PreBookingRequestSchema>;
export type PreBookingSuccessResponse = z.infer<typeof PreBookingSuccessResponseSchema>;
export type PreBookingConflictResponse = z.infer<typeof PreBookingConflictResponseSchema>;
export type PreBookingServiceUnavailableResponse = z.infer<typeof PreBookingServiceUnavailableResponseSchema>;
export type PreBookingErrorResponse = z.infer<typeof PreBookingErrorResponseSchema>;
export type PreBookingResponse = z.infer<typeof PreBookingResponseSchema>;