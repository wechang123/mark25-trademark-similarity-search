import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis 클라이언트 설정 (환경변수 기반)
let redis: Redis;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      retry: {
        retries: 3
      }
    });
    console.log('✅ Upstash Redis connected successfully');
  } else {
    // 환경변수가 없으면 fallback (개발환경)
    console.warn('⚠️ Upstash Redis not configured, using fallback mode');
    redis = {} as Redis; // fallback object
  }
} catch (error) {
  console.error('❌ Redis connection failed:', error);
  redis = {} as Redis; // fallback object
}

// 다양한 API 엔드포인트별 Rate Limit 설정
export const rateLimits = {
  // 검색 API: 분당 20회
  search: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:search',
  }) : null,

  // 이미지 유사도 검색: 분당 5회 (더 엄격)
  imageSimilarity: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:image-similarity',
  }) : null,

  // 상표 출원: 시간당 3회
  trademarkApplication: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:trademark-application',
  }) : null,

  // 일반 API: 분당 60회
  general: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:general',
  }) : null,

  // 인증 관련: 분당 10회
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }) : null,

  // RPA API: 분당 30회 (내부 시스템이지만 남용 방지)
  rpa: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:rpa',
  }) : null,

  // Admin API: 분당 100회 (관리자 작업을 위해 높은 한도)
  admin: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:admin',
  }) : null,
};

// Rate limit 체크 함수
export async function checkRateLimit(
  limitType: keyof typeof rateLimits,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  try {
    const ratelimit = rateLimits[limitType];
    
    // Redis가 설정되지 않았으면 항상 허용 (개발 환경)
    if (!ratelimit) {
      console.warn(`⚠️ Rate limiting disabled for ${limitType} (Redis not configured)`);
      return {
        success: true,
        limit: 999,
        remaining: 999,
        reset: new Date(Date.now() + 60000), // 1분 후
      };
    }
    
    const result = await ratelimit.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${limitType}:`, error);
    // Rate limit 서비스가 실패하면 기본적으로 허용 (fallback)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}

// IP 주소 추출 함수
export function getClientIP(request: Request): string {
  // Vercel, Cloudflare 등의 프록시 헤더 확인
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // 로컬 개발 환경
  return '127.0.0.1';
}

// 사용자 식별자 생성 (로그인 유저는 user ID, 비로그인은 IP)
export function getUserIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${getClientIP(request)}`;
}

// Rate limit 미들웨어 함수
export async function withRateLimit<T>(
  request: Request,
  limitType: keyof typeof rateLimits,
  userId?: string,
  handler?: () => Promise<T>
): Promise<Response | T> {
  const identifier = getUserIdentifier(request, userId);
  const result = await checkRateLimit(limitType, identifier);
  
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate Limit Exceeded',
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.reset.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.getTime().toString(),
        },
      }
    );
  }

  // Rate limit 통과 시 핸들러 실행
  if (handler) {
    return await handler();
  }

  // 단순 체크만 하는 경우
  return result as any;
}

// Rate limit 헤더 추가 함수
export function addRateLimitHeaders(
  response: Response,
  result: { limit: number; remaining: number; reset: Date }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.getTime().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// 단순한 rate limit 함수 (기존 코드 호환성)
export async function rateLimit(request: Request, userId?: string): Promise<{ success: boolean }> {
  const result = await checkRateLimit('general', getUserIdentifier(request, userId));
  return { success: result.success };
}