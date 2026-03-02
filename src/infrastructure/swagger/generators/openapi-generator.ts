import { OpenAPISpec } from '../types/swagger.types';
import { openApiConfig, getServerConfig } from '../config/openapi.config';
import { apiRegistry } from '../registry/api-registry';

/**
 * OpenAPI 문서 생성기
 */
export class OpenApiGenerator {
  /**
   * 완전한 OpenAPI 스펙 문서 생성
   */
  generateDocument(): OpenAPISpec {
    const paths = apiRegistry.getPaths();
    const schemas = apiRegistry.getSchemas();

    const document: OpenAPISpec = {
      ...openApiConfig,
      servers: getServerConfig(),
      paths,
      components: {
        ...openApiConfig.components,
        schemas: {
          ...openApiConfig.components?.schemas,
          ...schemas
        }
      }
    };

    return document;
  }

  /**
   * 특정 태그의 API만 포함한 문서 생성
   */
  generateDocumentByTags(tags: string[]): OpenAPISpec {
    const allPaths = apiRegistry.getPaths();
    const filteredPaths: Record<string, any> = {};

    // 지정된 태그를 포함한 경로만 필터링
    for (const [path, pathItem] of Object.entries(allPaths)) {
      const filteredPathItem: any = {};
      
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation && typeof operation === 'object' && 'tags' in operation) {
          const operationTags = operation.tags || [];
          if (operationTags.some((tag: string) => tags.includes(tag))) {
            filteredPathItem[method] = operation;
          }
        }
      }

      if (Object.keys(filteredPathItem).length > 0) {
        filteredPaths[path] = filteredPathItem;
      }
    }

    const document: OpenAPISpec = {
      ...openApiConfig,
      servers: getServerConfig(),
      paths: filteredPaths,
      components: {
        ...openApiConfig.components,
        schemas: apiRegistry.getSchemas()
      }
    };

    return document;
  }

  /**
   * 개발 환경용 문서 생성 (디버그 API 포함)
   */
  generateDevelopmentDocument(): OpenAPISpec {
    if (process.env.NODE_ENV === 'production') {
      // 프로덕션에서는 디버그 태그 제외
      return this.generateDocumentByTags([
        'Authentication',
        'Trademark Search',
        'AI Analysis',
        'Application',
        'Dashboard',
        'System'
      ]);
    }

    // 개발 환경에서는 모든 API 포함
    return this.generateDocument();
  }

  /**
   * 프로덕션용 문서 생성 (민감한 API 제외)
   */
  generateProductionDocument(): OpenAPISpec {
    return this.generateDocumentByTags([
      'Authentication',
      'Trademark Search', 
      'AI Analysis',
      'Application',
      'Dashboard'
    ]);
  }

  /**
   * API 통계 생성
   */
  generateStats(): {
    totalPaths: number;
    totalOperations: number;
    operationsByMethod: Record<string, number>;
    operationsByTag: Record<string, number>;
  } {
    const paths = apiRegistry.getPaths();
    let totalOperations = 0;
    const operationsByMethod: Record<string, number> = {};
    const operationsByTag: Record<string, number> = {};

    for (const pathItem of Object.values(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation && typeof operation === 'object') {
          totalOperations++;
          
          // Method별 통계
          const methodUpper = method.toUpperCase();
          operationsByMethod[methodUpper] = (operationsByMethod[methodUpper] || 0) + 1;
          
          // Tag별 통계
          if ('tags' in operation && Array.isArray(operation.tags)) {
            operation.tags.forEach((tag: string) => {
              operationsByTag[tag] = (operationsByTag[tag] || 0) + 1;
            });
          }
        }
      }
    }

    return {
      totalPaths: Object.keys(paths).length,
      totalOperations,
      operationsByMethod,
      operationsByTag
    };
  }
}

// 싱글톤 인스턴스
export const openApiGenerator = new OpenApiGenerator();

/**
 * 간편한 문서 생성 함수들
 */
export const generateOpenApiDocument = () => openApiGenerator.generateDocument();
export const generateDevDocument = () => openApiGenerator.generateDevelopmentDocument();
export const generateProdDocument = () => openApiGenerator.generateProductionDocument();

/**
 * 향상된 OpenAPI 스펙 생성 (검증 및 메타데이터 포함)
 */
export async function generateOpenApiSpec(): Promise<OpenAPISpec> {
  const generator = new OpenApiGenerator();
  const spec = generator.generateDocument();
  
  // 메타데이터 추가
  const stats = generator.generateStats();
  const buildTime = new Date().toISOString();
  
  return {
    ...spec,
    info: {
      ...spec.info,
      'x-build-time': buildTime,
      'x-stats': stats,
      'x-environment': process.env.NODE_ENV || 'development'
    }
  };
}