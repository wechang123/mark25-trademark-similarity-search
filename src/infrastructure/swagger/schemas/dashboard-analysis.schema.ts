import { z } from 'zod';

/**
 * Dashboard Analysis Session API Schemas
 * For detailed analysis session data retrieval
 */

/**
 * Path Parameters Schema
 */
export const DashboardAnalysisParamsSchema = z.object({
  sessionId: z.string().uuid('유효한 세션 ID가 필요합니다.').describe('분석 세션 ID')
});

/**
 * Trademark Info Schema
 */
export const TrademarkInfoSchema = z.object({
  name: z.string().describe('상표명'),
  type: z.string().describe('상표 유형'),
  imageUrl: z.string().nullable().optional().describe('상표 이미지 URL')
});

/**
 * Business Info Schema
 */
export const BusinessInfoSchema = z.object({
  description: z.string().describe('사업 설명'),
  productClassificationCodes: z.array(z.string()).describe('상품분류코드 목록'),
  similarGroupCodes: z.array(z.string()).describe('유사군코드 목록'),
  designatedProducts: z.array(z.string()).describe('지정상품 목록')
});

/**
 * Criteria Scores Schema (Enhanced Analysis)
 */
export const CriteriaScoresSchema = z.object({
  codeCompatibility: z.number().nullable().describe('코드 호환성 점수'),
  distinctiveness: z.number().nullable().describe('식별력 점수'),
  similarity: z.number().nullable().describe('유사도 점수')
});

/**
 * Detailed Analysis Schema
 */
export const DetailedAnalysisSchema = z.object({
  codeCompatibilityAnalysis: z.any().nullable().describe('코드 호환성 분석'),
  distinctivenessAnalysis: z.any().nullable().describe('식별력 분석'),
  similarityAnalysis: z.any().nullable().describe('유사도 분석')
});

/**
 * Analysis Result Schema
 */
export const AnalysisResultSchema = z.object({
  registrationProbability: z.number().min(0).max(100).describe('등록 확률 (%)'),
  aiConfidence: z.number().min(0).max(100).describe('AI 신뢰도 (%)'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('위험도'),
  keyFindings: z.array(z.string()).describe('주요 발견사항'),
  reportId: z.string().nullable().optional().describe('보고서 ID'),
  hasDetailedScores: z.boolean().describe('상세 점수 데이터 보유 여부'),
  criteriaScores: CriteriaScoresSchema.optional().describe('기준별 점수'),
  detailedAnalysis: DetailedAnalysisSchema.optional().describe('상세 분석 결과'),
  conflictingTrademarks: z.array(z.any()).describe('충돌 상표 목록'),
  classificationData: z.any().nullable().describe('분류 데이터'),
  similarityBreakdown: z.any().nullable().describe('유사도 세부사항'),
  analysisVersion: z.string().nullable().describe('분석 버전'),
  processingTimeMs: z.number().nullable().describe('처리 시간 (ms)')
});

/**
 * Application Data Schema
 */
export const ApplicationDataSchema = z.object({
  sessionId: z.string().describe('세션 ID'),
  trademark: TrademarkInfoSchema.describe('상표 정보'),
  business: BusinessInfoSchema.describe('사업 정보'),
  analysis: AnalysisResultSchema.describe('분석 결과')
});

/**
 * Success Response Schema
 */
export const DashboardAnalysisSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ApplicationDataSchema
});

/**
 * Error Response Schema
 */
export const DashboardAnalysisErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지')
});

/**
 * Union Response Schema for all possible responses
 */
export const DashboardAnalysisResponseSchema = z.union([
  DashboardAnalysisSuccessResponseSchema,
  DashboardAnalysisErrorResponseSchema
]);

// Type exports
export type DashboardAnalysisParams = z.infer<typeof DashboardAnalysisParamsSchema>;
export type TrademarkInfo = z.infer<typeof TrademarkInfoSchema>;
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;
export type CriteriaScores = z.infer<typeof CriteriaScoresSchema>;
export type DetailedAnalysis = z.infer<typeof DetailedAnalysisSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type ApplicationData = z.infer<typeof ApplicationDataSchema>;
export type DashboardAnalysisSuccessResponse = z.infer<typeof DashboardAnalysisSuccessResponseSchema>;
export type DashboardAnalysisErrorResponse = z.infer<typeof DashboardAnalysisErrorResponseSchema>;
export type DashboardAnalysisResponse = z.infer<typeof DashboardAnalysisResponseSchema>;