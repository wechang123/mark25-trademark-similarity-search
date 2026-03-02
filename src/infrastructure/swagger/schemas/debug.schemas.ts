import { z } from 'zod';

/**
 * KIPRIS 디버그 요청 스키마
 */
export const KiprisDebugRequestSchema = z.object({
  trademarkName: z.string()
    .min(1, '상표명을 입력해주세요.')
    .describe('디버깅할 상표명')
});

/**
 * KIPRIS 디버그 응답 스키마 (POST)
 */
export const KiprisDebugResponseSchema = z.object({
  success: z.boolean().describe('요청 성공 여부'),
  data: z.object({
    keywordGeneration: z.object({
      totalKeywords: z.number().describe('생성된 키워드 총 개수'),
      keywords: z.array(z.string()).describe('생성된 키워드 목록'),
      categories: z.array(z.string()).describe('키워드 카테고리')
    }).describe('키워드 생성 결과'),
    kiprisSearch: z.object({
      totalKeywords: z.number().describe('검색 대상 키워드 수'),
      searchedKeywords: z.number().describe('실제 검색된 키워드 수'),
      totalResults: z.number().describe('총 검색 결과 수'),
      averageResultsPerKeyword: z.number().describe('키워드당 평균 결과 수')
    }).describe('KIPRIS 검색 통계'),
    searchResults: z.array(z.any()).describe('검색 결과 상세')
  }).describe('디버그 분석 데이터'),
  timestamp: z.string().describe('응답 생성 시간')
});

/**
 * KIPRIS 디버그 GET 요청 파라미터 스키마
 */
export const KiprisDebugGetParamsSchema = z.object({
  trademark: z.string()
    .min(1, '상표명을 입력해주세요.')
    .describe('디버깅할 상표명')
});

/**
 * KIPRIS 디버그 GET 응답 스키마
 */
export const KiprisDebugGetResponseSchema = z.object({
  success: z.boolean().describe('요청 성공 여부'),
  trademark: z.string().describe('검색한 상표명'),
  keywords: z.array(z.string()).describe('생성된 키워드 목록'),
  timestamp: z.string().describe('응답 생성 시간')
});

/**
 * KIPRIS 연결 디버그 응답 스키마
 */
export const KiprisConnectionDebugResponseSchema = z.object({
  kiprisApiStatus: z.object({
    available: z.boolean().describe('KIPRIS API 사용 가능 여부'),
    connectionTime: z.number().optional().describe('연결 시간 (ms)'),
    error: z.string().optional().describe('연결 오류 메시지')
  }).describe('KIPRIS API 연결 상태'),
  mockDataStatus: z.object({
    available: z.boolean().describe('목업 데이터 사용 가능 여부'),
    recordCount: z.number().optional().describe('목업 데이터 레코드 수'),
    lastUpdated: z.string().optional().describe('마지막 업데이트 시간')
  }).describe('목업 데이터 상태'),
  systemCheck: z.object({
    timestamp: z.string().describe('검사 실행 시간'),
    recommendedAction: z.string().describe('권장 조치사항')
  }).describe('시스템 전체 상태'),
  testResults: z.array(z.object({
    testName: z.string().describe('테스트명'),
    status: z.enum(['success', 'warning', 'error']).describe('테스트 결과'),
    message: z.string().describe('테스트 메시지'),
    executionTime: z.number().optional().describe('실행 시간 (ms)')
  })).describe('상세 테스트 결과')
});

/**
 * 공통 에러 응답 스키마
 */
export const DebugErrorResponseSchema = z.object({
  success: z.literal(false).describe('요청 실패'),
  error: z.string().describe('오류 메시지'),
  details: z.string().optional().describe('오류 상세 정보'),
  timestamp: z.string().describe('오류 발생 시간')
});

// 타입 추출
export type KiprisDebugRequest = z.infer<typeof KiprisDebugRequestSchema>;
export type KiprisDebugResponse = z.infer<typeof KiprisDebugResponseSchema>;
export type KiprisDebugGetParams = z.infer<typeof KiprisDebugGetParamsSchema>;
export type KiprisDebugGetResponse = z.infer<typeof KiprisDebugGetResponseSchema>;
export type KiprisConnectionDebugResponse = z.infer<typeof KiprisConnectionDebugResponseSchema>;
export type DebugErrorResponse = z.infer<typeof DebugErrorResponseSchema>;