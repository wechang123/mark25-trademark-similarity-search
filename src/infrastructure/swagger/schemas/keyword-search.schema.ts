import { z } from 'zod';

/**
 * Keyword Search API Schemas
 * For generating trademark search keywords with AI assistance
 */

/**
 * POST Request Schema
 */
export const KeywordSearchRequestSchema = z.object({
  trademarkName: z.string().min(1, '상표명은 필수입니다.').describe('검색할 상표명'),
  useAI: z.boolean().optional().default(true).describe('AI 키워드 생성 사용 여부'),
  maxKeywords: z.number().int().min(1).max(50).optional().default(20).describe('최대 키워드 개수'),
  searchKipris: z.boolean().optional().default(false).describe('KIPRIS 검색 실행 여부'),
  productClassificationCodes: z.array(z.string()).optional().describe('상품분류코드 목록'),
  similarGroupCodes: z.array(z.string()).optional().describe('유사군코드 목록'),
  designatedProducts: z.array(z.string()).optional().describe('지정상품 목록')
});

/**
 * Keyword Categories Schema
 */
export const KeywordCategoriesSchema = z.object({
  phonetic: z.array(z.string()).describe('발음 유사 키워드'),
  spacing: z.array(z.string()).describe('띄어쓰기 변형 키워드'),
  case: z.array(z.string()).describe('대소문자 변형 키워드'),
  transliteration: z.array(z.string()).describe('음차 표기 키워드'),
  abbreviations: z.array(z.string()).describe('약어 키워드'),
  combinations: z.array(z.string()).describe('조합 키워드')
});

/**
 * Keyword Generation Result Schema
 */
export const KeywordGenerationSchema = z.object({
  originalTrademark: z.string().describe('원본 상표명'),
  generatedKeywords: z.array(z.string()).describe('생성된 키워드 목록'),
  keywordCount: z.number().describe('키워드 개수'),
  categories: KeywordCategoriesSchema.describe('카테고리별 키워드'),
  confidence: z.number().min(0).max(100).describe('생성 신뢰도 (%)'),
  processingTime: z.number().describe('처리 시간 (ms)')
});

/**
 * Success Response Schema
 */
export const KeywordSearchSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    keywordGeneration: KeywordGenerationSchema.describe('키워드 생성 결과')
  })
});

/**
 * Error Response Schema
 */
export const KeywordSearchErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('오류 메시지')
});

/**
 * Union Response Schema
 */
export const KeywordSearchResponseSchema = z.union([
  KeywordSearchSuccessResponseSchema,
  KeywordSearchErrorResponseSchema
]);

// Type exports
export type KeywordSearchRequest = z.infer<typeof KeywordSearchRequestSchema>;
export type KeywordCategories = z.infer<typeof KeywordCategoriesSchema>;
export type KeywordGeneration = z.infer<typeof KeywordGenerationSchema>;
export type KeywordSearchSuccessResponse = z.infer<typeof KeywordSearchSuccessResponseSchema>;
export type KeywordSearchErrorResponse = z.infer<typeof KeywordSearchErrorResponseSchema>;
export type KeywordSearchResponse = z.infer<typeof KeywordSearchResponseSchema>;