import { z } from 'zod';

/**
 * Extract Similar Codes API Schemas
 * For AI-powered similar group code extraction from business descriptions
 */

/**
 * POST Request Schema
 */
export const ExtractSimilarCodesRequestSchema = z.object({
  businessDescription: z.string().min(1, '사업 설명은 필수입니다.').describe('사업 설명'),
  userChoice: z.any().optional().describe('사용자 선택 정보 (선택사항)')
});

/**
 * Success Response Schema
 */
export const ExtractSimilarCodesSuccessResponseSchema = z.object({
  success: z.literal(true),
  selectedCodes: z.array(z.string()).describe('선택된 유사군 코드들'),
  confidence: z.number().min(0).max(100).describe('신뢰도 (%)'),
  reasoning: z.string().describe('선택 근거'),
  searchResultsCount: z.number().describe('검색 결과 수'),
  totalCandidates: z.number().describe('전체 후보 유사군 수')
});

/**
 * Error Response Schema
 */
export const ExtractSimilarCodesErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지'),
  details: z.string().optional().describe('오류 상세 정보')
});

/**
 * Union Response Schema for all possible responses
 */
export const ExtractSimilarCodesResponseSchema = z.union([
  ExtractSimilarCodesSuccessResponseSchema,
  ExtractSimilarCodesErrorResponseSchema
]);

// Type exports
export type ExtractSimilarCodesRequest = z.infer<typeof ExtractSimilarCodesRequestSchema>;
export type ExtractSimilarCodesSuccessResponse = z.infer<typeof ExtractSimilarCodesSuccessResponseSchema>;
export type ExtractSimilarCodesErrorResponse = z.infer<typeof ExtractSimilarCodesErrorResponseSchema>;
export type ExtractSimilarCodesResponse = z.infer<typeof ExtractSimilarCodesResponseSchema>;