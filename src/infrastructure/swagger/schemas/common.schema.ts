import { z } from 'zod';

/**
 * 공통 응답 스키마 정의
 * 모든 API에서 일관된 응답 형식을 위한 기본 스키마들
 */

// 기본 에러 응답 스키마
export const ErrorResponseSchema = z.object({
  error: z.string().describe('에러 메시지'),
  code: z.string().optional().describe('에러 코드 (예: AUTH_001, VALIDATION_001)'),
  details: z.any().optional().describe('상세 에러 정보 (개발용)')
});

// 기본 성공 응답 스키마
export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true).describe('성공 여부'),
  message: z.string().optional().describe('성공 메시지'),
  data: z.any().optional().describe('응답 데이터')
});

// 페이지네이션 스키마
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1).describe('현재 페이지 번호'),
  limit: z.number().min(1).max(100).default(20).describe('페이지당 항목 수'),
  total: z.number().optional().describe('전체 항목 수'),
  totalPages: z.number().optional().describe('전체 페이지 수')
});

// 페이지네이션된 응답 스키마
export const PaginatedResponseSchema = <T extends z.ZodType<any>>(dataSchema: T) =>
  z.object({
    success: z.boolean().default(true),
    data: z.array(dataSchema).describe('페이지 데이터'),
    pagination: PaginationSchema
  });

// ID 파라미터 스키마
export const IdParamSchema = z.object({
  id: z.string().uuid('유효한 UUID 형식이어야 합니다').describe('리소스 ID')
});

// 검색 쿼리 스키마
export const SearchQuerySchema = z.object({
  q: z.string().min(1, '검색어를 입력해주세요').optional().describe('검색어'),
  page: z.number().min(1).default(1).optional().describe('페이지 번호'),
  limit: z.number().min(1).max(100).default(20).optional().describe('페이지당 항목 수'),
  sortBy: z.string().optional().describe('정렬 기준 필드'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional().describe('정렬 순서')
});

// 날짜 범위 스키마
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional().describe('시작 날짜 (ISO 8601 형식)'),
  endDate: z.string().datetime().optional().describe('종료 날짜 (ISO 8601 형식)')
});

// 파일 업로드 스키마
export const FileUploadSchema = z.object({
  fileName: z.string().describe('파일 이름'),
  fileSize: z.number().positive().describe('파일 크기 (bytes)'),
  mimeType: z.string().describe('파일 MIME 타입'),
  url: z.string().url().describe('파일 URL')
});

// HTTP 상태 코드별 표준 응답 생성 헬퍼
export const createStandardResponses = () => ({
  '200': {
    description: '성공',
    content: {
      'application/json': {
        schema: SuccessResponseSchema
      }
    }
  },
  '400': {
    description: '잘못된 요청',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
        example: {
          error: '입력 데이터가 유효하지 않습니다.',
          code: 'VALIDATION_ERROR'
        }
      }
    }
  },
  '401': {
    description: '인증 실패',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
        example: {
          error: '인증이 필요합니다.',
          code: 'UNAUTHORIZED'
        }
      }
    }
  },
  '403': {
    description: '권한 부족',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
        example: {
          error: '이 작업을 수행할 권한이 없습니다.',
          code: 'FORBIDDEN'
        }
      }
    }
  },
  '404': {
    description: '리소스를 찾을 수 없음',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
        example: {
          error: '요청한 리소스를 찾을 수 없습니다.',
          code: 'NOT_FOUND'
        }
      }
    }
  },
  '500': {
    description: '서버 내부 오류',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
        example: {
          error: '서버에서 오류가 발생했습니다.',
          code: 'INTERNAL_SERVER_ERROR'
        }
      }
    }
  }
});

// Zod 스키마를 OpenAPI 스키마로 변환하는 헬퍼 함수들
export const zodToOpenApiSchema = (zodSchema: z.ZodType<any>): any => {
  // 기본적인 Zod to OpenAPI 변환 로직
  // 실제 구현에서는 더 정교한 변환이 필요
  const schema = zodSchema as any;
  
  if (schema._def.typeName === 'ZodString') {
    return {
      type: 'string',
      description: schema.description || undefined,
      example: schema._def.checks?.find((c: any) => c.kind === 'email') ? 'user@example.com' : undefined
    };
  }
  
  if (schema._def.typeName === 'ZodNumber') {
    return {
      type: 'number',
      description: schema.description || undefined
    };
  }
  
  if (schema._def.typeName === 'ZodBoolean') {
    return {
      type: 'boolean',
      description: schema.description || undefined
    };
  }
  
  if (schema._def.typeName === 'ZodObject') {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(schema._def.shape())) {
      properties[key] = zodToOpenApiSchema(value as z.ZodType<any>);
      
      // Required 체크 (optional이 아닌 경우)
      const zodType = value as any;
      if (zodType._def.typeName !== 'ZodOptional') {
        required.push(key);
      }
    }
    
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      description: schema.description || undefined
    };
  }
  
  if (schema._def.typeName === 'ZodArray') {
    return {
      type: 'array',
      items: zodToOpenApiSchema(schema._def.type),
      description: schema.description || undefined
    };
  }
  
  // 기본적으로 any 타입으로 처리
  return {
    type: 'object',
    description: schema.description || undefined
  };
};