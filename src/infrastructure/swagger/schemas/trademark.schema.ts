/**
 * Trademark API Schemas
 * 
 * Zod schemas for trademark search, analysis, and related APIs
 */

import { z } from 'zod';

/**
 * Trademark Search Schemas
 */
export const TrademarkSearchRequestSchema = z.object({
  query: z.string()
    .min(1, '검색어를 입력해주세요.')
    .max(100, '검색어는 100자 이하로 입력해주세요.'),
  searchType: z.enum(['similar', 'exact', 'contains'])
    .default('similar')
    .describe('검색 유형: 유사 검색, 정확한 검색, 포함 검색'),
  classificationCodes: z.array(z.string())
    .optional()
    .describe('NICE 분류 코드 (선택사항)'),
  page: z.number()
    .min(1)
    .max(100)
    .default(1)
    .describe('페이지 번호'),
  limit: z.number()
    .min(1)
    .max(50)
    .default(10)
    .describe('페이지당 결과 수'),
  filters: z.object({
    status: z.array(z.enum(['registered', 'pending', 'rejected', 'expired']))
      .optional()
      .describe('상표 상태 필터'),
    applicationDateFrom: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD')
      .optional(),
    applicationDateTo: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD')
      .optional(),
    applicantType: z.enum(['individual', 'corporate'])
      .optional()
      .describe('출원인 유형')
  }).optional()
});

export const TrademarkSearchResultSchema = z.object({
  applicationNumber: z.string().describe('출원번호'),
  trademarkName: z.string().describe('상표명'),
  applicant: z.string().describe('출원인'),
  applicationDate: z.string().describe('출원일'),
  registrationNumber: z.string().optional().describe('등록번호'),
  registrationDate: z.string().optional().describe('등록일'),
  status: z.enum(['registered', 'pending', 'rejected', 'expired']).describe('상표 상태'),
  classificationCodes: z.array(z.string()).describe('분류 코드'),
  goods: z.string().describe('지정상품/서비스업'),
  similarityScore: z.number().min(0).max(1).optional().describe('유사도 점수'),
  images: z.array(z.string().url()).optional().describe('상표 이미지 URL')
});

export const TrademarkSearchResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    results: z.array(TrademarkSearchResultSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number()
    }),
    searchInfo: z.object({
      query: z.string(),
      searchType: z.string(),
      executionTime: z.number().describe('실행 시간 (ms)')
    })
  })
});

/**
 * Trademark Analysis Schemas
 */
export const TrademarkAnalysisRequestSchema = z.object({
  trademarkName: z.string()
    .min(1, '상표명을 입력해주세요.')
    .max(50, '상표명은 50자 이하로 입력해주세요.'),
  businessDescription: z.string()
    .min(10, '사업 설명을 10자 이상 입력해주세요.')
    .max(1000, '사업 설명은 1000자 이하로 입력해주세요.'),
  targetClassifications: z.array(z.string())
    .min(1, '최소 1개의 분류를 선택해주세요.')
    .max(10, '최대 10개의 분류까지 선택할 수 있습니다.'),
  analysisType: z.enum(['basic', 'comprehensive', 'expert'])
    .default('basic')
    .describe('분석 유형'),
  includeImages: z.boolean()
    .default(false)
    .describe('이미지 분석 포함 여부'),
  urgency: z.enum(['normal', 'high', 'urgent'])
    .default('normal')
    .describe('분석 우선순위')
});

export const TrademarkAnalysisResultSchema = z.object({
  analysisId: z.string().describe('분석 ID'),
  trademarkName: z.string().describe('분석된 상표명'),
  overallRisk: z.enum(['low', 'medium', 'high']).describe('전체적인 위험도'),
  riskScore: z.number().min(0).max(100).describe('위험 점수'),
  conflictingTrademarks: z.array(z.object({
    trademarkName: z.string(),
    applicationNumber: z.string(),
    similarityScore: z.number(),
    conflictReason: z.string(),
    recommendations: z.array(z.string())
  })),
  classificationAnalysis: z.array(z.object({
    code: z.string(),
    description: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    conflictCount: z.number(),
    recommendations: z.array(z.string())
  })),
  expertInsights: z.array(z.string()).optional().describe('전문가 의견'),
  recommendedActions: z.array(z.object({
    action: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    estimatedCost: z.number().optional()
  })),
  createdAt: z.string().datetime(),
  estimatedProcessingTime: z.string().optional().describe('예상 처리 시간')
});

export const TrademarkAnalysisResponseSchema = z.object({
  success: z.literal(true),
  data: TrademarkAnalysisResultSchema
});

/**
 * Image Search Schemas
 */
