import { z } from 'zod';

/**
 * 경쟁사 분석 요청 스키마
 */
export const CompetitorAnalysisRequestSchema = z.object({
  competitorNames: z.array(z.string())
    .min(1, '경쟁업체명이 필요합니다.')
    .describe('경쟁업체명 목록'),
  productClassificationCodes: z.array(z.string())
    .min(1, '상품분류코드가 필요합니다.')
    .describe('상품 분류 코드 목록'),
  similarGroupCodes: z.array(z.string())
    .optional()
    .describe('유사군 코드 목록 (선택사항)')
});

/**
 * 경쟁사 분석 성공 응답 스키마
 */
export const CompetitorAnalysisResponseSchema = z.object({
  success: z.literal(true).describe('요청 성공'),
  data: z.any().describe('분석 결과 데이터')
});

/**
 * 경쟁사 분석 에러 응답 스키마
 */
export const CompetitorAnalysisErrorSchema = z.object({
  success: z.literal(false).describe('요청 실패'),
  error: z.string().describe('에러 메시지')
});

// 타입 추출
export type CompetitorAnalysisRequest = z.infer<typeof CompetitorAnalysisRequestSchema>;
export type CompetitorAnalysisResponse = z.infer<typeof CompetitorAnalysisResponseSchema>;
export type CompetitorAnalysisError = z.infer<typeof CompetitorAnalysisErrorSchema>;