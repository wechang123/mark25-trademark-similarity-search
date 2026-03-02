import { schemaValidator, type ValidationResult } from '../validation/schema-validator';
import { apiTester, type ApiTestResult } from '../validation/api-tester';
import { diffDetector, type ApiChange } from '../validation/diff-detector';

/**
 * 빌드 전 검증 결과
 */
export interface PreBuildValidationResult {
  success: boolean;
  schemaValidation: {
    passed: boolean;
    results: ValidationResult[];
    stats: ReturnType<typeof schemaValidator.getValidationStats>;
  };
  apiTesting?: {
    passed: boolean;
    results: ApiTestResult[];
    stats: ReturnType<typeof apiTester.getTestStats>;
  };
  changeDetection: {
    changes: ApiChange[];
    stats: ReturnType<typeof diffDetector.getChangeStats>;
    hasBreakingChanges: boolean;
  };
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

/**
 * 빌드 전 검증 훅 옵션
 */
export interface PreBuildHookOptions {
  enableApiTesting?: boolean;
  failOnSchemaErrors?: boolean;
  failOnBreakingChanges?: boolean;
  skipEndpointTesting?: string[]; // 테스트에서 제외할 엔드포인트 패턴
  testTimeout?: number;
}

/**
 * 빌드 전 검증 훅
 * 빌드 시작 전에 API 스키마 일치성, 엔드포인트 테스트, 변경사항 감지를 실행합니다.
 */
export class PreBuildHook {
  private options: PreBuildHookOptions;

  constructor(options: PreBuildHookOptions = {}) {
    this.options = {
      enableApiTesting: true,
      failOnSchemaErrors: true,
      failOnBreakingChanges: true,
      skipEndpointTesting: ['/api/test/*', '/api/debug/*'],
      testTimeout: 10000,
      ...options
    };
  }

  /**
   * 빌드 전 검증 실행
   */
  async execute(): Promise<PreBuildValidationResult> {
    console.log('🔧 Starting pre-build validation...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // 1. 스키마 일치성 검증
      console.log('📋 Validating API schemas...');
      const schemaResults = await schemaValidator.validateAllEndpoints();
      const schemaStats = schemaValidator.getValidationStats();
      
      const schemaValidationPassed = schemaResults.every(result => result.isValid);
      if (!schemaValidationPassed) {
        const failedResults = schemaResults.filter(r => !r.isValid);
        errors.push(`Schema validation failed for ${failedResults.length} endpoints`);
        
        failedResults.forEach(result => {
          result.errors.forEach(error => {
            errors.push(`${result.method.toUpperCase()} ${result.endpoint}: ${error.message}`);
          });
        });
      }

      // 2. API 엔드포인트 테스트 (선택적)
      let apiTestResults: ApiTestResult[] = [];
      let apiTestStats: ReturnType<typeof apiTester.getTestStats> | undefined;
      let apiTestingPassed = true;

      if (this.options.enableApiTesting && process.env.NODE_ENV !== 'production') {
        console.log('🧪 Testing API endpoints...');
        try {
          // 개발 서버가 실행 중인지 확인
          const isDevServerRunning = await this.checkDevServer();
          
          if (isDevServerRunning) {
            apiTestResults = await apiTester.testAllEndpoints();
            apiTestStats = apiTester.getTestStats();
            
            const failedTests = apiTester.getFailedTests();
            if (failedTests.length > 0) {
              apiTestingPassed = false;
              warnings.push(`${failedTests.length} API tests failed`);
              
              failedTests.slice(0, 5).forEach(test => { // 처음 5개만 표시
                warnings.push(`${test.method.toUpperCase()} ${test.endpoint}: ${test.error || 'Test failed'}`);
              });
            }
          } else {
            warnings.push('Development server not running. Skipping API endpoint testing.');
          }
        } catch (testError) {
          warnings.push(`API testing failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
        }
      }

      // 3. 변경사항 감지
      console.log('🔍 Detecting API changes...');
      await diffDetector.createSnapshot();
      const changes = await diffDetector.detectChanges();
      const changeStats = diffDetector.getChangeStats(changes);

      if (changeStats.hasBreakingChanges) {
        const breakingChanges = changes.filter(c => c.type === 'breaking');
        if (this.options.failOnBreakingChanges) {
          errors.push(`Found ${breakingChanges.length} breaking changes`);
        } else {
          warnings.push(`Found ${breakingChanges.length} breaking changes`);
        }
        
        breakingChanges.forEach(change => {
          const message = `BREAKING: ${change.method.toUpperCase()} ${change.endpoint} - ${change.description}`;
          if (this.options.failOnBreakingChanges) {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        });
      }

      // 결과 생성
      const result: PreBuildValidationResult = {
        success: errors.length === 0,
        schemaValidation: {
          passed: schemaValidationPassed,
          results: schemaResults,
          stats: schemaStats
        },
        apiTesting: apiTestStats ? {
          passed: apiTestingPassed,
          results: apiTestResults,
          stats: apiTestStats
        } : undefined,
        changeDetection: {
          changes,
          stats: changeStats,
          hasBreakingChanges: changeStats.hasBreakingChanges
        },
        errors,
        warnings,
        timestamp: new Date()
      };

      // 결과 출력
      this.printValidationSummary(result, Date.now() - startTime);

      // 빌드 실패 조건 확인
      if (!result.success && this.options.failOnSchemaErrors) {
        throw new Error(`Pre-build validation failed with ${errors.length} errors`);
      }

      return result;

    } catch (error) {
      console.error('❌ Pre-build validation failed:', error);
      throw error;
    }
  }

  /**
   * 개발 서버 실행 상태 확인
   */
  private async checkDevServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/api/openapi/stats', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 검증 결과 요약 출력
   */
  private printValidationSummary(result: PreBuildValidationResult, duration: number): void {
    console.log('\n📊 Pre-build Validation Summary');
    console.log('=====================================');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Success: ${result.success}`);
    
    // 스키마 검증 결과
    console.log(`\n📋 Schema Validation:`);
    console.log(`   Passed: ${result.schemaValidation.passed}`);
    console.log(`   Total: ${result.schemaValidation.stats.total}`);
    console.log(`   Pass Rate: ${result.schemaValidation.stats.passRate}%`);

    // API 테스트 결과
    if (result.apiTesting) {
      console.log(`\n🧪 API Testing:`);
      console.log(`   Passed: ${result.apiTesting.passed}`);
      console.log(`   Success Rate: ${result.apiTesting.stats.successRate}%`);
      console.log(`   Avg Response Time: ${result.apiTesting.stats.avgResponseTime}ms`);
    }

    // 변경사항 감지 결과
    console.log(`\n🔍 Change Detection:`);
    console.log(`   Total Changes: ${result.changeDetection.stats.total}`);
    console.log(`   Breaking Changes: ${result.changeDetection.stats.hasBreakingChanges ? 'Yes' : 'No'}`);

    // 오류 및 경고
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
      
      if (result.warnings.length > 10) {
        console.log(`   ... and ${result.warnings.length - 10} more warnings`);
      }
    }

    console.log('=====================================\n');
  }
}

// 기본 훅 인스턴스
export const preBuildHook = new PreBuildHook();