import { z } from 'zod';

/**
 * System API Schemas
 * For system monitoring, statistics, and debug endpoints
 */

/**
 * API Stats Response Schema
 */
export const ApiStatsSchema = z.object({
  totalPaths: z.number().describe('총 API 경로 수'),
  totalOperations: z.number().describe('총 오퍼레이션 수'),
  operationsByMethod: z.record(z.string(), z.number()).describe('HTTP 메소드별 오퍼레이션 수'),
  operationsByTag: z.record(z.string(), z.number()).describe('태그별 오퍼레이션 수'),
  metadata: z.object({
    generatedAt: z.string().describe('통계 생성 시간'),
    environment: z.string().describe('환경 (development/production)'),
    version: z.string().describe('API 버전'),
    description: z.string().describe('설명')
  }).describe('메타데이터')
});

export const ApiStatsResponseSchema = z.object({
  success: z.literal(true),
  data: ApiStatsSchema
});

/**
 * Debug Sessions Schema
 */
export const DebugSessionSchema = z.object({
  id: z.string().describe('세션 ID'),
  trademark_name: z.string().nullable().describe('상표명'),
  business_description: z.string().nullable().describe('사업 설명'),
  created_at: z.string().describe('생성 시간'),
  status: z.string().describe('세션 상태')
});

export const DebugWorkflowSchema = z.object({
  id: z.string().describe('세션 ID'),
  status: z.string().describe('세션 상태'),
  progress: z.number().nullable().describe('진행률'),
  created_at: z.string().describe('생성 시간')
});

export const DebugSessionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessions: z.array(DebugSessionSchema).describe('최근 세션 목록'),
    workflows: z.array(DebugWorkflowSchema).describe('최근 워크플로우 목록'),
    sessionCount: z.number().describe('세션 수'),
    workflowCount: z.number().describe('워크플로우 수')
  })
});

/**
 * Common Error Response Schema
 */
export const SystemErrorSchema = z.object({
  error: z.string().describe('에러 메시지'),
  message: z.string().optional().describe('상세 메시지')
});

// Type exports
export type ApiStats = z.infer<typeof ApiStatsSchema>;
export type ApiStatsResponse = z.infer<typeof ApiStatsResponseSchema>;
export type DebugSession = z.infer<typeof DebugSessionSchema>;
export type DebugWorkflow = z.infer<typeof DebugWorkflowSchema>;
export type DebugSessionsResponse = z.infer<typeof DebugSessionsResponseSchema>;
export type SystemError = z.infer<typeof SystemErrorSchema>;