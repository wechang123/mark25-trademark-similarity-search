import { z } from 'zod';

/**
 * Debug KIPRIS Results API Schemas
 * For testing and debugging KIPRIS API connections and responses
 */

/**
 * POST Request Schema
 */
export const DebugKiprisRequestSchema = z.object({
  trademarkName: z.string().min(1, '상표명은 필수입니다.').describe('테스트할 상표명')
});

/**
 * GET Query Parameters Schema
 */
export const DebugKiprisQuerySchema = z.object({
  trademark: z.string().min(1, '상표명은 필수입니다.').describe('테스트할 상표명')
});

/**
 * Debug Analysis Result Schema
 */
export const DebugAnalysisSchema = z.object({
  keywordGeneration: z.object({
    totalKeywords: z.number().describe('생성된 키워드 총 개수'),
    keywords: z.array(z.string()).describe('생성된 키워드 목록'),
    categories: z.array(z.string()).describe('키워드 카테고리')
  }).describe('키워드 생성 결과'),
  kiprisSearch: z.object({
    totalKeywords: z.number().describe('검색할 키워드 총 개수'),
    searchedKeywords: z.number().describe('검색 완료된 키워드 개수'),
    totalResults: z.number().describe('총 검색 결과 개수'),
    averageResultsPerKeyword: z.number().describe('키워드당 평균 결과 수')
  }).describe('KIPRIS 검색 통계'),
  searchResults: z.array(z.any()).describe('검색 결과 목록')
});

/**
 * POST Success Response Schema
 */
export const DebugKiprisPostSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: DebugAnalysisSchema.describe('디버그 분석 결과'),
  timestamp: z.string().describe('응답 시간')
});

/**
 * GET Success Response Schema
 */
export const DebugKiprisGetSuccessResponseSchema = z.object({
  success: z.literal(true),
  trademark: z.string().describe('테스트한 상표명'),
  keywords: z.array(z.string()).describe('생성된 키워드 목록'),
  timestamp: z.string().describe('응답 시간')
});

/**
 * Error Response Schema
 */
export const DebugKiprisErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('오류 메시지'),
  timestamp: z.string().describe('응답 시간')
});

/**
 * POST Union Response Schema
 */
export const DebugKiprisPostResponseSchema = z.union([
  DebugKiprisPostSuccessResponseSchema,
  DebugKiprisErrorResponseSchema
]);

/**
 * GET Union Response Schema
 */
export const DebugKiprisGetResponseSchema = z.union([
  DebugKiprisGetSuccessResponseSchema,
  DebugKiprisErrorResponseSchema
]);

// Type exports
export type DebugKiprisRequest = z.infer<typeof DebugKiprisRequestSchema>;
export type DebugKiprisQuery = z.infer<typeof DebugKiprisQuerySchema>;
export type DebugAnalysis = z.infer<typeof DebugAnalysisSchema>;
export type DebugKiprisPostSuccessResponse = z.infer<typeof DebugKiprisPostSuccessResponseSchema>;
export type DebugKiprisGetSuccessResponse = z.infer<typeof DebugKiprisGetSuccessResponseSchema>;
export type DebugKiprisErrorResponse = z.infer<typeof DebugKiprisErrorResponseSchema>;
export type DebugKiprisPostResponse = z.infer<typeof DebugKiprisPostResponseSchema>;
export type DebugKiprisGetResponse = z.infer<typeof DebugKiprisGetResponseSchema>;