export const ImageSearchRequestSchema = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
  searchScope: z.enum(['all', 'similar_design', 'identical_only'])
    .default('all')
    .describe('검색 범위'),
  classificationCodes: z.array(z.string())
    .optional()
    .describe('검색할 분류 코드'),
  threshold: z.number()
    .min(0.1)
    .max(1.0)
    .default(0.7)
    .describe('유사도 임계값')
}).refine(
  data => data.imageUrl || data.imageBase64,
  { message: 'imageUrl 또는 imageBase64 중 하나는 필수입니다.' }
);

export const ImageSearchResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    searchId: z.string(),
    results: z.array(z.object({
      trademark: TrademarkSearchResultSchema,
      visualSimilarity: z.number().min(0).max(1),
      matchedFeatures: z.array(z.string()),
      confidence: z.number().min(0).max(100)
    })),
    analysisInfo: z.object({
      processedImageUrl: z.string().url(),
      detectedFeatures: z.array(z.string()),
      searchDuration: z.number()
    })
  })
});

/**
 * Classification Schemas
 */
export const ClassificationSearchRequestSchema = z.object({
  businessDescription: z.string()
    .min(10, '사업 설명을 10자 이상 입력해주세요.')
    .max(500, '사업 설명은 500자 이하로 입력해주세요.'),
  keywords: z.array(z.string())
    .optional()
    .describe('관련 키워드'),
  maxSuggestions: z.number()
    .min(1)
    .max(20)
    .default(5)
    .describe('최대 제안 분류 수')
});

export const ClassificationSuggestionSchema = z.object({
  code: z.string().describe('분류 코드'),
  title: z.string().describe('분류 제목'),
  description: z.string().describe('분류 설명'),
  relevanceScore: z.number().min(0).max(1).describe('연관성 점수'),
  examples: z.array(z.string()).describe('해당 분류 예시'),
  recommendationReason: z.string().describe('추천 이유')
});

export const ClassificationSearchResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    suggestions: z.array(ClassificationSuggestionSchema),
    analysisInfo: z.object({
      inputText: z.string(),
      processedKeywords: z.array(z.string()),
      confidence: z.number().min(0).max(100),
      aiModel: z.string()
    })
  })
});

/**
 * Application Filing Schemas
 */
export const TrademarkApplicationSchema = z.object({
  trademarkName: z.string().min(1).max(50),
  applicantInfo: z.object({
    name: z.string().min(1),
    type: z.enum(['individual', 'corporate']),
    businessNumber: z.string().optional(),
    address: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email()
  }),
  classificationCodes: z.array(z.string()).min(1),
  goodsAndServices: z.string().min(10).max(2000),
  priority: z.object({
    hasPriority: z.boolean(),
    countryCode: z.string().optional(),
    applicationNumber: z.string().optional(),
    filingDate: z.string().optional()
  }).optional(),
  representation: z.object({
    type: z.enum(['text', 'design', 'combined']),
    imageUrl: z.string().url().optional(),
    description: z.string().optional()
  })
});

export const TrademarkApplicationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    applicationId: z.string(),
    applicationNumber: z.string().optional(),
    status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']),
    estimatedCost: z.object({
      officialFees: z.number(),
      serviceFees: z.number(),
      total: z.number(),
      currency: z.string().default('KRW')
    }),
    nextSteps: z.array(z.object({
      step: z.string(),
      description: z.string(),
      estimatedDate: z.string().optional()
    })),
    documents: z.array(z.object({
      type: z.string(),
      name: z.string(),
      url: z.string().url(),
      required: z.boolean()
    }))
  })
});

/**
 * Export all schemas for easy import
 */
export const TrademarkSchemas = {
  // Search
  TrademarkSearchRequest: TrademarkSearchRequestSchema,
  TrademarkSearchResult: TrademarkSearchResultSchema,
  TrademarkSearchResponse: TrademarkSearchResponseSchema,
  
  // Analysis
  TrademarkAnalysisRequest: TrademarkAnalysisRequestSchema,
  TrademarkAnalysisResult: TrademarkAnalysisResultSchema,
  TrademarkAnalysisResponse: TrademarkAnalysisResponseSchema,
  
  // Image Search
  ImageSearchRequest: ImageSearchRequestSchema,
  ImageSearchResponse: ImageSearchResponseSchema,
  
  // Classification
  ClassificationSearchRequest: ClassificationSearchRequestSchema,
  ClassificationSuggestion: ClassificationSuggestionSchema,
  ClassificationSearchResponse: ClassificationSearchResponseSchema,
  
  // Application
  TrademarkApplication: TrademarkApplicationSchema,
  TrademarkApplicationResponse: TrademarkApplicationResponseSchema
};