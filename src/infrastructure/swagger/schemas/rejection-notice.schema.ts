import { z } from 'zod';

/**
 * Rejection Notice API Schemas
 * For trademark rejection notice analysis and response strategies
 */

/**
 * POST Request Schema
 */
export const RejectionNoticePostRequestSchema = z.object({
  applicationNumber: z.string().min(1, '출원번호는 필수입니다.').describe('상표 출원번호')
});

/**
 * GET Query Parameters Schema
 */
export const RejectionNoticeGetQuerySchema = z.object({
  applicationNumber: z.string().min(1, '출원번호는 필수입니다.').describe('상표 출원번호')
});

/**
 * Estimated Cost Schema
 */
export const EstimatedCostSchema = z.object({
  min: z.number().describe('최소 예상 비용'),
  max: z.number().describe('최대 예상 비용'),
  currency: z.string().describe('통화 (KRW)')
});

/**
 * Timeline Schema
 */
export const TimelineSchema = z.object({
  responseDeadline: z.string().describe('응답 기한'),
  recommendedSubmissionDate: z.string().describe('권장 제출일'),
  estimatedProcessingTime: z.string().describe('예상 처리 시간')
});

/**
 * Response Strategy Schema
 */
export const ResponseStrategySchema = z.object({
  strategy: z.string().describe('대응 전략'),
  legalBasis: z.string().describe('법적 근거'),
  argumentPoints: z.array(z.string()).describe('논증 포인트들'),
  evidenceRequests: z.array(z.string()).describe('필요 증거 목록'),
  successRate: z.number().min(0).max(100).describe('성공 확률 (%)'),
  estimatedTime: z.string().describe('예상 소요 시간'),
  difficulty: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('난이도')
});

/**
 * Rejection Notice Data Schema
 */
export const RejectionNoticeDataSchema = z.object({
  applicationNumber: z.string().describe('출원번호'),
  rejectionReason: z.string().describe('거절 사유'),
  rejectionReasonSummary: z.string().describe('거절 사유 요약'),
  legalGround: z.string().describe('법적 근거'),
  rejectionDate: z.string().describe('거절 결정일'),
  decisionNumber: z.string().describe('결정번호'),
  docName: z.string().describe('문서명'),
  overallDifficulty: z.enum(['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']).describe('전체 난이도'),
  successProbability: z.number().min(0).max(100).describe('성공 확률 (%)'),
  estimatedCost: EstimatedCostSchema.describe('예상 비용'),
  timeline: TimelineSchema.describe('일정'),
  responseStrategies: z.array(ResponseStrategySchema).describe('대응 전략들')
});

/**
 * Success Response Schema
 */
export const RejectionNoticeSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: RejectionNoticeDataSchema,
  rejectionNotice: RejectionNoticeDataSchema
});

/**
 * Fallback Response Schema (API에서 데이터를 가져오지 못한 경우)
 */
export const RejectionNoticeFallbackResponseSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  rejectionNotice: RejectionNoticeDataSchema
});

/**
 * Error Response Schema
 */
export const RejectionNoticeErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('오류 메시지')
});

/**
 * Union Response Schema for all possible responses
 */
export const RejectionNoticeResponseSchema = z.union([
  RejectionNoticeSuccessResponseSchema,
  RejectionNoticeFallbackResponseSchema,
  RejectionNoticeErrorResponseSchema
]);

// Type exports
export type RejectionNoticePostRequest = z.infer<typeof RejectionNoticePostRequestSchema>;
export type RejectionNoticeGetQuery = z.infer<typeof RejectionNoticeGetQuerySchema>;
export type EstimatedCost = z.infer<typeof EstimatedCostSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type ResponseStrategy = z.infer<typeof ResponseStrategySchema>;
export type RejectionNoticeData = z.infer<typeof RejectionNoticeDataSchema>;
export type RejectionNoticeSuccessResponse = z.infer<typeof RejectionNoticeSuccessResponseSchema>;
export type RejectionNoticeFallbackResponse = z.infer<typeof RejectionNoticeFallbackResponseSchema>;
export type RejectionNoticeErrorResponse = z.infer<typeof RejectionNoticeErrorResponseSchema>;
export type RejectionNoticeResponse = z.infer<typeof RejectionNoticeResponseSchema>;