/**
 * 🔒 환경변수 보안 검사 유틸리티
 * 개발 및 프로덕션 환경에서 보안 설정을 자동 검증
 */

interface SecurityCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  critical: boolean;
}

/**
 * 환경변수 보안 상태를 검사하는 함수
 */
export function checkEnvironmentSecurity(): SecurityCheck[] {
  const checks: SecurityCheck[] = [];

  // 1. 중요한 환경변수 존재 확인
  const criticalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_KEY',
    'RESEND_API_KEY'
  ];

  criticalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
      checks.push({
        name: `Missing ${envVar}`,
        status: 'FAIL',
        message: `${envVar} 환경변수가 설정되지 않았습니다.`,
        critical: true
      });
    } else if (value.includes('your_') || value.includes('placeholder')) {
      checks.push({
        name: `Invalid ${envVar}`,
        status: 'FAIL',
        message: `${envVar}에 실제 값이 설정되지 않았습니다.`,
        critical: true
      });
    } else {
      checks.push({
        name: `Valid ${envVar}`,
        status: 'PASS',
        message: `${envVar} 올바르게 설정됨`,
        critical: true
      });
    }
  });

  // 2. NEXT_PUBLIC_ 접두사 오남용 검사
  const dangerousPublicKeys = [
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_OPENAI_KEY',
    'NEXT_PUBLIC_RESEND_API_KEY',
    'NEXT_PUBLIC_KAKAO_CLIENT_SECRET',
    'NEXT_PUBLIC_NAVER_CLIENT_SECRET',
    'NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN'
  ];

  dangerousPublicKeys.forEach(key => {
    if (process.env[key]) {
      checks.push({
        name: `Exposed Secret: ${key}`,
        status: 'FAIL',
        message: `⚠️ 민감한 키가 클라이언트에 노출됩니다! ${key}에서 NEXT_PUBLIC_ 접두사를 제거하세요.`,
        critical: true
      });
    }
  });

  // 3. Supabase 키 검증
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (anonKey && serviceKey && anonKey === serviceKey) {
    checks.push({
      name: 'Supabase Key Confusion',
      status: 'FAIL',
      message: 'Anon Key와 Service Role Key가 같습니다. 올바른 키를 사용하세요.',
      critical: true
    });
  }

  // 4. URL 설정 확인
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!appUrl || !siteUrl) {
    checks.push({
      name: 'Missing URLs',
      status: 'WARN',
      message: 'APP_URL 또는 SITE_URL이 설정되지 않았습니다.',
      critical: false
    });
  } else if (appUrl.includes('localhost') || siteUrl.includes('localhost')) {
    checks.push({
      name: 'Development URLs in Production',
      status: 'WARN',
      message: '프로덕션 환경에서 localhost URL을 사용하고 있습니다.',
      critical: false
    });
  }

  // 5. Rate Limiting 설정 확인
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    checks.push({
      name: 'Missing Rate Limiting',
      status: 'WARN',
      message: 'Upstash Redis 설정이 없습니다. Rate limiting이 작동하지 않습니다.',
      critical: false
    });
  }

  // 6. 개발 환경 vs 프로덕션 환경 체크
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDevKeys = Object.keys(process.env).some(key => 
    process.env[key]?.includes('localhost') || 
    process.env[key]?.includes('127.0.0.1') ||
    process.env[key]?.includes('test') ||
    process.env[key]?.includes('dev')
  );

  if (isProduction && hasDevKeys) {
    checks.push({
      name: 'Development Keys in Production',
      status: 'WARN',
      message: '프로덕션 환경에서 개발용 키를 사용하고 있습니다.',
      critical: false
    });
  }

  return checks;
}

/**
 * 보안 검사 결과를 콘솔에 출력
 */
export function logSecurityCheck(): void {
  const checks = checkEnvironmentSecurity();
  const hasErrors = checks.some(check => check.status === 'FAIL');
  const hasWarnings = checks.some(check => check.status === 'WARN');

  console.log('\n🔒 환경변수 보안 검사 결과:');
  console.log('='.repeat(50));

  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : 
                 check.status === 'WARN' ? '⚠️' : '❌';
    const prefix = check.critical ? '[CRITICAL]' : '[INFO]';
    
    console.log(`${icon} ${prefix} ${check.name}: ${check.message}`);
  });

  console.log('='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ 보안 검사 실패! 위의 오류를 수정하세요.');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('환경변수 보안 검사 실패 - 프로덕션 배포 중단');
    }
  } else if (hasWarnings) {
    console.log('⚠️ 보안 경고가 있습니다. 검토를 권장합니다.');
  } else {
    console.log('✅ 모든 보안 검사 통과!');
  }
  
  console.log(''); // 빈 줄
}

/**
 * 환경변수가 안전한지 체크하는 헬퍼 함수
 */
export function isEnvironmentSecure(): boolean {
  const checks = checkEnvironmentSecurity();
  return !checks.some(check => check.status === 'FAIL' && check.critical);
}

/**
 * 특정 환경변수가 클라이언트에 노출되는지 체크
 */
export function isExposedToClient(envVarName: string): boolean {
  return envVarName.startsWith('NEXT_PUBLIC_');
}

/**
 * 민감한 정보가 포함된 환경변수인지 체크
 */
export function isSensitiveEnvVar(envVarName: string): boolean {
  const sensitivePatterns = [
    'key', 'secret', 'token', 'password', 'private', 
    'service_role', 'admin', 'api_key'
  ];
  
  const lowerName = envVarName.toLowerCase();
  return sensitivePatterns.some(pattern => lowerName.includes(pattern));
}

/**
 * 개발 시작 시 자동으로 보안 검사 실행
 */
if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서만 자동 실행
  setTimeout(logSecurityCheck, 1000);
}