import { z } from 'zod';

/**
 * Image Similarity API Schemas
 * For trademark image similarity analysis using KIPRIS API
 */

/**
 * Image Similarity Result Schema
 */
export const ImageSimilarityResultSchema = z.object({
  id: z.string().describe('결과 ID'),
  imagePath: z.string().describe('이미지 경로'),
  thumbnailPath: z.string().describe('썸네일 이미지 경로'),
  title: z.string().describe('상표명'),
  applicantName: z.string().describe('출원인명'),
  applicationDate: z.string().describe('출원일'),
  registrationDate: z.string().optional().describe('등록일'),
  applicationStatus: z.string().describe('출원 상태'),
  goodsClassificationCode: z.string().describe('상품분류코드'),
  similarityScore: z.number().min(0).max(100).describe('유사도 점수 (0-100)'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('위험도')
});

/**
 * Image Similarity Response Schema
 */
export const ImageSimilarityResponseSchema = z.object({
  total: z.number().describe('전체 결과 수'),
  items: z.array(ImageSimilarityResultSchema).describe('유사 상표 목록'),
  riskScore: z.number().min(0).max(10).describe('위험도 점수 (0-10)'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('위험도 레벨'),
  searchTimestamp: z.string().describe('검색 시점')
});

/**
 * Success Response Schema
 */
export const ImageSimilaritySuccessResponseSchema = ImageSimilarityResponseSchema;

/**
 * Error Response Schema
 */
export const ImageSimilarityErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지')
});

/**
 * Union Response Schema for all possible responses
 */
export const ImageSimilarityApiResponseSchema = z.union([
  ImageSimilaritySuccessResponseSchema,
  ImageSimilarityErrorResponseSchema
]);

// Type exports
export type ImageSimilarityResult = z.infer<typeof ImageSimilarityResultSchema>;
export type ImageSimilarityResponse = z.infer<typeof ImageSimilarityResponseSchema>;
export type ImageSimilaritySuccessResponse = z.infer<typeof ImageSimilaritySuccessResponseSchema>;
export type ImageSimilarityErrorResponse = z.infer<typeof ImageSimilarityErrorResponseSchema>;
export type ImageSimilarityApiResponse = z.infer<typeof ImageSimilarityApiResponseSchema>;