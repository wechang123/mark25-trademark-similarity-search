/**
 * Swagger/OpenAPI 인프라 메인 export
 */

// 설정
export * from './config/openapi.config';

// 타입 정의  
export * from './types/swagger.types';

// 스키마
export * from './schemas';

// 레지스트리 (ApiDocConfig 충돌 방지를 위해 명시적 export)
export { apiRegistry } from './registry';

// 생성기
export * from './generators/openapi-generator';

// 데코레이터 시스템
export * from './decorators/api-decorators';

// 검증 미들웨어
export * from './middleware/validation-middleware';

// 메인 생성 함수 (편의용)
export { generateOpenApiDocument, generateDevDocument, generateProdDocument } from './generators/openapi-generator';