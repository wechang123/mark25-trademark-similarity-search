import { z } from 'zod';

/**
 * 상표 검색 요청 스키마
 */
export const TrademarkSearchRequestSchema = z.object({
  searchTerm: z.string()
    .min(1, '검색어를 입력해주세요.')
    .max(100, '검색어는 100자를 초과할 수 없습니다.')
    .describe('검색할 상표명'),
  industry: z.string()
    .optional()
    .describe('산업 분야 (선택사항)')
});

/**
 * 상표 결과 스키마
 */
export const TrademarkResultSchema = z.object({
  applicationNumber: z.string().optional().describe('출원번호'),
  registrationNumber: z.string().optional().describe('등록번호'),
  trademarkName: z.string().describe('상표명'),
  applicant: z.string().describe('출원인'),
  applicationDate: z.string().optional().describe('출원일자'),
  registrationDate: z.string().optional().describe('등록일자'),
  status: z.string().describe('상태'),
  description: z.string().optional().describe('상품분류'),
  similarity: z.number()
    .min(0)
    .max(100)
    .describe('유사도 (0-100)'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe('위험도 수준')
});

/**
 * 위험도 분석 스키마
 */
export const RiskAnalysisSchema = z.object({
  overallRisk: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe('전체 위험도'),
  highRiskCount: z.number()
    .min(0)
    .describe('고위험 상표 수'),
  mediumRiskCount: z.number()
    .min(0)
    .describe('중간위험 상표 수'),
  lowRiskCount: z.number()
    .min(0)
    .describe('저위험 상표 수'),
  recommendations: z.array(z.string())
    .describe('권장사항 목록')
});

/**
 * 상표 검색 응답 스키마
 */
export const TrademarkSearchResponseSchema = z.object({
  searchTerm: z.string().describe('검색어'),
  totalCount: z.number()
    .min(0)
    .describe('총 검색 결과 수'),
  results: z.array(TrademarkResultSchema)
    .describe('검색 결과 목록'),
  timestamp: z.string().describe('검색 시간 (ISO 8601)'),
  source: z.string().describe('데이터 소스 (KIPRIS, MOCK)'),
  riskAnalysis: RiskAnalysisSchema
    .describe('위험도 분석 결과')
});

/**
 * 에러 응답 스키마
 */
export const TrademarkSearchErrorSchema = z.object({
  error: z.string().describe('에러 메시지')
});

// 타입 추출
export type TrademarkSearchRequest = z.infer<typeof TrademarkSearchRequestSchema>;
export type TrademarkResult = z.infer<typeof TrademarkResultSchema>;
export type RiskAnalysis = z.infer<typeof RiskAnalysisSchema>;
export type TrademarkSearchResponse = z.infer<typeof TrademarkSearchResponseSchema>;
export type TrademarkSearchError = z.infer<typeof TrademarkSearchErrorSchema>;