import { z } from 'zod';

/**
 * GCP 검색 테스트 응답 스키마
 */
export const GcpSearchTestResponseSchema = z.object({
  success: z.boolean().describe('테스트 성공 여부'),
  error: z.string().optional().describe('오류 메시지'),
  missingVariables: z.array(z.string()).optional().describe('누락된 환경 변수 목록'),
  message: z.string().optional().describe('상태 메시지'),
  setupGuide: z.string().optional().describe('설정 가이드 경로'),
  testResults: z.object({
    environmentCheck: z.object({
      passed: z.boolean().describe('환경 변수 체크 통과'),
      missingVars: z.array(z.string()).describe('누락된 변수들')
    }).optional(),
    connectionTest: z.object({
      passed: z.boolean().describe('연결 테스트 통과'),
      responseTime: z.number().describe('응답 시간 (ms)').optional(),
      error: z.string().optional().describe('연결 오류')
    }).optional(),
    searchTest: z.object({
      passed: z.boolean().describe('검색 테스트 통과'),
      query: z.string().describe('테스트 쿼리').optional(),
      resultCount: z.number().describe('결과 개수').optional()
    }).optional()
  }).optional().describe('상세 테스트 결과'),
  timestamp: z.string().describe('테스트 실행 시간')
});

/**
 * KIPRIS 검증 테스트 응답 스키마
 */
export const KiprisValidationTestResponseSchema = z.object({
  timestamp: z.string().describe('검증 실행 시간'),
  environment: z.object({
    kiprisApiKey: z.object({
      exists: z.boolean().describe('API 키 존재 여부'),
      length: z.number().describe('API 키 길이'),
      preview: z.string().describe('API 키 미리보기 (앞 10자)')
    }),
    kiprisBaseUrl: z.string().describe('KIPRIS 기본 URL')
  }).describe('환경 설정 상태'),
  connectivity: z.object({
    httpsTest: z.object({
      success: z.boolean().describe('HTTPS 연결 성공 여부'),
      status: z.number().describe('HTTP 상태 코드'),
      statusText: z.string().describe('상태 텍스트'),
      responseTime: z.number().describe('응답 시간 (ms)')
    }),
    httpTest: z.object({
      success: z.boolean().describe('HTTP 연결 성공 여부'),
      status: z.number().describe('HTTP 상태 코드'),
      statusText: z.string().describe('상태 텍스트'),
      responseTime: z.number().describe('응답 시간 (ms)')
    })
  }).describe('연결성 테스트 결과'),
  apiValidation: z.object({
    keyValidation: z.object({
      attempted: z.boolean().describe('키 검증 시도 여부'),
      success: z.boolean().describe('키 검증 성공 여부'),
      error: z.string().optional().describe('검증 오류 메시지')
    }),
    endpointTests: z.array(z.object({
      endpoint: z.string().describe('테스트 엔드포인트'),
      method: z.string().describe('HTTP 메소드'),
      success: z.boolean().describe('테스트 성공 여부'),
      responseTime: z.number().describe('응답 시간 (ms)').optional(),
      error: z.string().optional().describe('오류 메시지')
    }))
  }).describe('API 검증 결과'),
  summary: z.object({
    overallStatus: z.enum(['healthy', 'warning', 'error']).describe('전체 상태'),
    recommendations: z.array(z.string()).describe('권장사항'),
    nextSteps: z.array(z.string()).describe('다음 단계')
  }).describe('검증 요약')
});

/**
 * 워크플로우 디버그 테스트 응답 스키마
 */
export const WorkflowDebugTestResponseSchema = z.object({
  success: z.boolean().describe('디버그 실행 성공 여부'),
  workflowId: z.string().describe('워크플로우 ID').optional(),
  steps: z.array(z.object({
    stepName: z.string().describe('단계명'),
    status: z.enum(['pending', 'running', 'completed', 'failed']).describe('단계 상태'),
    startTime: z.string().describe('시작 시간').optional(),
    endTime: z.string().describe('종료 시간').optional(),
    duration: z.number().describe('실행 시간 (ms)').optional(),
    input: z.any().describe('입력 데이터').optional(),
    output: z.any().describe('출력 데이터').optional(),
    error: z.string().describe('오류 메시지').optional()
  })).describe('워크플로우 단계별 정보'),
  metadata: z.object({
    totalSteps: z.number().describe('총 단계 수'),
    completedSteps: z.number().describe('완료된 단계 수'),
    failedSteps: z.number().describe('실패한 단계 수'),
    totalDuration: z.number().describe('전체 실행 시간 (ms)').optional()
  }).describe('워크플로우 메타데이터'),
  timestamp: z.string().describe('디버그 실행 시간')
});

/**
 * PDF 분석 테스트 요청 스키마
 */
