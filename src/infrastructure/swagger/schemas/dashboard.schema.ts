import { z } from 'zod';

/**
 * Dashboard API Request Schema (GET Query Parameters)
 */
export const DashboardQuerySchema = z.object({
  page: z.string()
    .optional()
    .default('1')
    .describe('페이지 번호'),
  limit: z.string()
    .optional()
    .default('10')
    .describe('페이지당 결과 수')
});

/**
 * Analysis Session Schema for Dashboard
 */
export const AnalysisSessionSchema = z.object({
  id: z.string().describe('분석 세션 ID'),
  trademark_name: z.string().nullable().describe('상표명'),
  trademark_type: z.string().nullable().describe('상표 유형'),
  business_description: z.string().nullable().describe('사업 설명'),
  product_classification_codes: z.array(z.string()).nullable().describe('상품 분류 코드'),
  similar_group_codes: z.array(z.string()).nullable().describe('유사군 코드'),
  designated_products: z.string().nullable().describe('지정 상품'),
  status: z.string().describe('분석 상태'),
  progress: z.number().describe('진행률'),
  created_at: z.string().describe('생성 시간'),
  completed_at: z.string().nullable().describe('완료 시간'),
  final_results: z.object({
    id: z.string(),
    registration_probability: z.number().nullable().describe('등록 확률'),
    risk_level: z.string().nullable().describe('위험 수준'),
    key_findings: z.array(z.string()).nullable().describe('주요 발견사항'),
    report_id: z.string().nullable().describe('보고서 ID')
  }).nullable().describe('최종 분석 결과')
});

/**
 * Dashboard Statistics Schema
 */
export const DashboardStatsSchema = z.object({
  total: z.number().describe('전체 분석 세션 수'),
  completed: z.number().describe('완료된 분석 세션 수'),
  inProgress: z.number().describe('진행 중인 분석 세션 수'),
  thisMonth: z.number().describe('이번 달 분석 세션 수')
});

/**
 * Application Schema for Dashboard
 */
export const DashboardApplicationSchema = z.object({
  id: z.string().describe('출원 ID'),
  status: z.string().describe('출원 상태'),
  created_at: z.string().describe('생성 시간'),
  trademark_type: z.string().nullable().describe('상표 유형'),
  analysis_session_id: z.string().nullable().describe('분석 세션 ID')
});

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z.number().describe('현재 페이지'),
  limit: z.number().describe('페이지당 결과 수'),
  total: z.number().describe('전체 결과 수'),
  totalPages: z.number().describe('전체 페이지 수')
});

/**
 * Dashboard Response Schema
 */
export const DashboardResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessions: z.array(AnalysisSessionSchema).describe('완료된 분석 세션 목록'),
    stats: DashboardStatsSchema.describe('대시보드 통계'),
    applications: z.array(DashboardApplicationSchema).describe('최근 출원 목록'),
    pagination: PaginationSchema.describe('페이지네이션 정보')
  })
});

/**
 * Dashboard Error Response Schema
 */
export const DashboardErrorSchema = z.object({
  error: z.string().describe('에러 메시지')
});

// Type exports
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type AnalysisSession = z.infer<typeof AnalysisSessionSchema>;
export type DashboardApplication = z.infer<typeof DashboardApplicationSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;