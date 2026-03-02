import { z } from 'zod';

/**
 * 전문가 검색 요청 스키마 (이미 존재하는 스키마와 호환)
 */
export const ExpertSearchRequestSchema = z.object({
  trademark: z.string().min(1, '상표명은 필수입니다.').describe('상표명'),
  businessDescription: z.string().min(1, '사업 설명은 필수입니다.').describe('사업 설명'),
  userIntent: z.string().optional().describe('사용자 의도 (선택사항)'),
  urgencyLevel: z.string().optional().describe('긴급도 수준 (선택사항)'),
  budgetRange: z.string().optional().describe('예산 범위 (선택사항)'),
  trademarkImage: z.string().optional().describe('상표 이미지 URL (선택사항)')
});

/**
 * 전문가 분석 초기 응답 스키마 (POST)
 */
export const ExpertSearchInitialResponseSchema = z.object({
  success: z.boolean().describe('요청 성공 여부'),
  searchId: z.string().describe('검색 세션 ID'),
  status: z.literal('processing').describe('분석 상태'),
  message: z.string().describe('상태 메시지'),
  estimatedTime: z.string().describe('예상 소요 시간'),
  features: z.array(z.string()).describe('분석 기능 목록')
});

/**
 * AI 분석 결과 스키마
 */
export const AIAnalysisSchema = z.object({
  similarity_analysis: z.object({
    score: z.number().min(0).max(100).describe('유사도 점수'),
    details: z.string().describe('유사도 분석 상세'),
    risk_factors: z.array(z.string()).describe('위험 요소 목록')
  }).optional().describe('유사도 분석 결과'),
  
  legal_analysis: z.object({
    registrability: z.string().describe('등록 가능성'),
    legal_basis: z.string().describe('법적 근거'),
    recommendations: z.array(z.string()).describe('법적 권장사항')
  }).optional().describe('법적 분석 결과'),
  
  market_analysis: z.object({
    competition_level: z.string().describe('경쟁 수준'),
    market_position: z.string().describe('시장 포지션'),
    strategic_advice: z.array(z.string()).describe('전략적 조언')
  }).optional().describe('시장 분석 결과'),
  
  error: z.string().optional().describe('분석 오류 메시지')
});

/**
 * 분석 완료 응답 스키마 (GET)
 */
export const ExpertSearchResultResponseSchema = z.object({
  id: z.string().describe('검색 세션 ID'),
  status: z.enum(['processing', 'completed', 'failed']).describe('분석 상태'),
  progress: z.number().min(0).max(100).describe('진행률 (0-100)'),
  error: z.string().optional().describe('오류 메시지 (실패 시)'),
  ai_analysis: AIAnalysisSchema.describe('AI 분석 결과'),
  
  // PRD 호환 필드들
  trademark: z.string().optional().describe('분석된 상표명'),
  description: z.string().optional().describe('사업 설명'),
  analysis_type: z.string().optional().describe('분석 유형'),
  created_at: z.string().optional().describe('생성 시간'),
  updated_at: z.string().optional().describe('업데이트 시간'),
  
  // LangGraph 워크플로우 관련
  workflow_status: z.string().optional().describe('워크플로우 상태'),
  conversation_history: z.array(z.any()).optional().describe('대화 이력'),
  langgraph_state: z.any().optional().describe('LangGraph 상태')
});

/**
 * GET 요청 파라미터 스키마
 */
export const ExpertSearchStatusQuerySchema = z.object({
  searchId: z.string().min(1, 'searchId는 필수입니다.').describe('검색 세션 ID')
});

/**
 * 에러 응답 스키마
 */
export const ExpertSearchErrorSchema = z.object({
  success: z.literal(false).describe('요청 실패'),
  error: z.string().describe('에러 메시지'),
  status: z.literal('failed').describe('실패 상태')
});

/**
 * GET 에러 응답 스키마
 */
export const ExpertSearchNotFoundSchema = z.object({
  error: z.string().describe('에러 메시지')
});

// 타입 추출
export type ExpertSearchRequest = z.infer<typeof ExpertSearchRequestSchema>;
export type ExpertSearchInitialResponse = z.infer<typeof ExpertSearchInitialResponseSchema>;
export type ExpertSearchResultResponse = z.infer<typeof ExpertSearchResultResponseSchema>;
export type ExpertSearchStatusQuery = z.infer<typeof ExpertSearchStatusQuerySchema>;
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;
export type ExpertSearchError = z.infer<typeof ExpertSearchErrorSchema>;
export type ExpertSearchNotFound = z.infer<typeof ExpertSearchNotFoundSchema>;