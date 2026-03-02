import { z } from 'zod';

/**
 * 거절 분석 요청 스키마
 */
export const RejectionAnalysisRequestSchema = z.object({
  trademark: z.string()
    .min(1, '상표명은 필수입니다.')
    .max(100, '상표명은 100자를 초과할 수 없습니다.')
    .describe('분석할 상표명'),
  businessDescription: z.string()
    .optional()
    .describe('사업 설명 (선택사항)'),
  productClassificationCodes: z.array(z.string())
    .default([])
    .describe('상품 분류 코드 목록 (선택사항)')
});

/**
 * 검색 요약 스키마
 */
export const SearchSummarySchema = z.object({
  totalTrademarks: z.number()
    .min(0)
    .describe('전체 검색된 상표 수'),
  rejectedTrademarks: z.number()
    .min(0)
    .describe('거절된 상표 수'),
  rejectionRate: z.string()
    .describe('거절률 (백분율 문자열)'),
  averageSimilarityScore: z.string()
    .describe('평균 유사도 점수')
});

/**
 * 거절 위험도 스키마
 */
export const RejectionRiskSchema = z.object({
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe('위험도 수준'),
  riskScore: z.number()
    .min(0)
    .max(100)
    .describe('위험도 점수 (0-100)'),
  riskFactors: z.array(z.string())
    .describe('위험 요소 목록')
});

/**
 * 거절 사유 상세 스키마
 */
export const RejectionReasonDetailSchema = z.object({
  trademarkName: z.string().describe('상표명'),
  applicationNumber: z.string().optional().describe('출원번호'),
  rejectionReason: z.string().optional().describe('거절 사유'),
  rejectionReasonSummary: z.string().optional().describe('거절 사유 요약'),
  legalGround: z.string().optional().describe('법적 근거'),
  similarityScore: z.number().optional().describe('유사도 점수'),
  applicationStatus: z.string().optional().describe('출원 상태')
});

/**
 * 대응 전략 스키마
 */
export const ResponseStrategySchema = z.object({
  id: z.string().describe('전략 ID'),
  title: z.string().describe('전략 제목'),
  description: z.string().describe('전략 설명'),
  successRate: z.number()
    .min(0)
    .max(100)
    .describe('성공률 (0-100)'),
  difficulty: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe('난이도'),
  estimatedTime: z.string().describe('예상 소요 시간'),
  keyPoints: z.array(z.string()).describe('핵심 포인트 목록')
});

/**
 * 거절 분석 응답 스키마
 */
export const RejectionAnalysisResponseSchema = z.object({
  trademark: z.string().describe('분석된 상표명'),
  businessDescription: z.string()
    .optional()
    .describe('사업 설명'),
  analysisTimestamp: z.string().describe('분석 시간 (ISO 8601)'),
  
  // 검색 결과 요약
  searchSummary: SearchSummarySchema.describe('검색 결과 요약'),
  
  // 거절 위험도 분석
  rejectionRisk: RejectionRiskSchema.describe('거절 위험도 분석'),
  
  // 거절 사유 상세 (상위 5개)
  rejectionReasons: z.array(RejectionReasonDetailSchema)
    .describe('거절 사유 상세 목록'),
  
  // 대응 전략
  responseStrategies: z.array(ResponseStrategySchema)
    .describe('대응 전략 목록'),
  
  // 권장사항
  recommendations: z.array(z.string())
    .describe('권장사항 목록')
});

/**
 * 거절 분석 에러 응답 스키마
 */
export const RejectionAnalysisErrorSchema = z.object({
  error: z.string().describe('에러 메시지'),
  details: z.string().optional().describe('상세 에러 정보')
});

// 타입 추출
export type RejectionAnalysisRequest = z.infer<typeof RejectionAnalysisRequestSchema>;
export type SearchSummary = z.infer<typeof SearchSummarySchema>;
export type RejectionRisk = z.infer<typeof RejectionRiskSchema>;
export type RejectionReasonDetail = z.infer<typeof RejectionReasonDetailSchema>;
export type ResponseStrategy = z.infer<typeof ResponseStrategySchema>;
export type RejectionAnalysisResponse = z.infer<typeof RejectionAnalysisResponseSchema>;
export type RejectionAnalysisError = z.infer<typeof RejectionAnalysisErrorSchema>;