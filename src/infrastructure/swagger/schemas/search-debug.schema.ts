import { z } from 'zod';

/**
 * Search Debug API Schemas
 * For comprehensive KIPRIS connection debugging and diagnostics
 */

/**
 * Debug Result Schema
 */
export const SearchDebugResultSchema = z.object({
  connectionTest: z.object({
    status: z.enum(['success', 'failed']).describe('연결 테스트 결과'),
    message: z.string().describe('연결 상태 메시지'),
    responseTime: z.number().optional().describe('응답 시간(ms)')
  }).describe('KIPRIS 연결 테스트'),
  
  apiStatus: z.object({
    available: z.boolean().describe('API 사용 가능 여부'),
    version: z.string().optional().describe('API 버전'),
    lastChecked: z.string().describe('마지막 확인 시간')
  }).describe('API 상태 정보'),
  
  configuration: z.object({
    baseUrl: z.string().describe('KIPRIS 기본 URL'),
    timeout: z.number().describe('타임아웃 설정(ms)'),
    retryCount: z.number().describe('재시도 횟수')
  }).describe('API 설정 정보'),
  
  diagnostics: z.array(z.object({
    test: z.string().describe('테스트 항목'),
    result: z.enum(['pass', 'fail', 'warning']).describe('테스트 결과'),
    message: z.string().describe('상세 메시지'),
    duration: z.number().optional().describe('실행 시간(ms)')
  })).describe('진단 테스트 결과'),
  
  timestamp: z.string().describe('디버그 실행 시간'),
  summary: z.object({
    totalTests: z.number().describe('총 테스트 수'),
    passed: z.number().describe('통과한 테스트 수'),
    failed: z.number().describe('실패한 테스트 수'),
    warnings: z.number().describe('경고 수')
  }).describe('테스트 요약')
});

/**
 * Success Response Schema
 */
export const SearchDebugSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: SearchDebugResultSchema.describe('디버그 실행 결과'),
  message: z.string().describe('성공 메시지')
});

/**
 * Error Response Schema
 */
export const SearchDebugErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지'),
  details: z.string().describe('오류 상세 정보'),
  timestamp: z.string().describe('오류 발생 시간')
});

/**
 * Union Response Schema
 */
export const SearchDebugResponseSchema = z.union([
  SearchDebugSuccessResponseSchema,
  SearchDebugErrorResponseSchema
]);

// Type exports
export type SearchDebugResult = z.infer<typeof SearchDebugResultSchema>;
export type SearchDebugSuccessResponse = z.infer<typeof SearchDebugSuccessResponseSchema>;
export type SearchDebugErrorResponse = z.infer<typeof SearchDebugErrorResponseSchema>;
export type SearchDebugResponse = z.infer<typeof SearchDebugResponseSchema>;