import { z } from 'zod';

/**
 * 상품 검색 서비스 상태 응답 스키마 (GET)
 */
export const GoodsSearchStatusResponseSchema = z.object({
  success: z.boolean().describe('요청 성공 여부'),
  service: z.string().describe('서비스명'),
  status: z.enum(['available', 'unavailable']).describe('서비스 상태'),
  timestamp: z.string().describe('응답 시간 (ISO 8601)'),
  error: z.string().optional().describe('에러 메시지 (실패 시)')
});

/**
 * 상품 검색 요청 스키마 (POST)
 */
export const GoodsSearchRequestSchema = z.object({
  businessDescription: z.string()
    .min(1, '사업 설명(businessDescription)이 필요합니다.')
    .describe('사업 설명'),
  searchMode: z.enum(['all', 'specific'])
    .default('all')
    .describe('검색 모드 (all: 전체 검색, specific: 특정 검색)')
});

/**
 * 상품 검색 응답 스키마 (POST)
 */
export const GoodsSearchResponseSchema = z.object({
  success: z.literal(true).describe('요청 성공'),
  results: z.any().describe('분석 결과 데이터'),
  source: z.literal('goods-analysis-service').describe('데이터 소스')
});

/**
 * 상품 검색 에러 응답 스키마
 */
export const GoodsSearchErrorSchema = z.object({
  success: z.literal(false).describe('요청 실패'),
  error: z.string().describe('에러 메시지')
});

// 타입 추출
export type GoodsSearchStatusResponse = z.infer<typeof GoodsSearchStatusResponseSchema>;
export type GoodsSearchRequest = z.infer<typeof GoodsSearchRequestSchema>;
export type GoodsSearchResponse = z.infer<typeof GoodsSearchResponseSchema>;
export type GoodsSearchError = z.infer<typeof GoodsSearchErrorSchema>;