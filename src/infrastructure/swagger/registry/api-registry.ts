import { z } from 'zod';
import { OpenAPISpec, PathItem, Operation } from '../types/swagger.types';
import { zodToOpenApiSchema, createStandardResponses } from '../schemas/common.schema';
import type { ApiEndpointOptions } from '../decorators/api-decorators';

/**
 * API 레지스트리 클래스
 * API 엔드포인트 등록 및 OpenAPI 스펙 생성 관리
 */
class ApiRegistry {
  private paths: Record<string, PathItem> = {};
  private schemas: Record<string, any> = {};
  private endpoints: Map<string, ApiEndpointOptions> = new Map();

  /**
   * API 경로 등록
   */
  registerPath(config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    tags?: string[];
    summary?: string;
    description?: string;
    operationId?: string;
    security?: boolean;
    parameters?: Array<{
      name: string;
      in: 'query' | 'header' | 'path' | 'cookie';
      description?: string;
      required?: boolean;
      schema: z.ZodType<any>;
    }>;
    requestBody?: {
      description?: string;
      required?: boolean;
      schema: z.ZodType<any>;
    };
    responses: {
      [statusCode: string]: {
        description: string;
        schema?: z.ZodType<any>;
      };
    };
  }) {
    const { method, path, ...operationConfig } = config;

    // 경로가 없으면 초기화
    if (!this.paths[path]) {
      this.paths[path] = {};
    }

    // Operation 생성
    const operation: Operation = {
      tags: operationConfig.tags,
      summary: operationConfig.summary,
      description: operationConfig.description,
      operationId: operationConfig.operationId || this.generateOperationId(method, path),
      parameters: operationConfig.parameters?.map(param => ({
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required ?? false,
        schema: zodToOpenApiSchema(param.schema)
      })),
      responses: {}
    };

    // 보안 설정
    if (operationConfig.security !== false) {
      operation.security = [{ bearerAuth: [] }];
    }

    // Request Body 설정
    if (operationConfig.requestBody) {
      operation.requestBody = {
        description: operationConfig.requestBody.description,
        required: operationConfig.requestBody.required ?? false,
        content: {
          'application/json': {
            schema: zodToOpenApiSchema(operationConfig.requestBody.schema)
          }
        }
      };
    }

    // Responses 설정
    for (const [statusCode, response] of Object.entries(operationConfig.responses)) {
      operation.responses[statusCode] = {
        description: response.description,
        content: response.schema ? {
          'application/json': {
            schema: zodToOpenApiSchema(response.schema)
          }
        } : undefined
      };
    }

    // 표준 에러 응답 추가
    const standardResponses = createStandardResponses();
    if (!operation.responses['400']) operation.responses['400'] = standardResponses['400'];
    if (!operation.responses['500']) operation.responses['500'] = standardResponses['500'];
    if (operationConfig.security !== false) {
      if (!operation.responses['401']) operation.responses['401'] = standardResponses['401'];
    }

    // PathItem에 추가
    this.paths[path][method.toLowerCase() as keyof PathItem] = operation;
  }

  /**
   * 스키마 등록
   */
  registerSchema(name: string, schema: z.ZodType<any>, description?: string) {
    this.schemas[name] = {
      ...zodToOpenApiSchema(schema),
      description
    };
  }

  /**
   * Operation ID 자동 생성
   */
  private generateOperationId(method: string, path: string): string {
    // Handle undefined or empty path
    if (!path) {
      console.warn('generateOperationId called with undefined/empty path, using fallback');
      return `${method.toLowerCase()}UnknownPath${Date.now()}`;
    }
    
    // "/api/auth/signup" -> "postAuthSignup"
    const pathParts = path
      .split('/')
      .filter(part => part && part !== 'api')
      .map(part => part.replace(/[{}]/g, ''))
      .map(part => part.charAt(0).toUpperCase() + part.slice(1));

    return method.toLowerCase() + pathParts.join('');
  }

  /**
   * 등록된 경로들 반환
   */
  getPaths(): Record<string, PathItem> {
    return this.paths;
  }

  /**
   * 등록된 스키마들 반환
   */
  getSchemas(): Record<string, any> {
    return this.schemas;
  }

  /**
   * API 엔드포인트 등록 (검증용)
   */
  registerEndpoint(endpoint: ApiEndpointOptions) {
    const key = `${endpoint.method.toUpperCase()}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);
  }

  /**
   * 모든 등록된 엔드포인트 반환
   */
  getAllEndpoints(): ApiEndpointOptions[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * 특정 엔드포인트 조회
   */
  getEndpoint(path: string, method: string): ApiEndpointOptions | null {
    const key = `${method.toUpperCase()}:${path}`;
    return this.endpoints.get(key) || null;
  }

  /**
   * 전체 레지스트리 초기화
   */
  clear() {
    this.paths = {};
    this.schemas = {};
    this.endpoints.clear();
  }
}

// 싱글톤 인스턴스 생성
export const apiRegistry = new ApiRegistry();

/**
 * API 문서화를 위한 데코레이터 팩토리
 * (실제 데코레이터는 #59 이슈에서 구현)
 */
export interface ApiDocConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  tags?: string[];
  summary?: string;
  description?: string;
  security?: boolean;
  requestSchema?: z.ZodType<any>;
  responseSchema?: z.ZodType<any>;
}

/**
 * API 등록을 위한 헬퍼 함수
 */
export const registerApi = (config: ApiDocConfig & {
  responses?: { [statusCode: string]: { description: string; schema?: z.ZodType<any> } };
}) => {
  const responses = config.responses || {
    '200': {
      description: '성공',
      schema: config.responseSchema
    }
  };

  apiRegistry.registerPath({
    method: config.method,
    path: config.path,
    tags: config.tags,
    summary: config.summary,
    description: config.description,
    security: config.security,
    requestBody: config.requestSchema ? {
      description: '요청 데이터',
      required: true,
      schema: config.requestSchema
    } : undefined,
    responses
  });
};