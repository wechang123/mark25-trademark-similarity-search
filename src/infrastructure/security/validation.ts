import { z } from 'zod';

// Search API validation schemas
export const searchQuerySchema = z.object({
  query: z.string().min(1, "상표명은 필수입니다").max(100, "상표명은 100자를 초과할 수 없습니다"),
  businessDescription: z.string().min(1, "사업 설명은 필수입니다").max(1000, "사업 설명은 1000자를 초과할 수 없습니다"),
  productClassificationCodes: z.array(z.string()).min(1, "상품분류코드는 최소 1개 이상이어야 합니다"),
  similarGroupCodes: z.array(z.string()).optional(),
  designatedProducts: z.array(z.string()).optional(),
  includeImages: z.boolean().optional().default(false),
});

// Image similarity search validation
export const imageSimilaritySchema = z.object({
  image: z.string().min(1, "이미지는 필수입니다"),
  threshold: z.number().min(0).max(1).optional().default(0.8),
  maxResults: z.number().min(1).max(50).optional().default(10),
});

// Trademark application validation
export const trademarkApplicationSchema = z.object({
  // 상표명
  trademark_name: z.string().min(1, "상표명은 필수입니다").max(50, "상표명은 50자를 초과할 수 없습니다"),
  
  // 출원인 정보
  applicant_name: z.string().min(1, "출원인명은 필수입니다").max(100),
  applicant_address: z.string().min(1, "주소는 필수입니다").max(200),
  applicant_phone: z.string().regex(/^[\d\-\+\(\)\s]+$/, "올바른 전화번호 형식이 아닙니다").optional(),
  applicant_email: z.string().email("올바른 이메일 형식이 아닙니다").optional(),
  
  // 주민/사업자 번호
  resident_number: z.string().optional(),
  business_number: z.string().optional(),
  
  // 상표 정보
  trademark_type: z.enum(['word', 'design', 'combined'], {
    errorMap: () => ({ message: "상표 유형을 선택해주세요" })
  }),
  trademark_description: z.string().max(500, "상표 설명은 500자를 초과할 수 없습니다").optional(),
  
  // 상품/서비스 분류
  nice_classification: z.array(z.number().min(1).max(45)).min(1, "최소 하나의 분류를 선택해주세요"),
  goods_services: z.string().min(1, "상품/서비스 명세는 필수입니다").max(1000),
  
  // 우선권 주장
  priority_date: z.string().optional(),
  priority_country: z.string().optional(),
  priority_number: z.string().optional(),
});

// Pre-booking validation
export const preBookingSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  phone: z.string().regex(/^[\d\-\+\(\)\s]+$/, "올바른 전화번호 형식이 아닙니다").optional(),
  service_type: z.enum(['trademark_search', 'full_analysis', 'application_support']),
  company_name: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

// Analysis waitlist validation
export const analysisWaitlistSchema = z.object({
  trademark_search_id: z.string().uuid("올바른 검색 ID 형식이 아닙니다"),
  contact_email: z.string().email("올바른 이메일 형식이 아닙니다"),
  urgency_level: z.enum(['low', 'medium', 'high']).default('medium'),
  additional_notes: z.string().max(1000).optional(),
});

// User profile validation
export const userProfileSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(50),
  phone: z.string().regex(/^[\d\-\+\(\)\s]+$/, "올바른 전화번호 형식이 아닙니다").optional(),
  avatar_url: z.string().url("올바른 URL 형식이 아닙니다").optional(),
  marketing_agreed: z.boolean().default(false),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string().min(1),
    size: z.number().max(10 * 1024 * 1024, "파일 크기는 10MB를 초과할 수 없습니다"), // 10MB
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
      "지원되지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP만 허용됩니다."
    ),
  }),
  path: z.string().min(1),
});

// Common validation helpers
export const validateApiRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(firstError.message);
    }
    throw new Error('유효하지 않은 요청 데이터입니다.');
  }
};

export const createValidationResponse = (error: string) => {
  return new Response(
    JSON.stringify({ 
      error: 'Validation Error', 
      message: error,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};