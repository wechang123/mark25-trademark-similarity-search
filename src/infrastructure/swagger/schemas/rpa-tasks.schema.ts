import { z } from 'zod';

/**
 * RPA Tasks API Schemas
 * For retrieving pending RPA tasks and signed URLs
 */

/**
 * RPA Task Schema
 */
export const RpaTaskSchema = z.object({
  id: z.string().describe('작업 ID'),
  type: z.enum(['image_analysis', 'document_processing', 'data_extraction']).describe('작업 유형'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).describe('작업 상태'),
  priority: z.number().min(1).max(10).describe('우선순위 (1-10)'),
  createdAt: z.string().describe('생성 시간'),
  fileUrl: z.string().optional().describe('파일 URL'),
  signedUrl: z.string().optional().describe('임시 접근 URL'),
  metadata: z.record(z.any()).optional().describe('추가 메타데이터'),
  processingTime: z.number().optional().describe('예상 처리 시간 (초)')
});

/**
 * Success Response Schema
 */
export const RpaTasksSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    tasks: z.array(RpaTaskSchema).describe('대기 중인 RPA 작업 목록'),
    totalCount: z.number().describe('전체 작업 수'),
    pendingCount: z.number().describe('대기 중인 작업 수'),
    lastUpdated: z.string().describe('마지막 업데이트 시간')
  })
});

/**
 * Error Response Schema
 */
export const RpaTasksErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('오류 메시지'),
  code: z.string().optional().describe('오류 코드')
});

/**
 * Union Response Schema
 */
export const RpaTasksResponseSchema = z.union([
  RpaTasksSuccessResponseSchema,
  RpaTasksErrorResponseSchema
]);

// Type exports
export type RpaTask = z.infer<typeof RpaTaskSchema>;
export type RpaTasksSuccessResponse = z.infer<typeof RpaTasksSuccessResponseSchema>;
export type RpaTasksErrorResponse = z.infer<typeof RpaTasksErrorResponseSchema>;
export type RpaTasksResponse = z.infer<typeof RpaTasksResponseSchema>;