export const PdfAnalysisTestRequestSchema = z.object({
  pdfUrl: z.string().url('유효한 PDF URL을 입력해주세요.').describe('분석할 PDF 파일 URL'),
  analysisType: z.enum(['basic', 'advanced', 'ocr']).default('basic').describe('분석 유형')
});

/**
 * PDF 분석 테스트 응답 스키마
 */
export const PdfAnalysisTestResponseSchema = z.object({
  success: z.boolean().describe('분석 성공 여부'),
  analysisType: z.string().describe('사용된 분석 유형'),
  results: z.object({
    textExtraction: z.object({
      success: z.boolean().describe('텍스트 추출 성공 여부'),
      textLength: z.number().describe('추출된 텍스트 길이').optional(),
      pages: z.number().describe('페이지 수').optional(),
      error: z.string().optional().describe('추출 오류')
    }),
    structureAnalysis: z.object({
      success: z.boolean().describe('구조 분석 성공 여부'),
      sections: z.array(z.string()).describe('발견된 섹션들').optional(),
      tables: z.number().describe('테이블 개수').optional(),
      images: z.number().describe('이미지 개수').optional()
    }).optional(),
    contentAnalysis: z.object({
      success: z.boolean().describe('내용 분석 성공 여부'),
      keywords: z.array(z.string()).describe('핵심 키워드들').optional(),
      summary: z.string().describe('내용 요약').optional(),
      language: z.string().describe('감지된 언어').optional()
    }).optional()
  }).describe('분석 결과'),
  performance: z.object({
    processingTime: z.number().describe('처리 시간 (ms)'),
    memoryUsage: z.number().describe('메모리 사용량 (MB)').optional(),
    fileSize: z.number().describe('파일 크기 (bytes)').optional()
  }).describe('성능 지표'),
  error: z.string().optional().describe('오류 메시지'),
  timestamp: z.string().describe('분석 실행 시간')
});

/**
 * 목업 거절 분석 테스트 요청 스키마
 */
export const MockRejectionAnalysisRequestSchema = z.object({
  trademarkName: z.string().min(1, '상표명을 입력해주세요.').describe('분석할 상표명'),
  analysisDepth: z.enum(['basic', 'comprehensive']).default('basic').describe('분석 깊이')
});

/**
 * 목업 거절 분석 테스트 응답 스키마
 */
export const MockRejectionAnalysisResponseSchema = z.object({
  success: z.boolean().describe('분석 성공 여부'),
  trademarkName: z.string().describe('분석된 상표명'),
  mockAnalysis: z.object({
    similarTrademarks: z.array(z.object({
      name: z.string().describe('유사 상표명'),
      similarity: z.number().min(0).max(1).describe('유사도 (0-1)'),
      registrationNumber: z.string().describe('등록 번호'),
      status: z.string().describe('상표 상태')
    })).describe('유사 상표 목록'),
    riskAssessment: z.object({
      overallRisk: z.enum(['low', 'medium', 'high']).describe('전체 위험도'),
      conflictProbability: z.number().min(0).max(1).describe('충돌 확률'),
      recommendations: z.array(z.string()).describe('권장사항')
    }).describe('위험 평가'),
    legalConsiderations: z.array(z.object({
      category: z.string().describe('법적 고려사항 카테고리'),
      description: z.string().describe('상세 설명'),
      severity: z.enum(['info', 'warning', 'critical']).describe('심각도')
    })).describe('법적 고려사항')
  }).describe('목업 분석 결과'),
  processingTime: z.number().describe('처리 시간 (ms)'),
  timestamp: z.string().describe('분석 실행 시간'),
  error: z.string().optional().describe('오류 메시지')
});

/**
 * 공통 테스트 에러 응답 스키마
 */
export const TestErrorResponseSchema = z.object({
  success: z.literal(false).describe('테스트 실패'),
  error: z.string().describe('오류 메시지'),
  details: z.string().optional().describe('오류 상세 정보'),
  timestamp: z.string().describe('오류 발생 시간'),
  testType: z.string().describe('테스트 유형').optional()
});

// 타입 추출
export type GcpSearchTestResponse = z.infer<typeof GcpSearchTestResponseSchema>;
export type KiprisValidationTestResponse = z.infer<typeof KiprisValidationTestResponseSchema>;
export type WorkflowDebugTestResponse = z.infer<typeof WorkflowDebugTestResponseSchema>;
export type PdfAnalysisTestRequest = z.infer<typeof PdfAnalysisTestRequestSchema>;
export type PdfAnalysisTestResponse = z.infer<typeof PdfAnalysisTestResponseSchema>;
export type MockRejectionAnalysisRequest = z.infer<typeof MockRejectionAnalysisRequestSchema>;
export type MockRejectionAnalysisResponse = z.infer<typeof MockRejectionAnalysisResponseSchema>;
export type TestErrorResponse = z.infer<typeof TestErrorResponseSchema>;