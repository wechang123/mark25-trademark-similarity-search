import { z } from 'zod';

/**
 * Rejection Data API Schemas
 * For retrieving trademark rejection data from KIPRIS
 */

/**
 * GET Query Parameters Schema
 */
export const RejectionDataQuerySchema = z.object({
  keyword: z.string().optional().default('식별력').describe('검색 키워드'),
  patent: z.string().optional().transform(val => val === 'true').describe('특허 포함 여부'),
  utility: z.string().optional().transform(val => val === 'true').describe('실용신안 포함 여부'),
  design: z.string().optional().transform(val => val === 'true').describe('디자인 포함 여부'),
  tradeMark: z.string().optional().transform(val => val === 'true').describe('상표 포함 여부'),
  docsStart: z.string().optional().default('1').transform(val => parseInt(val)).describe('시작 문서 번호'),
  docsCount: z.string().optional().default('30').transform(val => parseInt(val)).describe('문서 개수')
});

/**
 * Rejection Data Item Schema
 */
export const RejectionDataItemSchema = z.object({
  id: z.string().describe('문서 ID'),
  title: z.string().describe('문서 제목'),
  content: z.string().describe('거절 사유 내용'),
  date: z.string().describe('결정일'),
  applicationNumber: z.string().describe('출원번호'),
  type: z.enum(['patent', 'utility', 'design', 'trademark']).describe('문서 유형')
});

/**
 * Success Response Schema
 */
export const RejectionDataSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    total: z.number().describe('전체 결과 수'),
    items: z.array(RejectionDataItemSchema).describe('거절 데이터 목록'),
    searchParams: z.object({
      keyword: z.string().describe('검색 키워드'),
      options: z.object({
        patent: z.boolean().describe('특허 포함'),
        utility: z.boolean().describe('실용신안 포함'),
        design: z.boolean().describe('디자인 포함'),
        tradeMark: z.boolean().describe('상표 포함')
      }).describe('검색 옵션')
    }).describe('검색 매개변수')
  })
});

/**
 * Error Response Schema
 */
export const RejectionDataErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('오류 메시지'),
  details: z.string().optional().describe('오류 상세 정보')
});

/**
 * Union Response Schema
 */
export const RejectionDataResponseSchema = z.union([
  RejectionDataSuccessResponseSchema,
  RejectionDataErrorResponseSchema
]);

// Type exports
export type RejectionDataQuery = z.infer<typeof RejectionDataQuerySchema>;
export type RejectionDataItem = z.infer<typeof RejectionDataItemSchema>;
export type RejectionDataSuccessResponse = z.infer<typeof RejectionDataSuccessResponseSchema>;
export type RejectionDataErrorResponse = z.infer<typeof RejectionDataErrorResponseSchema>;
export type RejectionDataResponse = z.infer<typeof RejectionDataResponseSchema>;