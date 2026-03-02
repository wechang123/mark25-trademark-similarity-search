import { z } from 'zod';

/**
 * Trademark Application API Schemas
 * These schemas match the actual implementation in /api/trademark-application
 */

/**
 * GET Query Schema - for fetching applications
 */
export const TrademarkApplicationQuerySchema = z.object({
  id: z.string().optional().describe('특정 출원 ID (선택사항)')
});

/**
 * POST Request Schema - for creating new applications
 * Based on the actual implementation in /api/trademark-application
 */
export const TrademarkApplicationRequestSchema = z.object({
  // 출원인 기본 정보
  residentNumber: z.string().min(1, '주민등록번호는 필수입니다.').describe('주민등록번호'),
  nameKorean: z.string().min(1, '한글명은 필수입니다.').describe('한글명'),
  nameEnglish: z.string().min(1, '영문명은 필수입니다.').describe('영문명'),
  applicantType: z.string().min(1, '출원인 구분은 필수입니다.').describe('출원인 구분'),
  cityProvince: z.string().min(1, '시도는 필수입니다.').describe('시도'),
  nationality: z.string().min(1, '국적은 필수입니다.').describe('국적'),
  
  // 주소 정보
  address: z.string().min(1, '주소는 필수입니다.').describe('주소'),
  addressDetail: z.string().min(1, '상세주소는 필수입니다.').describe('상세주소'),
  addressEnglish: z.string().optional().describe('영문주소'),
  addressPostalCode: z.string().min(1, '우편번호는 필수입니다.').describe('우편번호'),
  
  // 연락처 정보
  phoneNumber: z.string().min(1, '전화번호는 필수입니다.').describe('전화번호'),
  email: z.string().email('올바른 이메일 형식이 아닙니다.').describe('이메일'),
  receiptMethod: z.string().min(1, '수령방법은 필수입니다.').describe('수령방법'),
  
  // 상표 정보
  trademarkType: z.string().min(1, '상표 유형은 필수입니다.').describe('상표 유형'),
  trademarkImage: z.string().min(1, '상표 이미지는 필수입니다.').describe('상표 이미지 (Base64)'),
  industryDescription: z.string().min(1, '업종 설명은 필수입니다.').describe('업종 설명'),
  
  // 상품 분류 정보
  productClassification: z.string().optional().describe('상품 분류'),
  designatedProducts: z.string().optional().describe('지정 상품'),
  
  // 이미지 파일들
  sealImage: z.string().optional().describe('인감 이미지 (Base64)'),
  signatureImage: z.string().optional().describe('서명 이미지 (Base64)'),
  
  // 옵션들
  singleApplicationPossible: z.enum(['가능', '불가능']).describe('단일 출원 가능 여부')
});

/**
 * Application Data Schema - for database records
 */
export const ApplicationRecordSchema = z.object({
  id: z.string().describe('출원 ID'),
  trademark_name: z.string().describe('상표명'),
  trademark_type: z.string().describe('상표 유형'),
  applicant_name: z.string().describe('출원인명'),
  applicant_type: z.string().describe('출원인 구분'),
  business_number: z.string().nullable().describe('사업자등록번호'),
  address: z.string().describe('주소'),
  phone: z.string().describe('전화번호'),
  email: z.string().describe('이메일'),
  classification_codes: z.array(z.string()).describe('분류 코드'),
  goods_services: z.string().describe('상품/서비스'),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']).describe('출원 상태'),
  priority_claim: z.record(z.any()).nullable().describe('우선권 정보'),
  trademark_image_url: z.string().nullable().describe('상표 이미지 URL'),
  options: z.record(z.any()).nullable().describe('추가 옵션'),
  created_at: z.string().describe('생성 시간'),
  updated_at: z.string().describe('수정 시간'),
  user_id: z.string().describe('사용자 ID'),
  analysis_session_id: z.string().nullable().describe('분석 세션 ID')
});

/**
 * GET Response Schema - single application
 */
export const TrademarkApplicationSingleResponseSchema = z.object({
  success: z.literal(true),
  data: ApplicationRecordSchema
});

/**
 * GET Response Schema - list of applications
 */
export const TrademarkApplicationListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ApplicationRecordSchema)
});

/**
 * POST Response Schema - application creation result
 */
export const TrademarkApplicationPostResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    application_id: z.string().describe('생성된 출원 ID'),
    status: z.string().describe('출원 상태'),
    estimated_cost: z.object({
      official_fees: z.number().describe('관납료'),
      service_fees: z.number().describe('서비스 수수료'),
      total: z.number().describe('총 비용'),
      currency: z.string().default('KRW').describe('통화')
    }).optional().describe('예상 비용'),
    next_steps: z.array(z.object({
      step: z.string().describe('단계'),
      description: z.string().describe('설명'),
      estimated_date: z.string().optional().describe('예상 날짜')
    })).optional().describe('다음 단계'),
    message: z.string().describe('결과 메시지')
  })
});

/**
 * Error Response Schema
 */
export const TrademarkApplicationErrorSchema = z.object({
  error: z.string().describe('에러 메시지')
});

// Type exports
export type TrademarkApplicationQuery = z.infer<typeof TrademarkApplicationQuerySchema>;
export type TrademarkApplicationRequest = z.infer<typeof TrademarkApplicationRequestSchema>;
export type TrademarkApplicationSingleResponse = z.infer<typeof TrademarkApplicationSingleResponseSchema>;
export type TrademarkApplicationListResponse = z.infer<typeof TrademarkApplicationListResponseSchema>;
export type TrademarkApplicationPostResponse = z.infer<typeof TrademarkApplicationPostResponseSchema>;
export type ApplicationRecord = z.infer<typeof ApplicationRecordSchema>;