import { z } from 'zod';

/**
 * Search Cancel API Schemas
 * For canceling ongoing trademark search analyses
 */

/**
 * POST Request Schema
 */
export const SearchCancelRequestSchema = z.object({
  searchId: z.string().uuid('유효한 검색 ID가 필요합니다.').describe('취소할 검색 ID')
});

/**
 * Success Response Schema
 */
export const SearchCancelSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional().describe('성공 메시지'),
  cancelledSearchId: z.string().optional().describe('취소된 검색 ID')
});

/**
 * Error Response Schema
 */
export const SearchCancelErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지'),
  code: z.string().optional().describe('오류 코드'),
  details: z.string().optional().describe('오류 상세 정보')
});

/**
 * Union Response Schema
 */
export const SearchCancelResponseSchema = z.union([
  SearchCancelSuccessResponseSchema,
  SearchCancelErrorResponseSchema
]);

// Type exports
export type SearchCancelRequest = z.infer<typeof SearchCancelRequestSchema>;
export type SearchCancelSuccessResponse = z.infer<typeof SearchCancelSuccessResponseSchema>;
export type SearchCancelErrorResponse = z.infer<typeof SearchCancelErrorResponseSchema>;
export type SearchCancelResponse = z.infer<typeof SearchCancelResponseSchema>;