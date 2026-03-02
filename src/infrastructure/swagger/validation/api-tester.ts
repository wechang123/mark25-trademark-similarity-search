import { apiRegistry } from '../registry/api-registry';
import { schemaValidator, type ValidationResult } from './schema-validator';
import type { ApiEndpointOptions } from '../decorators/api-decorators';

/**
 * API 테스트 결과 인터페이스
 */
export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  responseTime: number;
  validationResult: ValidationResult;
  error?: string;
  timestamp: Date;
}

/**
 * API 자동 테스트 실행기
 * 등록된 모든 API 엔드포인트를 자동으로 테스트하고 검증합니다.
 */
export class ApiTester {
  private baseUrl: string;
  private testResults: ApiTestResult[] = [];
  private timeout: number;

  constructor(baseUrl = 'http://localhost:3000', timeout = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * 모든 등록된 API 엔드포인트 테스트
   */
  async testAllEndpoints(): Promise<ApiTestResult[]> {
    const registeredApis = apiRegistry.getAllEndpoints();
    console.log(`🧪 Testing ${registeredApis.length} API endpoints...`);

    const results: ApiTestResult[] = [];
    
    for (const api of registeredApis) {
      const result = await this.testEndpoint(api);
      results.push(result);
    }

    this.testResults = results;
    return results;
  }

  /**
   * 개별 엔드포인트 테스트
   */
  async testEndpoint(api: ApiEndpointOptions): Promise<ApiTestResult> {
    const startTime = Date.now();
    
    try {
      // 테스트 데이터 생성
      const testData = this.generateTestData(api);
      
      // API 호출
      const response = await this.makeApiRequest(api, testData);
      const responseTime = Date.now() - startTime;
      
      // 응답 데이터 파싱
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      // 스키마 검증
      const validationResult = schemaValidator.validateResponse(
        api.path,
        api.method,
        responseData,
        response.status
      );

      return {
        endpoint: api.path,
        method: api.method,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        validationResult,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: api.path,
        method: api.method,
        status: responseTime > this.timeout ? 'timeout' : 'error',
        responseTime,
        validationResult: {
          isValid: false,
          errors: [{
            type: 'schema',
            expected: 'successful API call',
            actual: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }],
          endpoint: api.path,
          method: api.method
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * API 요청 실행
   */
  private async makeApiRequest(api: ApiEndpointOptions, testData?: any): Promise<Response> {
    const url = `${this.baseUrl}${api.path}`;
    const method = api.method.toUpperCase();

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Tester/1.0'
      }
    };

    // GET 요청의 경우 쿼리 파라미터로 추가
    if (method === 'GET' && testData) {
      const params = new URLSearchParams();
      Object.entries(testData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      return await fetch(finalUrl, requestOptions);
    }

    // POST, PUT 등의 경우 body에 추가
    if (testData && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(testData);
    }

    return await fetch(url, requestOptions);
  }

  /**
   * API 스키마를 기반으로 테스트 데이터 생성
   */
  private generateTestData(api: ApiEndpointOptions): any {
    if (!api.requestSchema) {
      return null;
    }

    try {
      // Zod 스키마에서 기본값 추출 시도
      return this.extractDefaultValues(api.requestSchema);
    } catch {
      // 기본값 추출 실패 시 빈 객체 반환
      return {};
    }
  }

  /**
   * Zod 스키마에서 기본값 추출 (단순화된 버전)
   */
  private extractDefaultValues(schema: any): any {
    // 실제로는 더 복잡한 로직이 필요하지만, 기본적인 예시 데이터 제공
    const sampleData: Record<string, any> = {
      // 공통 테스트 데이터
      trademarkName: 'TEST_TRADEMARK',
      businessDescription: 'Test business description',
      email: 'test@example.com',
      password: 'test123456',
      query: 'test',
      id: '123',
      searchId: 'test-search-id',
      // 더 많은 샘플 데이터 추가 가능
    };

    return sampleData;
  }

  /**
   * 테스트 결과 통계
   */
  getTestStats() {
    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.status === 'success' && r.validationResult.isValid).length;
    const failed = this.testResults.filter(r => r.status === 'error').length;
    const timeout = this.testResults.filter(r => r.status === 'timeout').length;
    const validationFailed = this.testResults.filter(r => r.status === 'success' && !r.validationResult.isValid).length;

    const avgResponseTime = total > 0 
      ? this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / total 
      : 0;

    return {
      total,
      successful,
      failed,
      timeout,
      validationFailed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : '0.00',
      avgResponseTime: Math.round(avgResponseTime),
      timestamp: new Date()
    };
  }

  /**
   * 실패한 테스트만 필터링
   */
  getFailedTests(): ApiTestResult[] {
    return this.testResults.filter(result => 
      result.status !== 'success' || !result.validationResult.isValid
    );
  }

  /**
   * 느린 응답 시간의 테스트 필터링
   */
  getSlowTests(threshold = 1000): ApiTestResult[] {
    return this.testResults.filter(result => result.responseTime > threshold);
  }

  /**
   * 테스트 결과를 JSON으로 내보내기
   */
  exportResults(): string {
    return JSON.stringify({
      stats: this.getTestStats(),
      results: this.testResults,
      failedTests: this.getFailedTests(),
      timestamp: new Date()
    }, null, 2);
  }

  /**
   * 테스트 결과 초기화
   */
  clearResults(): void {
    this.testResults = [];
  }
}

// 기본 인스턴스 생성
export const apiTester = new ApiTester();