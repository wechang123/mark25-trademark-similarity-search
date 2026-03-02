import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { apiRegistry } from '../registry/api-registry';
import type { ApiEndpointOptions } from '../decorators/api-decorators';

/**
 * API 스키마 검증 결과 인터페이스
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  endpoint: string;
  method: string;
}

export interface ValidationError {
  type: 'request' | 'response' | 'schema' | 'type';
  field?: string;
  expected: string;
  actual: string;
  message: string;
}

/**
 * 실시간 스키마 검증기
 * 실제 API 요청/응답과 문서화된 스키마 간의 일치성을 검증합니다.
 */
export class SchemaValidator {
  private static instance: SchemaValidator;
  private validationResults: Map<string, ValidationResult[]> = new Map();

  static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  /**
   * API 요청 스키마 검증
   */
  validateRequest(
    endpoint: string,
    method: string,
    requestData: any
  ): ValidationResult {
    const apiDoc = this.getApiDocumentation(endpoint, method);
    const errors: ValidationError[] = [];

    if (!apiDoc) {
      errors.push({
        type: 'schema',
        expected: 'API documentation',
        actual: 'none',
        message: `No API documentation found for ${method} ${endpoint}`
      });
    } else {
      // 요청 스키마 검증
      if (apiDoc.requestSchema) {
        try {
          apiDoc.requestSchema.parse(requestData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...this.parseZodErrors(error, 'request'));
          }
        }
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      endpoint,
      method
    };

    this.recordValidationResult(endpoint, method, result);
    return result;
  }

  /**
   * API 응답 스키마 검증
   */
  validateResponse(
    endpoint: string,
    method: string,
    responseData: any,
    statusCode: number
  ): ValidationResult {
    const apiDoc = this.getApiDocumentation(endpoint, method);
    const errors: ValidationError[] = [];

    if (!apiDoc) {
      errors.push({
        type: 'schema',
        expected: 'API documentation',
        actual: 'none',
        message: `No API documentation found for ${method} ${endpoint}`
      });
    } else {
      // 응답 스키마 검증
      const responseSchema = statusCode >= 400 
        ? apiDoc.errorResponseSchema 
        : apiDoc.responseSchema;

      if (responseSchema) {
        try {
          responseSchema.parse(responseData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...this.parseZodErrors(error, 'response'));
          }
        }
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      endpoint,
      method
    };

    this.recordValidationResult(endpoint, method, result);
    return result;
  }

  /**
   * 전체 API 엔드포인트 스키마 일치성 검증
   */
  async validateAllEndpoints(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const registeredApis = apiRegistry.getAllEndpoints();

    console.log(`🔍 Validating ${registeredApis.length} API endpoints...`);

    for (const api of registeredApis) {
      try {
        // 각 엔드포인트에 대한 기본 검증
        const result = await this.validateEndpointStructure(api);
        results.push(result);
      } catch (error) {
        results.push({
          isValid: false,
          errors: [{
            type: 'schema',
            expected: 'valid endpoint structure',
            actual: 'validation error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }],
          endpoint: api.path,
          method: api.method
        });
      }
    }

    return results;
  }

  /**
   * 엔드포인트 구조 검증
   */
  private async validateEndpointStructure(api: ApiEndpointOptions): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // 필수 필드 검증
    if (!api.summary || api.summary.trim() === '') {
      errors.push({
        type: 'schema',
        field: 'summary',
        expected: 'non-empty string',
        actual: api.summary || 'undefined',
        message: 'API summary is required'
      });
    }

    if (!api.description || api.description.trim() === '') {
      errors.push({
        type: 'schema',
        field: 'description',
        expected: 'non-empty string',
        actual: api.description || 'undefined',
        message: 'API description is required'
      });
    }

    if (!api.tags || api.tags.length === 0) {
      errors.push({
        type: 'schema',
        field: 'tags',
        expected: 'non-empty array',
        actual: JSON.stringify(api.tags),
        message: 'API tags are required'
      });
    }

    // 스키마 구조 검증
    if (api.requestSchema && !this.isValidZodSchema(api.requestSchema)) {
      errors.push({
        type: 'schema',
        field: 'requestSchema',
        expected: 'valid Zod schema',
        actual: 'invalid schema',
        message: 'Request schema is not a valid Zod schema'
      });
    }

    if (api.responseSchema && !this.isValidZodSchema(api.responseSchema)) {
      errors.push({
        type: 'schema',
        field: 'responseSchema',
        expected: 'valid Zod schema',
        actual: 'invalid schema',
        message: 'Response schema is not a valid Zod schema'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      endpoint: api.path,
      method: api.method
    };
  }

  /**
   * Zod 에러를 ValidationError로 변환
   */
  private parseZodErrors(zodError: z.ZodError, type: 'request' | 'response'): ValidationError[] {
    return zodError.errors.map(error => ({
      type,
      field: error.path.join('.'),
      expected: error.message,
      actual: 'invalid value',
      message: `${type} validation failed: ${error.message} at ${error.path.join('.')}`
    }));
  }

  /**
   * API 문서 조회
   */
  private getApiDocumentation(endpoint: string, method: string): ApiEndpointOptions | null {
    return apiRegistry.getEndpoint(endpoint, method);
  }

  /**
   * 유효한 Zod 스키마인지 검증
   */
  private isValidZodSchema(schema: any): boolean {
    try {
      return schema && typeof schema.parse === 'function';
    } catch {
      return false;
    }
  }

  /**
   * 검증 결과 기록
   */
  private recordValidationResult(endpoint: string, method: string, result: ValidationResult): void {
    const key = `${method.toUpperCase()}:${endpoint}`;
    const results = this.validationResults.get(key) || [];
    results.push(result);
    this.validationResults.set(key, results);
  }

  /**
   * 검증 결과 조회
   */
  getValidationResults(): Map<string, ValidationResult[]> {
    return new Map(this.validationResults);
  }

  /**
   * 검증 통계
   */
  getValidationStats() {
    const totalValidations = Array.from(this.validationResults.values())
      .reduce((sum, results) => sum + results.length, 0);
    
    const failedValidations = Array.from(this.validationResults.values())
      .reduce((sum, results) => sum + results.filter(r => !r.isValid).length, 0);

    return {
      total: totalValidations,
      passed: totalValidations - failedValidations,
      failed: failedValidations,
      passRate: totalValidations > 0 ? ((totalValidations - failedValidations) / totalValidations * 100).toFixed(2) : '0.00'
    };
  }

  /**
   * 검증 결과 초기화
   */
  clearValidationResults(): void {
    this.validationResults.clear();
  }
}

// 전역 인스턴스 내보내기
export const schemaValidator = SchemaValidator.getInstance();