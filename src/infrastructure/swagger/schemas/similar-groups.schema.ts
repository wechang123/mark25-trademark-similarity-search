import { z } from 'zod';

/**
 * Similar Groups API Schemas
 * For NICE classification similar group code suggestions
 */

/**
 * GET Query Parameters Schema
 */
export const SimilarGroupsSuggestQuerySchema = z.object({
  trademark: z.string().optional().describe('상표명 (키워드 기반 추천용)'),
  nice: z.string().optional().describe('NICE 분류 코드 (예: "42", "09")'),
  limit: z.string().optional().default('8').describe('결과 개수 제한 (1-12, 기본값: 8)')
});

/**
 * Similar Group Item Schema
 */
export const SimilarGroupItemSchema = z.object({
  code: z.string().describe('유사군 코드'),
  description: z.string().describe('유사군 설명')
});

/**
 * Success Response Schema
 */
export const SimilarGroupsSuccessResponseSchema = z.object({
  success: z.literal(true),
  items: z.array(SimilarGroupItemSchema).describe('추천 유사군 목록')
});

/**
 * Error Response Schema
 */
export const SimilarGroupsErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('오류 메시지')
});

/**
 * Union Response Schema for all possible responses
 */
export const SimilarGroupsResponseSchema = z.union([
  SimilarGroupsSuccessResponseSchema,
  SimilarGroupsErrorResponseSchema
]);

// Type exports
export type SimilarGroupsSuggestQuery = z.infer<typeof SimilarGroupsSuggestQuerySchema>;
export type SimilarGroupItem = z.infer<typeof SimilarGroupItemSchema>;
export type SimilarGroupsSuccessResponse = z.infer<typeof SimilarGroupsSuccessResponseSchema>;
export type SimilarGroupsErrorResponse = z.infer<typeof SimilarGroupsErrorResponseSchema>;
export type SimilarGroupsResponse = z.infer<typeof SimilarGroupsResponseSchema>;